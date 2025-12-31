import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Paper,
  Stack, Checkbox, Alert, CircularProgress, Chip, Divider
} from '@mui/material';
import { CheckCircle2, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import * as payrollApi from '../../services/api/payrollApi';
import type { Reimbursement } from '../../types';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import {
  formatCurrency,
  formatDisplayDate,
  getNextPayPeriod,
  getReimbursementStatusColor
} from '../../utils/payrollUtils';
import { DatePicker } from '@mui/x-date-pickers';

export default function PayrollApproval() {
  const { currentUser: user, setActiveModule } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    setActiveModule('payroll');
  }, [setActiveModule]);

  const [approvedReimbursements, setApprovedReimbursements] = useState<Reimbursement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dateReimbursed, setDateReimbursed] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.userRole !== 'ADMIN') {
      navigate('/payroll');
    }
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await payrollApi.getReimbursements({ status: 'Approved' });

      if (response.success && response.data) {
        setApprovedReimbursements(response.data);
      } else {
        setError(response.error || 'Failed to load approved reimbursements');
      }
    } catch (err) {
      console.error('Error fetching approved reimbursements:', err);
      setError('An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === approvedReimbursements.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(approvedReimbursements.map(r => r.id));
    }
  };

  const handleProcessReimbursements = async () => {
    if (selectedIds.length === 0) {
      setError('Please select at least one reimbursement to process');
      return;
    }

    if (!dateReimbursed) {
      setError('Please select a reimbursement date');
      return;
    }

    if (!confirm(`Process ${selectedIds.length} reimbursement(s) with date ${formatDisplayDate(dateReimbursed.toISOString().split('T')[0])}?`)) {
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const dateStr = dateReimbursed.toISOString().split('T')[0]; // yyyy-MM-dd
      const response = await payrollApi.processReimbursements(selectedIds, dateStr);

      if (response.success && response.data) {
        const { processedCount, errors } = response.data;

        if (errors && errors.length > 0) {
          setError(`Processed ${processedCount} successfully. Errors: ${errors.join(', ')}`);
        } else {
          setSuccess(`Successfully processed ${processedCount} reimbursement(s)`);
        }

        // Reset selection and refresh data
        setSelectedIds([]);
        await fetchData();
      } else {
        setError(response.error || 'Failed to process reimbursements');
      }
    } catch (err) {
      console.error('Error processing reimbursements:', err);
      setError('An error occurred while processing reimbursements');
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

  const selectedTotal = approvedReimbursements
    .filter(r => selectedIds.includes(r.id))
    .reduce((sum, r) => sum + r.amount, 0);

  // Calculate next bi-weekly pay period
  const today = new Date();
  const lastPayPeriodEnd = '2026-01-04'; // From user: latest run 12/29/25, period end 1/4/26
  const nextPeriod = getNextPayPeriod(lastPayPeriodEnd);

  const columns: GridColDef[] = [
    {
      field: 'select',
      headerName: '',
      width: 60,
      sortable: false,
      renderHeader: () => (
        <Checkbox
          checked={selectedIds.length === approvedReimbursements.length && approvedReimbursements.length > 0}
          indeterminate={selectedIds.length > 0 && selectedIds.length < approvedReimbursements.length}
          onChange={handleSelectAll}
        />
      ),
      renderCell: (params: GridRenderCellParams) => (
        <Checkbox
          checked={selectedIds.includes(params.row.id)}
          onChange={() => handleToggleSelect(params.row.id)}
        />
      ),
    },
    {
      field: 'staffName',
      headerName: 'Employee',
      width: 150,
      headerAlign: 'left',
      align: 'left',
    },
    {
      field: 'expenseDate',
      headerName: 'Expense Date',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => formatDisplayDate(value),
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 300,
      headerAlign: 'left',
      align: 'left',
    },
    {
      field: 'reimbursementType',
      headerName: 'Type',
      width: 200,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const typeMap: { [key: string]: string } = {
          'Section 129 Plan - Dependent Care': 'Sect 129',
          'Section 127 Plan - Educational Assistance': 'Sect 127',
          'Expense Reimbursement': 'Expense',
        };
        return (
          <Chip
            label={typeMap[params.value] || params.value}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 120,
      type: 'number',
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => formatCurrency(value),
    },
    {
      field: 'submittedAt',
      headerName: 'Submitted',
      width: 110,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      field: 'methodOfReimbursement',
      headerName: 'Method',
      width: 180,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} size="small" variant="outlined" />
      ),
    },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
          Process Reimbursements
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select approved reimbursements to include in the next payroll run
        </Typography>
      </Box>

      {/* Alerts */}
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

      {/* Next Payroll Info */}
      <Card sx={{ borderRadius: 4, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start">
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Calendar size={20} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Next Payroll Period
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Pay Period: {formatDisplayDate(nextPeriod.start)} - {formatDisplayDate(nextPeriod.end)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Bi-weekly schedule (26 runs/year)
              </Typography>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Reimbursement Date
              </Typography>
              <DatePicker
                label="Date Reimbursed"
                value={dateReimbursed}
                onChange={(newValue) => setDateReimbursed(newValue)}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ borderRadius: 4, flex: 1 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: 'info.light',
                  color: 'info.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertCircle size={24} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {approvedReimbursements.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Approved & Awaiting
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4, flex: 1 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: 'success.light',
                  color: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={24} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {selectedIds.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Selected for Processing
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4, flex: 1 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DollarSign size={24} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {formatCurrency(selectedTotal)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Selected Amount
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Action Button */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <CheckCircle2 size={20} />}
          onClick={handleProcessReimbursements}
          disabled={processing || selectedIds.length === 0 || !dateReimbursed}
          sx={{ px: 4 }}
        >
          {processing ? 'Processing...' : `Process ${selectedIds.length} Reimbursement${selectedIds.length !== 1 ? 's' : ''}`}
        </Button>
      </Box>

      {/* Reimbursements DataGrid */}
      <Paper>
        {approvedReimbursements.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <CheckCircle2 size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <Typography color="text.secondary" variant="h6" gutterBottom>
              No Approved Reimbursements
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All approved reimbursements have been processed
            </Typography>
            <Button
              variant="outlined"
              sx={{ mt: 3 }}
              onClick={() => navigate('/payroll/reimbursements')}
            >
              View All Reimbursements
            </Button>
          </Box>
        ) : (
          <DataGrid
            rows={approvedReimbursements}
            columns={columns}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              sorting: {
                sortModel: [{ field: 'submittedAt', sort: 'asc' }],
              },
            }}
            checkboxSelection={false} // Using custom checkbox column
            disableRowSelectionOnClick
            autoHeight
            sx={{
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
            }}
          />
        )}
      </Paper>
    </Box>
  );
}
