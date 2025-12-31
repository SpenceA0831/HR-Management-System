import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, TextField, MenuItem, Chip, Stack, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider
} from '@mui/material';
import { Plus, DollarSign } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import * as payrollApi from '../../services/api/payrollApi';
import type { PayrollRun, PayrollStatus } from '../../types';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import {
  formatCurrency,
  formatDisplayDate,
  getPayrollStatusColor,
  getRecentYears
} from '../../utils/payrollUtils';

export default function PayrollHistory() {
  const { currentUser: user, setActiveModule } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setActiveModule('payroll');
  }, [setActiveModule]);

  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRun | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

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
      const filters: { year?: number; status?: string } = {};

      if (yearFilter) {
        filters.year = yearFilter;
      }

      if (statusFilter !== 'ALL') {
        filters.status = statusFilter;
      }

      const response = await payrollApi.getPayrollHistory(filters);

      if (response.success && response.data) {
        setPayrollRuns(response.data);
      } else {
        setError(response.error || 'Failed to load payroll history');
      }
    } catch (err) {
      console.error('Error fetching payroll history:', err);
      setError('An error occurred while loading payroll history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [yearFilter, statusFilter, location.key]);

  const handleRowClick = async (payrollId: string) => {
    try {
      const response = await payrollApi.getPayrollRun(payrollId);
      if (response.success && response.data) {
        setSelectedPayroll(response.data);
        setDetailDialogOpen(true);
      }
    } catch (err) {
      console.error('Error fetching payroll details:', err);
    }
  };

  const availableYears = getRecentYears(5);

  const columns: GridColDef[] = [
    {
      field: 'runDate',
      headerName: 'Run Date',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => formatDisplayDate(value),
    },
    {
      field: 'checkDate',
      headerName: 'Check Date',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => formatDisplayDate(value),
    },
    {
      field: 'payPeriod',
      headerName: 'Pay Period',
      width: 220,
      headerAlign: 'center',
      align: 'center',
      valueGetter: (_value, row) =>
        `${formatDisplayDate(row.payPeriodStart)} - ${formatDisplayDate(row.payPeriodEnd)}`,
    },
    {
      field: 'totalGross',
      headerName: 'Gross Pay',
      width: 130,
      type: 'number',
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => formatCurrency(value),
    },
    {
      field: 'totalNet',
      headerName: 'Net Pay',
      width: 130,
      type: 'number',
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => formatCurrency(value),
    },
    {
      field: 'totalTaxes',
      headerName: 'Taxes',
      width: 120,
      type: 'number',
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => formatCurrency(value),
    },
    {
      field: 'totalDeductions',
      headerName: 'Deductions',
      width: 120,
      type: 'number',
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => formatCurrency(value),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color={getPayrollStatusColor(params.value)}
        />
      ),
    },
    {
      field: 'source',
      headerName: 'Source',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value === 'PDF_Import' ? 'PDF' : 'Manual'}
          size="small"
          variant="outlined"
        />
      ),
    },
  ];

  const filteredTotal = payrollRuns.reduce((sum, run) => sum + run.totalNet, 0);

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
            Payroll History
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage all payroll runs
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => navigate('/payroll/upload')}
          size="large"
          sx={{ px: 3, py: 1.5, borderRadius: '12px' }}
        >
          New Payroll Run
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            select
            label="Year"
            value={yearFilter}
            onChange={(e) => setYearFilter(Number(e.target.value))}
            sx={{ minWidth: 120 }}
            size="small"
          >
            <MenuItem value={0}>All Years</MenuItem>
            {availableYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PayrollStatus | 'ALL')}
            sx={{ minWidth: 150 }}
            size="small"
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="Draft">Draft</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Processed">Processed</MenuItem>
          </TextField>

          {(yearFilter !== new Date().getFullYear() || statusFilter !== 'ALL') && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setYearFilter(new Date().getFullYear());
                setStatusFilter('ALL');
              }}
            >
              Clear Filters
            </Button>
          )}

          <Box sx={{ flex: 1 }} />

          <Typography variant="body2" color="text.secondary">
            Total Net: {formatCurrency(filteredTotal)} • {payrollRuns.length} run{payrollRuns.length !== 1 ? 's' : ''}
          </Typography>
        </Stack>
      </Paper>

      {/* DataGrid */}
      <Paper>
        <DataGrid
          rows={payrollRuns}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: {
              sortModel: [{ field: 'runDate', sort: 'desc' }],
            },
          }}
          disableRowSelectionOnClick
          autoHeight
          onRowClick={(params) => handleRowClick(params.row.id)}
          sx={{
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
          }}
        />
      </Paper>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <DollarSign size={24} />
            <Typography variant="h6">Payroll Run Details</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedPayroll && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Run Date</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatDisplayDate(selectedPayroll.runDate)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">Check Date</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatDisplayDate(selectedPayroll.checkDate)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">Pay Period</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatDisplayDate(selectedPayroll.payPeriodStart)} - {formatDisplayDate(selectedPayroll.payPeriodEnd)}
                </Typography>
              </Box>

              <Divider />

              <Stack direction="row" spacing={4}>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">Gross Pay</Typography>
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    {formatCurrency(selectedPayroll.totalGross)}
                  </Typography>
                </Box>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">Taxes</Typography>
                  <Typography variant="h6" fontWeight={700} color="error.main">
                    {formatCurrency(selectedPayroll.totalTaxes)}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={4}>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">Deductions</Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {formatCurrency(selectedPayroll.totalDeductions)}
                  </Typography>
                </Box>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">Net Pay</Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    {formatCurrency(selectedPayroll.totalNet)}
                  </Typography>
                </Box>
              </Stack>

              <Divider />

              <Box>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedPayroll.status}
                    color={getPayrollStatusColor(selectedPayroll.status)}
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">Source</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedPayroll.source === 'PDF_Import' ? 'PDF Import' : 'Manual Entry'}
                    variant="outlined"
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">Processed By</Typography>
                <Typography variant="body1">{selectedPayroll.processedBy}</Typography>
              </Box>

              {selectedPayroll.notes && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {selectedPayroll.notes}
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography variant="caption" color="text.secondary">Created</Typography>
                <Typography variant="body2">
                  {new Date(selectedPayroll.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
