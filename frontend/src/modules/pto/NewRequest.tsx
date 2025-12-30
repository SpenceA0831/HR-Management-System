import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { ArrowLeft, Save, Send } from 'lucide-react';
import * as ptoApi from '../../services/api/ptoApi';
import { useStore } from '../../store/useStore';
import { calculatePtoHours, isShortNotice } from '../../utils/ptoUtils';

const ptoRequestSchema = z.object({
  type: z.enum(['Vacation', 'Sick', 'Other'] as const),
  startDate: z.date({ message: 'Start date is required' }),
  endDate: z.date({ message: 'End date is required' }),
  isHalfDayStart: z.boolean(),
  isHalfDayEnd: z.boolean(),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be less than 500 characters'),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
});

type FormData = z.infer<typeof ptoRequestSchema>;

export default function NewRequest() {
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const [balance, setBalance] = useState<{ availableHours: number; usedHours: number; pendingHours: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState<'draft' | 'submit' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(ptoRequestSchema),
    defaultValues: {
      type: 'Vacation',
      startDate: undefined,
      endDate: undefined,
      isHalfDayStart: false,
      isHalfDayEnd: false,
      reason: '',
    },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const isHalfDayStart = watch('isHalfDayStart');
  const isHalfDayEnd = watch('isHalfDayEnd');

  const totalHours = startDate && endDate
    ? calculatePtoHours(startDate, endDate, isHalfDayStart, isHalfDayEnd)
    : 0;

  // Calculate actual available hours
  const actualAvailable = balance
    ? (balance.totalHours || balance.availableHours) - (balance.usedHours || 0) - (balance.pendingHours || 0)
    : 0;

  const showShortNoticeWarning = startDate ? isShortNotice(startDate) : false;

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const response = await ptoApi.getPtoBalance();
        if (response.success && response.data) {
          setBalance(response.data);
        }
      } catch (error) {
        console.error('Failed to load PTO balance:', error);
      }
    };
    loadBalance();
  }, []);

  const onSubmit = async (data: FormData, submit: boolean = false) => {
    if (!currentUser) return;

    try {
      setSubmitting(true);
      setSubmitAction(submit ? 'submit' : 'draft');
      setError(null);

      const requestData = {
        type: data.type,
        startDate: data.startDate.toISOString().split('T')[0],
        endDate: data.endDate.toISOString().split('T')[0],
        isHalfDayStart: data.isHalfDayStart,
        isHalfDayEnd: data.isHalfDayEnd,
        reason: data.reason,
        status: submit ? 'Submitted' : 'Draft',
      };

      console.log('Creating PTO request with data:', requestData);
      await ptoApi.createPtoRequest(requestData);

      navigate('/pto/requests');
    } catch (err) {
      console.error('Failed to create PTO request:', err);
      setError('Failed to create request. Please try again.');
    } finally {
      setSubmitting(false);
      setSubmitAction(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Button
        startIcon={<ArrowLeft size={20} />}
        onClick={() => navigate('/pto/requests')}
        sx={{ mb: 3 }}
      >
        Back to Requests
      </Button>

      <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
        New PTO Request
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {balance && totalHours > 0 && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          icon={false}
        >
          <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Available PTO
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {actualAvailable}h
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                This Request
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {totalHours}h
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Remaining After
              </Typography>
              <Typography
                variant="h6"
                fontWeight={600}
                color={actualAvailable - totalHours < 0 ? 'error.main' : 'success.main'}
              >
                {actualAvailable - totalHours}h
              </Typography>
            </Box>
          </Stack>
          {actualAvailable - totalHours < 0 && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              ⚠️ This request exceeds your available PTO balance
            </Typography>
          )}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit((data) => onSubmit(data, true))}>
          <Stack spacing={3}>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="PTO Type"
                  error={!!errors.type}
                  helperText={errors.type?.message}
                  required
                >
                  <MenuItem value="Vacation">Vacation</MenuItem>
                  <MenuItem value="Sick">Sick Leave</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              )}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="Start Date"
                    slotProps={{
                      textField: {
                        error: !!errors.startDate,
                        helperText: errors.startDate?.message,
                        required: true,
                      },
                    }}
                  />
                )}
              />

              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="End Date"
                    minDate={startDate}
                    slotProps={{
                      textField: {
                        error: !!errors.endDate,
                        helperText: errors.endDate?.message,
                        required: true,
                      },
                    }}
                  />
                )}
              />
            </Box>

            <Stack direction="row" spacing={2}>
              <Controller
                name="isHalfDayStart"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Half Day Start"
                  />
                )}
              />
              <Controller
                name="isHalfDayEnd"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Half Day End"
                  />
                )}
              />
            </Stack>

            {totalHours > 0 && (
              <Alert severity="info">
                Total hours: {totalHours} ({totalHours / 8} day{totalHours !== 8 ? 's' : ''})
              </Alert>
            )}

            {showShortNoticeWarning && startDate && (
              <Alert severity="warning">
                <strong>Short Notice:</strong> This request is being submitted with less than 14 days notice.
                Approval may be subject to additional review.
              </Alert>
            )}

            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Reason"
                  multiline
                  rows={4}
                  error={!!errors.reason}
                  helperText={errors.reason?.message}
                  placeholder="Please provide a reason for your PTO request..."
                  required
                />
              )}
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate('/pto/requests')}
                disabled={submitting}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="outlined"
                startIcon={submitAction === 'draft' ? <CircularProgress size={20} /> : <Save size={20} />}
                onClick={handleSubmit((data) => onSubmit(data, false))}
                disabled={submitting}
              >
                Save as Draft
              </Button>

              <Button
                type="submit"
                variant="contained"
                startIcon={submitAction === 'submit' ? <CircularProgress size={20} /> : <Send size={20} />}
                disabled={submitting}
              >
                Submit Request
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
