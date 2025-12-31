import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Paper, TextField,
  Stack, Alert, CircularProgress, Tab, Tabs, Divider, InputAdornment
} from '@mui/material';
import { FileUp, FileText, DollarSign, Save, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import * as payrollApi from '../../services/api/payrollApi';
import { parsePaychexPDF, validateParsedPayroll, type ParsedPayrollData } from '../../utils/paychexParser';
import { formatCurrency, getNextPayPeriod, getNextCheckDate } from '../../utils/payrollUtils';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DatePicker } from '@mui/x-date-pickers';

// Form validation schema
const payrollSchema = z.object({
  runDate: z.date({ required_error: 'Run date is required' }),
  checkDate: z.date({ required_error: 'Check date is required' }),
  payPeriodStart: z.date({ required_error: 'Pay period start is required' }),
  payPeriodEnd: z.date({ required_error: 'Pay period end is required' }),
  totalGross: z.number().min(0, 'Must be a positive number'),
  totalNet: z.number().min(0, 'Must be a positive number'),
  totalTaxes: z.number().min(0, 'Must be a positive number').optional().default(0),
  totalDeductions: z.number().min(0, 'Must be a positive number').optional().default(0),
  notes: z.string().optional(),
});

type PayrollFormData = z.infer<typeof payrollSchema>;

