import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Divider,
  Collapse,
  IconButton,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { ArrowLeft, Save, Send, X, Check, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import * as ptoApi from '../../services/api/ptoApi';
import { useStore } from '../../store/useStore';
import { calculatePtoHours, isShortNotice, formatPtoDates } from '../../utils/ptoUtils';
import { StatusChip } from '../../components/StatusChip';
import { TypeChip } from '../../components/TypeChip';
import type { PtoRequest } from '../../types';

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

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const [request, setRequest] = useState<PtoRequest | null>(null);
  const [balance, setBalance] = useState<{ availableHours: number; usedHours: number; pendingHours: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState<'draft' | 'submit' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(ptoRequestSchema),
  });

  useEffect(() => {
    if (id) {
      loadRequest();
    }
  }, [id]);

  const loadRequest = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [requestResponse, balanceResponse] = await Promise.all([
        ptoApi.getPtoRequest(id),
        ptoApi.getPtoBalance()
      ]);

      console.log('📥 Loaded request from backend:', requestResponse);

      if (!requestResponse.data) {
        setError('Request not found');
        return;
      }

      const data = requestResponse.data;
      console.log('📋 Setting request state with status:', data.status);
      setRequest(data);

      if (balanceResponse.success && balanceResponse.data) {
        setBalance(balanceResponse.data);
      }

      // Populate form with existing data
      reset({
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isHalfDayStart: data.isHalfDayStart,
        isHalfDayEnd: data.isHalfDayEnd,
        reason: data.reason || '',
      });

      // Auto-enable editing for drafts and change requests
      if (['Draft', 'ChangesRequested'].includes(data.status)) {
        setIsEditing(true);
      }
    } catch (err) {
      console.error('Failed to load PTO request:', err);
      setError('Failed to load request details.');
    } finally {
      setLoading(false);
    }
  };

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const isHalfDayStart = watch('isHalfDayStart');
  const isHalfDayEnd = watch('isHalfDayEnd');

  const totalHours = startDate && endDate
    ? calculatePtoHours(startDate, endDate, isHalfDayStart, isHalfDayEnd)
    : 0;

  const showShortNoticeWarning = startDate ? isShortNotice(startDate) : false;

  const isOwner = request?.userId === currentUser?.id;
  const isManager = currentUser?.userRole === 'MANAGER' || currentUser?.userRole === 'ADMIN';
  const canEdit = isOwner && request && ['Draft', 'ChangesRequested'].includes(request.status);
  const canCancel = isOwner && request && ['Draft', 'Submitted'].includes(request.status);
  const canApprove = isManager && request?.status === 'Submitted';

  const onSubmit = async (data: FormData, submit: boolean = false) => {
    if (!id || !request) return;

    try {
      setSubmitting(true);
      setSubmitAction(submit ? 'submit' : 'draft');
      setError(null);

      const updateData = {
        type: data.type,
        startDate: data.startDate.toISOString().split('T')[0],
        endDate: data.endDate.toISOString().split('T')[0],
        isHalfDayStart: data.isHalfDayStart,
        isHalfDayEnd: data.isHalfDayEnd,
        reason: data.reason,
        totalHours,
        status: submit ? 'Submitted' : request.status,
      };

      console.log('🔍 Submitting PTO request update:', {
        submit,
        requestId: id,
        currentStatus: request.status,
        newStatus: updateData.status,
        fullUpdateData: updateData
      });

      const response = await ptoApi.updatePtoRequest(id, updateData);

      console.log('✅ PTO request update response:', response);

      await loadRequest();
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update PTO request:', err);
      setError('Failed to update request. Please try again.');
    } finally {
      setSubmitting(false);
      setSubmitAction(null);
    }
  };

  const handleCancel = async () => {
    if (!id || !confirm('Are you sure you want to cancel this request?')) return;

    try {
      setSubmitting(true);
      await ptoApi.cancelPtoRequest(id);
      navigate('/pto/requests');
    } catch (err) {
      console.error('Failed to cancel request:', err);
      setError('Failed to cancel request.');
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;

    try {
      setSubmitting(true);
      await ptoApi.approvePtoRequest(id);
      await loadRequest();
    } catch (err) {
      console.error('Failed to approve request:', err);
      setError('Failed to approve request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeny = async () => {
    if (!id) return;

    const reason = prompt('Enter reason for denial (optional):');
    if (reason === null) return;

    try {
      setSubmitting(true);
      await ptoApi.denyPtoRequest(id, reason);
      await loadRequest();
    } catch (err) {
      console.error('Failed to deny request:', err);
      setError('Failed to deny request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!request) {
    return (
      <Alert severity="error">
        Request not found.
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Button
        startIcon={<ArrowLeft size={20} />}
        onClick={() => navigate('/pto/requests')}
        sx={{ mb: 3 }}
      >
        Back to Requests
      </Button>

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            PTO Request Details
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <StatusChip status={request.status} />
            <TypeChip type={request.type} />
          </Stack>
        </Box>

        {canEdit && !isEditing && (
          <Button variant="outlined" onClick={() => setIsEditing(true)}>
            Edit Request
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {balance && request && (request.status === 'Draft' || request.status === 'Submitted') && (
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
                {balance.availableHours}h
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                This Request
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {request.totalHours}h
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Remaining After
              </Typography>
              <Typography
                variant="h6"
                fontWeight={600}
                color={balance.availableHours - request.totalHours < 0 ? 'error.main' : 'success.main'}
              >
                {balance.availableHours - request.totalHours}h
              </Typography>
            </Box>
          </Stack>
          {balance.availableHours - request.totalHours < 0 && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              ⚠️ This request exceeds your available PTO balance
            </Typography>
          )}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        {!isEditing ? (
          <Stack spacing={3}>
            {/* 2-column grid for key details */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Dates
                </Typography>
                <Typography variant="body1">
                  {formatPtoDates(request.startDate, request.endDate)}
                  {request.isHalfDayStart && ' (Half Day Start)'}
                  {request.isHalfDayEnd && ' (Half Day End)'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Total Hours
                </Typography>
                <Typography variant="body1">
                  {request.totalHours} hours ({request.totalHours / 8} day{request.totalHours !== 8 ? 's' : ''})
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Created
                </Typography>
                <Typography variant="body1">
                  {new Date(request.createdAt).toLocaleString()}
                </Typography>
              </Grid>

              {request.approverName && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Assigned Approver
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 500 }}>
                    {request.approverName}
                  </Typography>
                </Grid>
              )}
            </Grid>

            {/* Reason - full width */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Reason
              </Typography>
              <Typography variant="body1">{request.reason}</Typography>
            </Box>

            {request.history && request.history.length > 0 && (
              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.7 },
                    mb: historyExpanded ? 1 : 0
                  }}
                  onClick={() => setHistoryExpanded(!historyExpanded)}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    History ({request.history.length})
                  </Typography>
                  <IconButton size="small">
                    {historyExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </IconButton>
                </Stack>
                <Collapse in={historyExpanded}>
                  <Stack spacing={1}>
                    {request.history.map((entry, idx) => (
                      <Typography key={idx} variant="body2" color="text.secondary">
                        {new Date(entry.timestamp).toLocaleString()} - {entry.action} by {entry.actorName}
                        {entry.note && `: ${entry.note}`}
                      </Typography>
                    ))}
                  </Stack>
                </Collapse>
              </Box>
            )}

            <Divider />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              {canCancel && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<X size={20} />}
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancel Request
                </Button>
              )}

              {canApprove && (
                <>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<XCircle size={20} />}
                    onClick={handleDeny}
                    disabled={submitting}
                  >
                    Deny
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Check size={20} />}
                    onClick={handleApprove}
                    disabled={submitting}
                  >
                    Approve
                  </Button>
                </>
              )}
            </Stack>
          </Stack>
        ) : (
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
                  type="button"
                  variant="outlined"
                  onClick={() => {
                    setIsEditing(false);
                    reset({
                      type: request.type,
                      startDate: new Date(request.startDate),
                      endDate: new Date(request.endDate),
                      isHalfDayStart: request.isHalfDayStart,
                      isHalfDayEnd: request.isHalfDayEnd,
                      reason: request.reason || '',
                    });
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>

                {request.status === 'Draft' && (
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={submitAction === 'draft' ? <CircularProgress size={20} /> : <Save size={20} />}
                    onClick={handleSubmit((data) => onSubmit(data, false))}
                    disabled={submitting}
                  >
                    Save Draft
                  </Button>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={submitAction === 'submit' ? <CircularProgress size={20} /> : <Send size={20} />}
                  disabled={submitting}
                >
                  {request.status === 'Draft' ? 'Submit Request' : 'Save Changes'}
                </Button>
              </Stack>
            </Stack>
          </form>
        )}
      </Paper>
    </Box>
  );
}
