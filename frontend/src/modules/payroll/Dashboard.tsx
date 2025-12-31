import { useState, useEffect } from 'react';
import {
  Grid, Typography, Button, Card, CardContent,
  Box, Divider, Stack, Skeleton, useTheme, Paper, Chip
} from '@mui/material';
import {
  Plus, DollarSign, Clock, CheckCircle2, FileUp, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import * as payrollApi from '../../services/api/payrollApi';
import type { PayrollRun, Reimbursement } from '../../types';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import {
  formatCurrency,
  formatDisplayDate,
  getPayrollStatusColor,
  getReimbursementStatusColor
} from '../../utils/payrollUtils';

export default function PayrollDashboard() {
  const { currentUser: user, setActiveModule } = useStore();
  const navigate = useNavigate();
  const theme = useTheme();

  // Ensure activeModule is set when this component loads
  useEffect(() => {
    setActiveModule('payroll');
  }, [setActiveModule]);

  const [recentPayroll, setRecentPayroll] = useState<PayrollRun[]>([]);
  const [myReimbursements, setMyReimbursements] = useState<Reimbursement[]>([]);
  const [approvedReimbursements, setApprovedReimbursements] = useState<Reimbursement[]>([]);
  const [pendingReimbursements, setPendingReimbursements] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const isAdmin = user.userRole === 'ADMIN';
      const isManager = user.userRole === 'MANAGER' || user.userRole === 'ADMIN';

      if (isAdmin) {
        // Admin: Fetch payroll history and all reimbursements
        const [payrollResponse, reimbursementsResponse] = await Promise.all([
          payrollApi.getPayrollHistory(),
          payrollApi.getReimbursements(),
        ]);

        if (payrollResponse.success && payrollResponse.data) {
          // Get 5 most recent payroll runs
          const recent = payrollResponse.data
            .sort((a, b) => b.runDate.localeCompare(a.runDate))
            .slice(0, 5);
          setRecentPayroll(recent);
        }

        if (reimbursementsResponse.success && reimbursementsResponse.data) {
          const allReimbursements = reimbursementsResponse.data;

          // Approved reimbursements awaiting processing (for Payroll Approval)
          const approved = allReimbursements.filter(r => r.status === 'Approved');
          setApprovedReimbursements(approved);

          // Pending reimbursements needing approval
          const pending = allReimbursements.filter(r => r.status === 'Pending');
          setPendingReimbursements(pending);
        }
      } else {
        // Staff/Manager: Fetch own reimbursements only
        const reimbursementsResponse = await payrollApi.getReimbursements();

        if (reimbursementsResponse.success && reimbursementsResponse.data) {
          setMyReimbursements(reimbursementsResponse.data);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4, mb: 3 }} />
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 4 }} />
        </Grid>
      </Grid>
    );
  }

  const isAdmin = user?.userRole === 'ADMIN';
  const isManager = user?.userRole === 'MANAGER' || user?.userRole === 'ADMIN';

  // Calculate reimbursement stats for non-admin users
  const totalRequested = myReimbursements.reduce((sum, r) => sum + r.amount, 0);
  const totalReimbursed = myReimbursements
    .filter(r => r.status === 'Reimbursed')
    .reduce((sum, r) => sum + r.amount, 0);
  const pendingAmount = myReimbursements
    .filter(r => r.status === 'Pending')
    .reduce((sum, r) => sum + r.amount, 0);

  // Reimbursement columns for staff/manager view
  const reimbursementColumns: GridColDef[] = [
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
      width: 250,
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
      valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      field: 'dateReimbursed',
      headerName: 'Paid Date',
      width: 110,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => value ? formatDisplayDate(value) : '-',
    },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
            {isAdmin ? 'Payroll & Reimbursements' : `Welcome back, ${user?.name.split(' ')[0]}!`}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isAdmin
              ? 'Manage payroll runs and process reimbursements.'
              : 'Track your expense reimbursements and submit new requests.'}
          </Typography>
        </Box>
        {!isAdmin && (
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => navigate('/payroll/reimbursements/new')}
            size="large"
            sx={{ px: 3, py: 1.5, borderRadius: '12px' }}
          >
            New Reimbursement
          </Button>
        )}
      </Box>

      {/* ADMIN VIEW */}
      {isAdmin && (
        <>
          {/* Admin Stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ borderRadius: 4, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: 'warning.light',
                        color: 'warning.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Clock size={24} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {approvedReimbursements.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Awaiting Payroll
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ borderRadius: 4, height: '100%' }}>
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
                      <DollarSign size={24} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {formatCurrency(approvedReimbursements.reduce((sum, r) => sum + r.amount, 0))}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Approved Amount
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ borderRadius: 4, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: 'error.light',
                        color: 'error.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Users size={24} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {pendingReimbursements.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pending Approval
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Admin Quick Actions */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12 }}>
              <Card sx={{ borderRadius: 4 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Quick Actions</Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Button
                      variant="contained"
                      startIcon={<FileUp size={18} />}
                      onClick={() => navigate('/payroll/upload')}
                    >
                      Upload Payroll
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CheckCircle2 size={18} />}
                      onClick={() => navigate('/payroll/approval')}
                    >
                      Process Reimbursements ({approvedReimbursements.length})
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DollarSign size={18} />}
                      onClick={() => navigate('/payroll/history')}
                    >
                      Payroll History
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/payroll/reimbursements')}
                    >
                      All Reimbursements
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recent Payroll Runs */}
          <Card sx={{ borderRadius: 4, mb: 4 }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Recent Payroll Runs
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Latest 5 payroll runs
                </Typography>
              </Box>
              <Button onClick={() => navigate('/payroll/history')}>
                View All
              </Button>
            </Box>
            <Divider />
            <Box>
              {recentPayroll.length === 0 ? (
                <Box sx={{ p: 6, textAlign: 'center' }}>
                  <DollarSign size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                  <Typography color="text.secondary">No payroll runs yet</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Upload your first payroll journal or enter manually
                  </Typography>
                </Box>
              ) : (
                recentPayroll.map((payroll, idx) => (
                  <Box
                    key={payroll.id}
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      '&:hover': { bgcolor: 'action.hover' },
                      borderBottom: idx !== recentPayroll.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/payroll/history#${payroll.id}`)}
                  >
                    <Stack direction="row" spacing={2} alignItems="center" flex={1}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: 'primary.light',
                          color: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <DollarSign size={20} />
                      </Box>
                      <Box flex={1}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {formatDisplayDate(payroll.runDate)} - Check Date: {formatDisplayDate(payroll.checkDate)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Pay Period: {formatDisplayDate(payroll.payPeriodStart)} - {formatDisplayDate(payroll.payPeriodEnd)}
                        </Typography>
                      </Box>
                      <Stack spacing={0.5} alignItems="flex-end">
                        <Typography variant="h6" fontWeight={700}>
                          {formatCurrency(payroll.totalNet)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Gross: {formatCurrency(payroll.totalGross)}
                        </Typography>
                      </Stack>
                      <Chip
                        label={payroll.status}
                        size="small"
                        color={getPayrollStatusColor(payroll.status)}
                      />
                    </Stack>
                  </Box>
                ))
              )}
            </Box>
          </Card>

          {/* Pending Approvals */}
          {pendingReimbursements.length > 0 && (
            <Card sx={{ borderRadius: 4 }}>
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Reimbursements Pending Approval
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {pendingReimbursements.length} request{pendingReimbursements.length !== 1 ? 's' : ''} awaiting review
                  </Typography>
                </Box>
                <Button onClick={() => navigate('/payroll/reimbursements?status=Pending')}>
                  Review All
                </Button>
              </Box>
              <Divider />
              <Box>
                {pendingReimbursements.slice(0, 5).map((reimb, idx) => (
                  <Box
                    key={reimb.id}
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: 'rgba(255, 152, 0, 0.08)',
                      '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.15)' },
                      borderBottom: idx !== pendingReimbursements.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      cursor: 'pointer',
                      borderLeft: '4px solid',
                      borderLeftColor: 'warning.main',
                    }}
                    onClick={() => navigate(`/payroll/reimbursements/${reimb.id}`)}
                  >
                    <Stack direction="row" spacing={2} alignItems="center" flex={1}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: 'warning.main',
                          color: 'warning.contrastText',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Clock size={20} />
                      </Box>
                      <Box flex={1}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {reimb.staffName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {reimb.description} • {formatDisplayDate(reimb.expenseDate)}
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight={700}>
                        {formatCurrency(reimb.amount)}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Box>
            </Card>
          )}
        </>
      )}

      {/* STAFF/MANAGER VIEW */}
      {!isAdmin && (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  bgcolor: theme.palette.mode === 'light' ? 'primary.main' : 'primary.dark',
                  color: 'white',
                  borderRadius: 3,
                  height: '100%',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Requested
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {formatCurrency(totalRequested)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    {myReimbursements.length} request{myReimbursements.length !== 1 ? 's' : ''}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 4, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center" mb={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                    <Typography variant="h6">Reimbursed</Typography>
                  </Stack>
                  <Typography variant="h3" fontWeight={700}>
                    {formatCurrency(totalReimbursed)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {myReimbursements.filter(r => r.status === 'Reimbursed').length} processed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 4, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center" mb={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                    <Typography variant="h6">Pending</Typography>
                  </Stack>
                  <Typography variant="h3" fontWeight={700}>
                    {formatCurrency(pendingAmount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {myReimbursements.filter(r => r.status === 'Pending').length} awaiting approval
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* My Reimbursements DataGrid */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>My Reimbursements</Typography>
            <Paper>
              <DataGrid
                rows={myReimbursements}
                columns={reimbursementColumns}
                loading={loading}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
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
        </>
      )}
    </Box>
  );
}
