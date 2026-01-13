import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers';
import { Plus, Edit, X, ArrowLeft } from 'lucide-react';
import * as ptoApi from '../../services/api/ptoApi';
import { useStore } from '../../store/useStore';
import { StatusChip } from '../../components/StatusChip';
import { TypeChip } from '../../components/TypeChip';
import type { PtoRequest, PtoStatus } from '../../types';
import { formatPtoDates } from '../../utils/ptoUtils';

export default function RequestsList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useStore();
  const [requests, setRequests] = useState<PtoRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize filters from URL params
  const initialStatus = searchParams.get('status') as PtoStatus | null;
  const [statusFilter, setStatusFilter] = useState<PtoStatus | 'ALL'>(initialStatus || 'ALL');
  const [nameFilter, setNameFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await ptoApi.getPtoRequests();
      setRequests(response.data || []);
    } catch (error) {
      console.error('Failed to load PTO requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique user names for filter dropdown
  const uniqueUsers = Array.from(new Set(requests.map(r => r.userName))).sort();

  // Client-side filtering
  const filteredRequests = requests.filter((req) => {
    // Status filter
    if (statusFilter !== 'ALL' && req.status !== statusFilter) {
      return false;
    }

    // Employee filter (exact match)
    if (nameFilter && req.userName !== nameFilter) {
      return false;
    }

    // Date range filter
    if (startDateFilter) {
      const reqStartDate = new Date(req.startDate);
      if (reqStartDate < startDateFilter) {
        return false;
      }
    }
    if (endDateFilter) {
      const reqEndDate = new Date(req.endDate);
      if (reqEndDate > endDateFilter) {
        return false;
      }
    }

    return true;
  });

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;

    try {
      await ptoApi.cancelPtoRequest(id);
      await loadRequests();
    } catch (error) {
      console.error('Failed to cancel request:', error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      console.log('Approving request:', id);
      const response = await ptoApi.approvePtoRequest(id);
      console.log('Approve response:', response);

      if (response.success) {
        alert('Request approved successfully!');
        await loadRequests();
      } else {
        alert(`Failed to approve: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to approve request:', error);
      alert('Failed to approve request. Please check console for details.');
    }
  };

  const handleDeny = async (id: string) => {
    const reason = prompt('Enter reason for denial:');
    if (reason === null) return; // User cancelled
    if (!reason.trim()) {
      alert('Reason is required when denying a request');
      return;
    }

    try {
      console.log('Denying request:', id, 'with reason:', reason);
      const response = await ptoApi.denyPtoRequest(id, reason);
      console.log('Deny response:', response);

      if (response.success) {
        alert('Request denied successfully!');
        await loadRequests();
      } else {
        alert(`Failed to deny: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to deny request:', error);
      alert('Failed to deny request. Please check console for details.');
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'userName',
      headerName: 'Employee',
      width: 150,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 100,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <TypeChip type={params.value} />
      ),
    },
    {
      field: 'dates',
      headerName: 'Dates',
      width: 180,
      headerAlign: 'center',
      align: 'center',
      valueGetter: (_value, row) =>
        formatPtoDates(row.startDate, row.endDate),
    },
    {
      field: 'totalDays',
      headerName: 'Days',
      width: 80,
      type: 'number',
      headerAlign: 'center',
      align: 'center',
      valueGetter: (_value, row) => {
        // Backward compatibility: use totalDays if present, else convert totalHours
        const days = row.totalDays ?? (row.totalHours !== undefined ? row.totalHours / 8 : 0);
        return days;
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <StatusChip status={params.value} />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 110,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      field: 'reason',
      headerName: 'Reason',
      width: 250,
      headerAlign: 'left',
      align: 'left',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      resizable: false,
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const request = params.row as PtoRequest;
        const isOwner = request.userId === currentUser?.id;
        const isAdmin = currentUser?.userRole === 'ADMIN';
        const canCancel = isOwner && ['Draft', 'Submitted'].includes(request.status);
        const isAssignedApprover = request.approverId === currentUser?.id;
        const canApprove = isAssignedApprover && !isOwner && request.status === 'Submitted';

        return (
          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => navigate(`/pto/requests/${request.id}`)}
              >
                <Edit size={18} />
              </IconButton>
            </Tooltip>

            {canCancel && (
              <Tooltip title="Cancel">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleCancel(request.id)}
                >
                  <X size={18} />
                </IconButton>
              </Tooltip>
            )}

            {canApprove && (
              <>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  onClick={() => handleApprove(request.id)}
                  sx={{ minWidth: 0, px: 1 }}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => handleDeny(request.id)}
                  sx={{ minWidth: 0, px: 1 }}
                >
                  Deny
                </Button>
              </>
            )}
          </Stack>
        );
      },
    },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Button
        startIcon={<ArrowLeft size={20} />}
        onClick={() => navigate('/pto')}
        sx={{ mb: 3 }}
      >
        Back to PTO Dashboard
      </Button>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4" fontWeight={700}>
          PTO Requests
        </Typography>

        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => navigate('/pto/requests/new')}
          size="large"
          sx={{ px: 3, py: 1.5, borderRadius: '12px' }}
        >
          New Request
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PtoStatus | 'ALL')}
              sx={{ minWidth: 180 }}
              size="small"
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="Draft">Draft</MenuItem>
              <MenuItem value="Submitted">Submitted</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Denied">Denied</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
              <MenuItem value="ChangesRequested">Changes Requested</MenuItem>
            </TextField>

            <TextField
              select
              label="Employee"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              sx={{ minWidth: 200 }}
              size="small"
            >
              <MenuItem value="">All Employees</MenuItem>
              {uniqueUsers.map((userName) => (
                <MenuItem key={userName} value={userName}>
                  {userName}
                </MenuItem>
              ))}
            </TextField>

            <DatePicker
              label="Start Date From"
              value={startDateFilter}
              onChange={(newValue) => setStartDateFilter(newValue)}
              slotProps={{
                textField: { size: 'small', sx: { minWidth: 160 } },
                actionBar: { actions: ['clear'] },
              }}
            />

            <DatePicker
              label="Start Date To"
              value={endDateFilter}
              onChange={(newValue) => setEndDateFilter(newValue)}
              slotProps={{
                textField: { size: 'small', sx: { minWidth: 160 } },
                actionBar: { actions: ['clear'] },
              }}
            />

            {(statusFilter !== 'ALL' || nameFilter !== '' || startDateFilter || endDateFilter) && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setStatusFilter('ALL');
                  setNameFilter('');
                  setStartDateFilter(null);
                  setEndDateFilter(null);
                }}
              >
                Clear Filters
              </Button>
            )}
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Showing {filteredRequests.length} of {requests.length} request{requests.length !== 1 ? 's' : ''}
          </Typography>
        </Stack>
      </Paper>

      <Paper>
        <DataGrid
          rows={filteredRequests}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
            sorting: {
              sortModel: [{ field: 'submittedDate', sort: 'desc' }],
            },
          }}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
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
