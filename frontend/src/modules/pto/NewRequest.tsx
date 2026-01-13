import { useState, useEffect, useMemo } from 'react';
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
import { calculatePtoDays, isShortNotice } from '../../utils/ptoUtils';
import type { BlackoutDate } from '../../types';
import { parseISO, isWithinInterval } from 'date-fns';

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

/**
 * Check if a date range conflicts with any blackout dates
 */
function checkBlackoutConflict(
  startDate: Date | undefined,
  endDate: Date | undefined,
  blackoutDates: BlackoutDate[]
): { hasConflict: boolean; conflictingDate: BlackoutDate | null } {
  if (!startDate || !endDate || blackoutDates.length === 0) {
    return { hasConflict: false, conflictingDate: null };
  }

  for (const blackout of blackoutDates) {
    const blackoutStart = parseISO(blackout.date);
    const blackoutEnd = blackout.endDate ? parseISO(blackout.endDate) : blackoutStart;

    // Check if any day in the request range overlaps with blackout range
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      if (isWithinInterval(currentDate, { start: blackoutStart, end: blackoutEnd })) {
        return { hasConflict: true, conflictingDate: blackout };
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return { hasConflict: false, conflictingDate: null };
}

export default function NewRequest() {
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const [balance, setBalance] = useState<{ totalDays?: number; availableDays: number; usedDays: number; pendingDays: number } | null>(null);
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([]);
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

  const totalDays = startDate && endDate
    ? calculatePtoDays(startDate, endDate, isHalfDayStart, isHalfDayEnd)
    : 0;

  // Calculate actual available days
  const actualAvailable = balance
    ? (balance.totalDays ?? 0) - (balance.usedDays ?? 0) - (balance.pendingDays ?? 0)
    : 0;

  const showShortNoticeWarning = startDate ? isShortNotice(startDate) : false;

  // Check for blackout date conflicts
  const blackoutConflict = useMemo(() => {
    return checkBlackoutConflict(startDate, endDate, blackoutDates);
  }, [startDate, endDate, blackoutDates]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load balance and blackout dates in parallel
        const [balResponse, blackoutResponse] = await Promise.all([
          ptoApi.getPtoBalance(),
          ptoApi.getBlackoutDates()
        ]);

        if (balResponse.success && balResponse.data) {
          setBalance(balResponse.data);
        }

        if (blackoutResponse.success && blackoutResponse.data) {
          setBlackoutDates(blackoutResponse.data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  const onSubmit = async (data: FormData, submit: boolean = false) => {
    if (!currentUser) return;

    // Block submission if there's a blackout conflict
    if (submit && blackoutConflict.hasConflict) {
      setError(`Cannot submit: Your request conflicts with a blackout date (${blackoutConflict.conflictingDate?.name}).`);
      return;
    }

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

      navigate('/pto');
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
        onClick={() => navigate('/pto')}
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
        New PTO Request
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {balance && totalDays > 0 && (
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
                {actualAvailable} days
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                This Request
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {totalDays} {totalDays === 1 ? 'day' : 'days'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Remaining After
              </Typography>
              <Typography
                variant="h6"
                fontWeight={600}
                color={actualAvailable - totalDays < 0 ? 'error.main' : 'success.main'}
              >
                {actualAvailable - totalDays} days
              </Typography>
            </Box>
          </Stack>
          {actualAvailable - totalDays < 0 && (
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

            {totalDays > 0 && (
              <Alert severity="info">
                Total: {totalDays} {totalDays === 1 ? 'day' : 'days'}
              </Alert>
            )}

            {showShortNoticeWarning && startDate && (
              <Alert severity="warning">
                <strong>Short Notice:</strong> This request is being submitted with less than 14 days notice.
                Approval may be subject to additional review.
              </Alert>
            )}

            {blackoutConflict.hasConflict && (
              <Alert severity="error">
                <strong>Blackout Date Conflict:</strong> Your request overlaps with a blackout period
                ({blackoutConflict.conflictingDate?.name}). PTO requests cannot be submitted during blackout dates.
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
                onClick={() => navigate('/pto')}
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
                disabled={submitting || blackoutConflict.hasConflict}
              >
                Submit Request
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box >
  );
}
