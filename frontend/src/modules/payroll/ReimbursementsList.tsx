import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, TextField, MenuItem, Chip, Stack, Alert
} from '@mui/material';
import { Plus } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import * as payrollApi from '../../services/api/payrollApi';
import type { Reimbursement, ReimbursementStatus, ReimbursementType } from '../../types';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import {
  formatCurrency,
  formatDisplayDate,
  getReimbursementStatusColor
} from '../../utils/payrollUtils';

export default function ReimbursementsList() {
  const { currentUser: user, setActiveModule } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    setActiveModule('payroll');
  }, [setActiveModule]);

  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReimbursementStatus | 'ALL'>(
    (searchParams.get('status') as ReimbursementStatus) || 'ALL'
  );
  const [typeFilter, setTypeFilter] = useState<ReimbursementType | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.userRole === 'ADMIN';

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: { status?: string; reimbursementType?: string } = {};

      if (statusFilter !== 'ALL') {
        filters.status = statusFilter;
      }

      if (typeFilter !== 'ALL') {
        filters.reimbursementType = typeFilter;
      }

      const response = await payrollApi.getReimbursements(filters);

      if (response.success && response.data) {
        setReimbursements(response.data);
      } else {
        setError(response.error || 'Failed to load reimbursements');
      }
    } catch (err) {
      console.error('Error fetching reimbursements:', err);
      setError('An error occurred while loading reimbursements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter, location.key]);

  const columns: GridColDef[] = [
    ...(isAdmin
      ? [
        {
          field: 'staffName',
          headerName: 'Employee',
          width: 150,
          headerAlign: 'left' as const,
          align: 'left' as const,
        },
      ]
      : []),
    {
      field: 'expenseDate',
      headerName: 'Expense Date',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value: string) => formatDisplayDate(value),
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
      valueFormatter: (value: number) => formatCurrency(value),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color={getReimbursementStatusColor(params.value)}
        />
      ),
    },
    {
      field: 'submittedAt',
      headerName: 'Submitted',
      width: 110,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value: string) => (value ? new Date(value).toLocaleDateString() : '-'),
    },
    {
      field: 'dateReimbursed',
      headerName: 'Paid Date',
      width: 110,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value: string) => (value ? formatDisplayDate(value) : '-'),
    },
    ...(isAdmin
      ? [
        {
          field: 'reviewerName',
          headerName: 'Reviewed By',
          width: 150,
          headerAlign: 'center' as const,
          align: 'center' as const,
          valueFormatter: (value: string) => value || '-',
        },
      ]
      : []),
  ];

  const totalAmount = reimbursements.reduce((sum, r) => sum + r.amount, 0);
  const pendingCount = reimbursements.filter(r => r.status === 'Pending').length;
  const approvedCount = reimbursements.filter(r => r.status === 'Approved').length;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
            {isAdmin ? 'All Reimbursements' : 'My Reimbursements'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isAdmin
              ? 'View and manage employee reimbursement requests'
              : 'Track your expense reimbursement requests'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => navigate('/payroll/reimbursements/new')}
          size="large"
          sx={{ px: 3, py: 1.5, borderRadius: '12px' }}
        >
          New Reimbursement
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Stats */}
      {isAdmin && (
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Total Amount
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {formatCurrency(totalAmount)}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Pending Approval
            </Typography>
            <Typography variant="h5" fontWeight={700} color="warning.main">
              {pendingCount}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Approved & Awaiting
            </Typography>
            <Typography variant="h5" fontWeight={700} color="info.main">
              {approvedCount}
            </Typography>
          </Paper>
        </Stack>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReimbursementStatus | 'ALL')}
            sx={{ minWidth: 180 }}
            size="small"
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Reimbursed">Reimbursed</MenuItem>
            <MenuItem value="Denied">Denied</MenuItem>
          </TextField>

          <TextField
            select
            label="Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ReimbursementType | 'ALL')}
            sx={{ minWidth: 250 }}
            size="small"
          >
            <MenuItem value="ALL">All Types</MenuItem>
            <MenuItem value="Section 129 Plan - Dependent Care">Section 129 - Dependent Care</MenuItem>
            <MenuItem value="Section 127 Plan - Educational Assistance">Section 127 - Educational Assistance</MenuItem>
            <MenuItem value="Expense Reimbursement">Expense Reimbursement</MenuItem>
          </TextField>

          {(statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setStatusFilter('ALL');
                setTypeFilter('ALL');
              }}
            >
              Clear Filters
            </Button>
          )}

          <Box sx={{ flex: 1 }} />

          <Typography variant="body2" color="text.secondary">
            Showing {reimbursements.length} reimbursement{reimbursements.length !== 1 ? 's' : ''}
          </Typography>
        </Stack>
      </Paper>

      {/* DataGrid */}
      <Paper>
        <DataGrid
          rows={reimbursements}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: {
              sortModel: [{ field: 'submittedAt', sort: 'desc' }],
            },
          }}
          disableRowSelectionOnClick
          autoHeight
          onRowClick={(params) => navigate(`/payroll/reimbursements/${params.row.id}`)}
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
    </Box>
  );
}
