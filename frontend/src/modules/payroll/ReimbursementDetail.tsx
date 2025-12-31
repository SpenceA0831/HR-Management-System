import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Paper, TextField,
  Stack, Alert, CircularProgress, Chip, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import { ArrowLeft, CheckCircle2, XCircle, DollarSign } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import * as payrollApi from '../../services/api/payrollApi';
import type { Reimbursement } from '../../types';
import {
  formatCurrency,
  formatDisplayDate,
  getReimbursementStatusColor
} from '../../utils/payrollUtils';

export default function ReimbursementDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser: user, setActiveModule } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    setActiveModule('payroll');
  }, [setActiveModule]);

  const [reimbursement, setReimbursement] = useState<Reimbursement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Denial dialog state
  const [denyDialogOpen, setDenyDialogOpen] = useState(false);
  const [denialComment, setDenialComment] = useState('');

  // Approval comment (optional)
  const [approvalComment, setApprovalComment] = useState('');

  const isManager = user?.userRole === 'MANAGER' || user?.userRole === 'ADMIN';

  const fetchData = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await payrollApi.getReimbursement(id);

      if (response.success && response.data) {
        setReimbursement(response.data);
      } else {
        setError(response.error || 'Failed to load reimbursement details');
      }
    } catch (err) {
      console.error('Error fetching reimbursement:', err);
      setError('An error occurred while loading reimbursement details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleApprove = async () => {
    if (!reimbursement) return;

    if (!confirm('Are you sure you want to approve this reimbursement request?')) {
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await payrollApi.approveReimbursement(
        reimbursement.id,
        approvalComment || undefined
      );

      if (response.success) {
        setSuccess('Reimbursement approved successfully!');
        await fetchData(); // Refresh data
        setApprovalComment('');
      } else {
        setError(response.error || 'Failed to approve reimbursement');
      }
    } catch (err) {
      console.error('Error approving reimbursement:', err);
      setError('An error occurred while approving the reimbursement');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeny = async () => {
    if (!reimbursement) return;

    if (!denialComment.trim()) {
      setError('Please provide a reason for denial');
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await payrollApi.denyReimbursement(
        reimbursement.id,
        denialComment
      );

      if (response.success) {
        setSuccess('Reimbursement denied');
        await fetchData(); // Refresh data
        setDenyDialogOpen(false);
        setDenialComment('');
      } else {
        setError(response.error || 'Failed to deny reimbursement');
      }
    } catch (err) {
      console.error('Error denying reimbursement:', err);
      setError('An error occurred while denying the reimbursement');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!reimbursement) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Alert severity="error">Reimbursement not found</Alert>
        <Button onClick={() => navigate('/payroll/reimbursements')} sx={{ mt: 2 }}>
          Back to Reimbursements
        </Button>
      </Box>
    );
  }

  const canApprove = isManager && reimbursement.status === 'Pending';
  const typeMap: { [key: string]: string } = {
    'Section 129 Plan - Dependent Care': 'Section 129',
    'Section 127 Plan - Educational Assistance': 'Section 127',
    'Expense Reimbursement': 'Expense',
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowLeft size={18} />}
          onClick={() => navigate('/payroll/reimbursements')}
          sx={{ mb: 2 }}
        >
          Back to Reimbursements
        </Button>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
          Reimbursement Details
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={reimbursement.status}
            color={getReimbursementStatusColor(reimbursement.status)}
          />
          <Chip
            label={typeMap[reimbursement.reimbursementType] || reimbursement.reimbursementType}
            variant="outlined"
          />
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Main Details Card */}
      <Card sx={{ borderRadius: 4, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* Employee Info */}
            <Box>
              <Typography variant="caption" color="text.secondary">
                Employee
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {reimbursement.staffName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {reimbursement.staffEmail}
              </Typography>
            </Box>

            <Divider />

            {/* Expense Details */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary">
                  Expense Date
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatDisplayDate(reimbursement.expenseDate)}
                </Typography>
              </Box>

              <Box flex={1}>
                <Typography variant="caption" color="text.secondary">
                  Amount
                </Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  {formatCurrency(reimbursement.amount)}
                </Typography>
              </Box>
            </Stack>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Reimbursement Type
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {reimbursement.reimbursementType}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {reimbursement.description}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Method of Reimbursement
              </Typography>
              <Typography variant="body1">
                {reimbursement.methodOfReimbursement}
              </Typography>
            </Box>

            {reimbursement.notes && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Additional Notes
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {reimbursement.notes}
                </Typography>
              </Box>
            )}

            <Divider />

            {/* Status Details */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary">
                  Submitted
                </Typography>
                <Typography variant="body2">
                  {new Date(reimbursement.submittedAt).toLocaleString()}
                </Typography>
              </Box>

              {reimbursement.reviewerName && (
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    Reviewed By
                  </Typography>
                  <Typography variant="body2">
                    {reimbursement.reviewerName}
                  </Typography>
                </Box>
              )}

              {reimbursement.dateReimbursed && (
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    Date Reimbursed
                  </Typography>
                  <Typography variant="body2">
                    {formatDisplayDate(reimbursement.dateReimbursed)}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Manager Actions */}
      {canApprove && (
        <Card sx={{ borderRadius: 4, mb: 3, bgcolor: 'action.hover' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Review Actions
            </Typography>

            <TextField
              label="Approval Comment (Optional)"
              fullWidth
              multiline
              rows={2}
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              placeholder="Add any notes or comments..."
              sx={{ mb: 2 }}
            />

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<XCircle size={18} />}
                onClick={() => setDenyDialogOpen(true)}
                disabled={processing}
                fullWidth
              >
                Deny
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={processing ? <CircularProgress size={18} color="inherit" /> : <CheckCircle2 size={18} />}
                onClick={handleApprove}
                disabled={processing}
                fullWidth
              >
                {processing ? 'Processing...' : 'Approve'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Status Info for Approved/Reimbursed */}
      {reimbursement.status === 'Approved' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          This reimbursement has been approved and is awaiting processing in the next payroll run.
        </Alert>
      )}

      {reimbursement.status === 'Reimbursed' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          This reimbursement was processed on {formatDisplayDate(reimbursement.dateReimbursed!)}.
        </Alert>
      )}

      {reimbursement.status === 'Denied' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          This reimbursement request was denied.
          {reimbursement.notes && reimbursement.notes.includes('Denial reason') && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Reason:</strong> {reimbursement.notes.split('Denial reason')[1]}
            </Typography>
          )}
        </Alert>
      )}

      {/* Denial Dialog */}
      <Dialog open={denyDialogOpen} onClose={() => !processing && setDenyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Deny Reimbursement Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for denying this reimbursement request. This will be visible to the employee.
          </Typography>
          <TextField
            label="Denial Reason *"
            fullWidth
            multiline
            rows={4}
            value={denialComment}
            onChange={(e) => setDenialComment(e.target.value)}
            placeholder="Explain why this request is being denied..."
            error={!denialComment.trim() && denyDialogOpen}
            helperText={!denialComment.trim() && denyDialogOpen ? 'Reason is required' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDenyDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleDeny}
            color="error"
            variant="contained"
            disabled={processing || !denialComment.trim()}
            startIcon={processing ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {processing ? 'Denying...' : 'Deny Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
