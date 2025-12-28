import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Plus, Edit, X, ArrowLeft } from 'lucide-react';
import * as ptoApi from '../../services/api/ptoApi';
import { useStore } from '../../store/useStore';
import { StatusChip } from '../../components/StatusChip';
import { TypeChip } from '../../components/TypeChip';
import type { PtoRequest, PtoStatus } from '../../types';
import { formatPtoDates } from '../../utils/ptoUtils';

export default function RequestsList() {
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const [requests, setRequests] = useState<PtoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PtoStatus | 'ALL'>('ALL');

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const filters = statusFilter !== 'ALL' ? { status: statusFilter } : undefined;
      const response = await ptoApi.getPtoRequests(filters);
      setRequests(response.data || []);
    } catch (error) {
      console.error('Failed to load PTO requests:', error);
    } finally {
      setLoading(false);
    }
  };

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
      await ptoApi.approvePtoRequest(id);
      await loadRequests();
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleDeny = async (id: string) => {
    const reason = prompt('Enter reason for denial (optional):');
    if (reason === null) return; // User cancelled

    try {
      await ptoApi.denyPtoRequest(id, reason);
      await loadRequests();
    } catch (error) {
      console.error('Failed to deny request:', error);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <TypeChip type={params.value} />
      ),
    },
    {
      field: 'dates',
      headerName: 'Dates',
      width: 200,
      valueGetter: (_value, row) =>
        formatPtoDates(row.startDate, row.endDate),
    },
    {
      field: 'totalHours',
      headerName: 'Hours',
      width: 100,
      type: 'number',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <StatusChip status={params.value} />
      ),
    },
    {
      field: 'submittedDate',
      headerName: 'Submitted',
      width: 120,
      valueFormatter: (value) => (value ? new Date(value).toLocaleDateString() : '-'),
    },
    {
      field: 'reason',
      headerName: 'Reason',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const request = params.row as PtoRequest;
        const isOwner = request.userId === currentUser?.id;
        const isManager = currentUser?.userRole === 'MANAGER' || currentUser?.userRole === 'ADMIN';
        const canEdit = isOwner && ['Draft', 'ChangesRequested'].includes(request.status);
        const canCancel = isOwner && ['Draft', 'Submitted', 'Pending'].includes(request.status);
        const canApprove = isManager && request.status === 'Pending';

        return (
          <Stack direction="row" spacing={0.5}>
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
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PtoStatus | 'ALL')}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="Draft">Draft</MenuItem>
            <MenuItem value="Submitted">Submitted</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Denied">Denied</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
            <MenuItem value="ChangesRequested">Changes Requested</MenuItem>
          </TextField>

          <Typography variant="body2" color="text.secondary">
            {requests.length} request{requests.length !== 1 ? 's' : ''}
          </Typography>
        </Stack>
      </Paper>

      <Paper>
        <DataGrid
          rows={requests}
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
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
          }}
        />
      </Paper>
    </Box>
  );
}