export default function PayrollUpload() {
  const { currentUser: user, setActiveModule } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    setActiveModule('payroll');
  }, [setActiveModule]);

  const [tabValue, setTabValue] = useState(0); // 0 = PDF Upload, 1 = Manual Entry
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedPayrollData | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.userRole !== 'ADMIN') {
      navigate('/payroll');
    }
  }, [user, navigate]);

  // Calculate default values for manual entry
  const today = new Date();
  const lastPayPeriodEnd = '2026-01-04'; // From user's data
  const nextPeriod = getNextPayPeriod(lastPayPeriodEnd);
  const defaultCheckDate = getNextCheckDate(today.toISOString().split('T')[0]);

  const {
    control,
    handleSubmit,
    formState: { errors: formErrors },
    setValue,
    watch,
    reset,
  } = useForm<PayrollFormData>({
    resolver: zodResolver(payrollSchema),
    defaultValues: {
      runDate: today,
      checkDate: new Date(defaultCheckDate),
      payPeriodStart: new Date(nextPeriod.start),
      payPeriodEnd: new Date(nextPeriod.end),
      totalGross: 0,
      totalNet: 0,
      totalTaxes: 0,
      totalDeductions: 0,
      notes: '',
    },
  });

  // Watch values for real-time calculation display
  const totalGross = watch('totalGross');
  const totalTaxes = watch('totalTaxes');
  const totalDeductions = watch('totalDeductions');
  const totalNet = watch('totalNet');

  const calculatedNet = totalGross - totalTaxes - totalDeductions;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.includes('pdf')) {
      setError('Please select a PDF file');
      return;
    }

    setPdfFile(file);
    setPdfParsing(true);
    setError(null);
    setParsedData(null);
    setParseErrors([]);

    try {
      const data = await parsePaychexPDF(file);

      if (data) {
        const validationErrors = validateParsedPayroll(data);

        if (validationErrors.length > 0) {
          setParseErrors(validationErrors);
        } else {
          setParsedData(data);

          // Populate manual entry form with parsed data
          setValue('runDate', new Date());
          setValue('checkDate', data.checkDate ? new Date(data.checkDate) : new Date(defaultCheckDate));
          setValue('payPeriodStart', data.payPeriodStart ? new Date(data.payPeriodStart) : new Date(nextPeriod.start));
          setValue('payPeriodEnd', data.payPeriodEnd ? new Date(data.payPeriodEnd) : new Date(nextPeriod.end));
          setValue('totalGross', data.totalGross);
          setValue('totalNet', data.totalNet);
          setValue('totalTaxes', data.totalTaxes);
          setValue('totalDeductions', data.totalDeductions);
          setValue('notes', 'Imported from PDF');
        }
      } else {
        setError('Failed to parse PDF. Please check the file and try again.');
      }
    } catch (err) {
      console.error('PDF parsing error:', err);
      setError('An error occurred while parsing the PDF');
    } finally {
      setPdfParsing(false);
    }
  };

  const onSubmit = async (data: PayrollFormData, isDraft: boolean = false) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        runDate: data.runDate.toISOString().split('T')[0],
        checkDate: data.checkDate.toISOString().split('T')[0],
        payPeriodStart: data.payPeriodStart.toISOString().split('T')[0],
        payPeriodEnd: data.payPeriodEnd.toISOString().split('T')[0],
        totalGross: data.totalGross,
        totalNet: data.totalNet,
        totalTaxes: data.totalTaxes || 0,
        totalDeductions: data.totalDeductions || 0,
        notes: data.notes || '',
        source: (tabValue === 0 ? 'PDF_Import' : 'Manual') as 'PDF_Import' | 'Manual',
      };

      const response = await payrollApi.logPayroll(payload);

      if (response.success) {
        setSuccess(`Payroll run ${isDraft ? 'saved as draft' : 'created'} successfully!`);
        setTimeout(() => {
          navigate('/payroll/history');
        }, 1500);
      } else {
        setError(response.error || 'Failed to create payroll run');
      }
    } catch (err) {
      console.error('Error creating payroll run:', err);
      setError('An error occurred while creating the payroll run');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
          New Payroll Run
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload a Paychex PDF or enter payroll data manually
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

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<FileUp size={20} />} iconPosition="start" label="PDF Upload" />
          <Tab icon={<FileText size={20} />} iconPosition="start" label="Manual Entry" />
        </Tabs>
      </Paper>

      {/* PDF Upload Tab */}
      {tabValue === 0 && (
        <Card sx={{ borderRadius: 4, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                border: 2,
                borderStyle: 'dashed',
                borderColor: dragging ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 6,
                textAlign: 'center',
                bgcolor: dragging ? 'action.hover' : 'background.default',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => document.getElementById('pdf-upload-input')?.click()}
            >
              <input
                id="pdf-upload-input"
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {pdfParsing ? (
                <Stack spacing={2} alignItems="center">
                  <CircularProgress />
                  <Typography>Parsing PDF...</Typography>
                </Stack>
              ) : pdfFile ? (
                <Stack spacing={2} alignItems="center">
                  <FileText size={48} style={{ opacity: 0.5 }} />
                  <Typography variant="h6">{pdfFile.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click to select a different file
                  </Typography>
                </Stack>
              ) : (
                <Stack spacing={2} alignItems="center">
                  <FileUp size={48} style={{ opacity: 0.5 }} />
                  <Typography variant="h6">Drop Paychex PDF here</Typography>
                  <Typography variant="body2" color="text.secondary">
                    or click to browse files
                  </Typography>
                </Stack>
              )}
            </Box>

            {parseErrors.length > 0 && (
              <Alert severity="warning" sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Parsing Warnings:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {parseErrors.map((err, idx) => (
                    <li key={idx}><Typography variant="caption">{err}</Typography></li>
                  ))}
                </ul>
              </Alert>
            )}

            {parsedData && parseErrors.length === 0 && (
              <Alert severity="success" sx={{ mt: 3 }}>
                PDF parsed successfully! Review the data below and submit.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual Entry Form (shared for both tabs after PDF parse) */}
      {(tabValue === 1 || (tabValue === 0 && parsedData)) && (
        <form onSubmit={handleSubmit((data) => onSubmit(data, false))}>
          <Card sx={{ borderRadius: 4, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Payroll Details
              </Typography>

              <Stack spacing={3}>
                {/* Dates Row */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Controller
                    name="runDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Run Date"
                        value={field.value}
                        onChange={field.onChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!formErrors.runDate,
                            helperText: formErrors.runDate?.message,
                          },
                        }}
                      />
                    )}
                  />

                  <Controller
                    name="checkDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Check Date"
                        value={field.value}
                        onChange={field.onChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!formErrors.checkDate,
                            helperText: formErrors.checkDate?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Stack>

                {/* Pay Period Row */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Controller
                    name="payPeriodStart"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Pay Period Start"
                        value={field.value}
                        onChange={field.onChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!formErrors.payPeriodStart,
                            helperText: formErrors.payPeriodStart?.message,
                          },
                        }}
                      />
                    )}
                  />

                  <Controller
                    name="payPeriodEnd"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Pay Period End"
                        value={field.value}
                        onChange={field.onChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!formErrors.payPeriodEnd,
                            helperText: formErrors.payPeriodEnd?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Stack>

                <Divider />

                {/* Financial Fields */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Controller
                    name="totalGross"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Total Gross Pay"
                        type="number"
                        fullWidth
                        required
                        error={!!formErrors.totalGross}
                        helperText={formErrors.totalGross?.message}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        inputProps={{ step: '0.01', min: '0' }}
                      />
                    )}
                  />

                  <Controller
                    name="totalTaxes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Total Taxes"
                        type="number"
                        fullWidth
                        error={!!formErrors.totalTaxes}
                        helperText={formErrors.totalTaxes?.message}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        inputProps={{ step: '0.01', min: '0' }}
                      />
                    )}
                  />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Controller
                    name="totalDeductions"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Total Deductions"
                        type="number"
                        fullWidth
                        error={!!formErrors.totalDeductions}
                        helperText={formErrors.totalDeductions?.message}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        inputProps={{ step: '0.01', min: '0' }}
                      />
                    )}
                  />

                  <Controller
                    name="totalNet"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Total Net Pay"
                        type="number"
                        fullWidth
                        required
                        error={!!formErrors.totalNet}
                        helperText={formErrors.totalNet?.message || `Calculated: ${formatCurrency(calculatedNet)}`}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        inputProps={{ step: '0.01', min: '0' }}
                      />
                    )}
                  />
                </Stack>

                {/* Calculation Check */}
                {Math.abs(calculatedNet - totalNet) > 1 && (
                  <Alert severity="warning">
                    Net Pay ({formatCurrency(totalNet)}) doesn't match calculation: Gross ({formatCurrency(totalGross)}) - Taxes ({formatCurrency(totalTaxes)}) - Deductions ({formatCurrency(totalDeductions)}) = {formatCurrency(calculatedNet)}
                  </Alert>
                )}

                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Notes (optional)"
                      multiline
                      rows={3}
                      fullWidth
                      placeholder="Any additional notes or comments..."
                    />
                  )}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => navigate('/payroll/history')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Send size={20} />}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Payroll Run'}
            </Button>
          </Stack>
        </form>
      )}
    </Box>
  );
}
