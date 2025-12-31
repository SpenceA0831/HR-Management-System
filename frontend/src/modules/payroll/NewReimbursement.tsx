import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, TextField, MenuItem,
  Stack, Alert, CircularProgress, InputAdornment
} from '@mui/material';
import { Send, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import * as payrollApi from '../../services/api/payrollApi';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DatePicker } from '@mui/x-date-pickers';

// Form validation schema
const reimbursementSchema = z.object({
  expenseDate: z.date(),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  amount: z.number().min(0.01, 'Amount must be greater than zero'),
  reimbursementType: z.enum([
    'Section 129 Plan - Dependent Care',
    'Section 127 Plan - Educational Assistance',
    'Expense Reimbursement',
  ]),
  methodOfReimbursement: z.enum([
    'Payroll Expense Reimbursement',
    'Check',
    'Direct Deposit',
  ]).optional(),
  notes: z.string().optional(),
});

type ReimbursementFormData = z.infer<typeof reimbursementSchema>;

export default function NewReimbursement() {
  const { setActiveModule } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    setActiveModule('payroll');
  }, [setActiveModule]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors: formErrors },
    watch,
  } = useForm<ReimbursementFormData>({
    resolver: zodResolver(reimbursementSchema),
    defaultValues: {
      expenseDate: new Date(),
      description: '',
      amount: 0,
      reimbursementType: 'Expense Reimbursement',
      methodOfReimbursement: 'Payroll Expense Reimbursement',
      notes: '',
    },
  });

  const reimbursementType = watch('reimbursementType');

  const onSubmit = async (data: ReimbursementFormData) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        expenseDate: data.expenseDate.toISOString().split('T')[0], // yyyy-MM-dd
        description: data.description,
        amount: data.amount,
        reimbursementType: data.reimbursementType,
        methodOfReimbursement: data.methodOfReimbursement || 'Payroll Expense Reimbursement',
        notes: data.notes || '',
      };

      const response = await payrollApi.createReimbursement(payload);

      if (response.success && response.data) {
        setSuccess('Reimbursement request submitted successfully!');
        setTimeout(() => {
          navigate('/payroll/reimbursements');
        }, 1500);
      } else {
        setError(response.error || 'Failed to create reimbursement request');
      }
    } catch (err) {
      console.error('Error creating reimbursement:', err);
      setError('An error occurred while submitting the reimbursement request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
          New Reimbursement Request
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Submit a new expense reimbursement request
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card sx={{ borderRadius: 4, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={3}>
              {/* Expense Date */}
              <Controller
                name="expenseDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Expense Date *"
                    value={field.value}
                    onChange={field.onChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!formErrors.expenseDate,
                        helperText: formErrors.expenseDate?.message || 'Date the expense was incurred',
                      },
                    }}
                  />
                )}
              />

              {/* Reimbursement Type */}
              <Controller
                name="reimbursementType"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Reimbursement Type *"
                    fullWidth
                    error={!!formErrors.reimbursementType}
                    helperText={formErrors.reimbursementType?.message || 'Select the type of reimbursement'}
                  >
                    <MenuItem value="Expense Reimbursement">Expense Reimbursement</MenuItem>
                    <MenuItem value="Section 127 Plan - Educational Assistance">
                      Section 127 Plan - Educational Assistance
                    </MenuItem>
                    <MenuItem value="Section 129 Plan - Dependent Care">
                      Section 129 Plan - Dependent Care
                    </MenuItem>
                  </TextField>
                )}
              />

              {/* Type-specific info */}
              {reimbursementType === 'Section 127 Plan - Educational Assistance' && (
                <Alert severity="info">
                  <Typography variant="caption">
                    <strong>Section 127 Plan:</strong> Educational assistance programs allow tax-free reimbursement
                    for job-related education expenses. Eligible expenses include tuition, fees, books, supplies, and equipment.
                  </Typography>
                </Alert>
              )}

              {reimbursementType === 'Section 129 Plan - Dependent Care' && (
                <Alert severity="info">
                  <Typography variant="caption">
                    <strong>Section 129 Plan:</strong> Dependent care assistance programs allow tax-free reimbursement
                    for dependent care expenses (child or elder care) that enable you to work.
                  </Typography>
                </Alert>
              )}

              {/* Amount */}
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Amount *"
                    type="number"
                    fullWidth
                    error={!!formErrors.amount}
                    helperText={formErrors.amount?.message || 'Enter the reimbursement amount'}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DollarSign size={18} />
                        </InputAdornment>
                      ),
                    }}
                    inputProps={{ step: '0.01', min: '0' }}
                  />
                )}
              />

              {/* Description */}
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description *"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!formErrors.description}
                    helperText={formErrors.description?.message || 'Describe the expense (e.g., "Online course for project management certification")'}
                    placeholder="Describe the expense and its purpose..."
                  />
                )}
              />

              {/* Method of Reimbursement */}
              <Controller
                name="methodOfReimbursement"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Method of Reimbursement"
                    fullWidth
                    error={!!formErrors.methodOfReimbursement}
                    helperText={formErrors.methodOfReimbursement?.message || 'How you would like to receive reimbursement'}
                  >
                    <MenuItem value="Payroll Expense Reimbursement">Payroll Expense Reimbursement (Default)</MenuItem>
                    <MenuItem value="Check">Check</MenuItem>
                    <MenuItem value="Direct Deposit">Direct Deposit</MenuItem>
                  </TextField>
                )}
              />

              {/* Notes */}
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Additional Notes (Optional)"
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Any additional information, receipt references, or attachments..."
                  />
                )}
              />

              {/* Info Alert */}
              <Alert severity="info">
                <Typography variant="caption">
                  <strong>Note:</strong> Your request will be submitted for approval. You'll be notified when it's reviewed.
                  Please attach or reference any supporting receipts or documentation in the notes field.
                </Typography>
              </Alert>
            </Stack>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={() => navigate('/payroll/reimbursements')}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            type="submit"
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Send size={20} />}
            disabled={submitting}
            size="large"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
