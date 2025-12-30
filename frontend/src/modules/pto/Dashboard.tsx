import { useState, useEffect } from 'react';
import {
    Grid, Typography, Button, Card, CardContent,
    Box, Divider, Stack, Skeleton, useTheme, TextField, MenuItem, IconButton, Tooltip as MuiTooltip, Paper
} from '@mui/material';
import {
    Plus, Calendar as CalendarIcon, Clock,
    CheckCircle2, FileText, Users, Edit, X
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import * as ptoApi from '../../services/api/ptoApi';
import type { PtoRequest, PtoBalance, Holiday, BlackoutDate, PtoStatus } from '../../types';
import { StatusChip } from '../../components/StatusChip';
import { TypeChip } from '../../components/TypeChip';
import { formatPtoDates } from '../../utils/ptoUtils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format, parseISO, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers';

export default function PtoDashboard() {
    const { currentUser: user } = useStore();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();

    const [myRequests, setMyRequests] = useState<PtoRequest[]>([]);
    const [teamRequests, setTeamRequests] = useState<PtoRequest[]>([]);
    const [balance, setBalance] = useState<PtoBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([]);
    const [upcomingTeamPto, setUpcomingTeamPto] = useState<PtoRequest[]>([]);
    const [teamOutToday, setTeamOutToday] = useState<PtoRequest[]>([]);

    // Filter states for DataGrid
    const [statusFilter, setStatusFilter] = useState<PtoStatus | 'ALL'>('ALL');
    const [nameFilter, setNameFilter] = useState('');
    const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
    const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);

    const fetchData = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const isManager = user.userRole === 'MANAGER' || user.userRole === 'ADMIN';

            // Fetch requests, balance, holidays, and blackout dates
            const [reqsResponse, balResponse, holidaysResponse, blackoutResponse] = await Promise.all([
                ptoApi.getPtoRequests({}), // Backend will filter by current user appropriately
                ptoApi.getPtoBalance(), // Let backend determine current user's balance
                ptoApi.getHolidays(),
                ptoApi.getBlackoutDates()
            ]);

            if (reqsResponse.success && reqsResponse.data) {
                const allRequests = reqsResponse.data;

                    // Split requests for managers: their own vs team's
                    if (isManager) {
                        // Match by userId
                        const myReqs = allRequests.filter(r =>
                            r.userId === user.id
                        );
                        // Team requests: only show submitted requests that need approval
                        const teamReqs = allRequests.filter(r =>
                            r.userId !== user.id &&
                            r.status === 'Submitted'
                        );
                        setMyRequests(myReqs);
                        setTeamRequests(teamReqs);
                    } else {
                        setMyRequests(allRequests);
                    }
                }

                if (balResponse.success && balResponse.data) {
                    setBalance(balResponse.data);
                }

                if (holidaysResponse.success && holidaysResponse.data) {
                    // Filter holidays to next 3 months
                    const today = startOfDay(new Date());
                    const threeMonthsFromNow = addDays(today, 90);
                    const upcomingHolidays = holidaysResponse.data
                        .filter(h => {
                            const holidayDate = parseISO(h.date);
                            return (isAfter(holidayDate, today) || format(holidayDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
                                && isBefore(holidayDate, threeMonthsFromNow);
                        })
                        .slice(0, 10);
                    setHolidays(upcomingHolidays);
                }

                if (blackoutResponse.success && blackoutResponse.data) {
                    // Filter blackout dates to next 3 months
                    const today = startOfDay(new Date());
                    const threeMonthsFromNow = addDays(today, 90);
                    const upcomingBlackouts = blackoutResponse.data
                        .filter(b => {
                            const blackoutDate = parseISO(b.date);
                            return (isAfter(blackoutDate, today) || format(blackoutDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
                                && isBefore(blackoutDate, threeMonthsFromNow);
                        })
                        .slice(0, 10);
                    setBlackoutDates(upcomingBlackouts);
                }

                // For managers: get team PTO data (exclude own requests)
                if (isManager && reqsResponse.success && reqsResponse.data) {
                    const today = startOfDay(new Date());
                    const todayStr = format(today, 'yyyy-MM-dd');
                    const twoWeeksFromNow = addDays(today, 14);

                    const teamApprovedRequests = reqsResponse.data.filter(r =>
                        r.userId !== user.id && r.status === 'Approved'
                    );

                    // Team out today
                    const outToday = teamApprovedRequests.filter(r =>
                        r.startDate <= todayStr && r.endDate >= todayStr
                    );
                    setTeamOutToday(outToday);

                    // Upcoming team PTO (next 2 weeks)
                    const upcoming = teamApprovedRequests
                        .filter(r =>
                            isAfter(parseISO(r.startDate), today) &&
                            isBefore(parseISO(r.startDate), twoWeeksFromNow)
                        )
                        .sort((a, b) => a.startDate.localeCompare(b.startDate))
                        .slice(0, 5);
                    setUpcomingTeamPto(upcoming);
                }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, location.key]); // Refetch when navigating back to dashboard

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

    const isManager = user?.userRole === 'MANAGER' || user?.userRole === 'ADMIN';

    // Calculate personal PTO balance (for both staff and managers)
    const used = balance?.usedHours || 0;
    const pending = balance?.pendingHours || 0;
    const total = balance?.totalHours || balance?.availableHours || 120;
    const remaining = total - used - pending;

    const pieData = [
        { name: 'Remaining', value: remaining, color: '#22c55e' },
        { name: 'Used', value: used, color: '#ef4444' },
        { name: 'Awaiting Approval', value: pending, color: '#f59e0b' },
    ].filter(d => d.value > 0);

    // Calculate used hours breakdown by type
    const usedByType = myRequests
        .filter(req => req.status === 'Approved')
        .reduce((acc, req) => {
            if (req.type === 'Vacation') {
                acc.vacation += req.totalHours;
            } else if (req.type === 'Sick') {
                acc.sick += req.totalHours;
            } else {
                acc.other += req.totalHours;
            }
            return acc;
        }, { vacation: 0, sick: 0, other: 0 });

    // Get unique user names for filter dropdown
    const uniqueUsers = Array.from(new Set(myRequests.map(r => r.userName))).sort();

    // Client-side filtering
    const filteredRequests = myRequests.filter((req) => {
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

    // Action handlers
    const handleCancel = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this request?')) return;

        try {
            await ptoApi.cancelPtoRequest(id);
            await fetchData();
        } catch (error) {
            console.error('Failed to cancel request:', error);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            const response = await ptoApi.approvePtoRequest(id);
            if (response.success) {
                alert('Request approved successfully!');
                await fetchData();
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
            const response = await ptoApi.denyPtoRequest(id, reason);
            if (response.success) {
                alert('Request denied successfully!');
                await fetchData();
            } else {
                alert(`Failed to deny: ${response.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to deny request:', error);
            alert('Failed to deny request. Please check console for details.');
        }
    };

    // DataGrid columns
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
            field: 'totalHours',
            headerName: 'Hours',
            width: 80,
            type: 'number',
            headerAlign: 'center',
            align: 'center',
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
            width: 250,
            sortable: false,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params: GridRenderCellParams) => {
                const request = params.row as PtoRequest;
                const isOwner = request.userId === user?.id;
                const canCancel = isOwner && ['Draft', 'Submitted'].includes(request.status);
                const canApprove = isManager && request.status === 'Submitted';

                return (
                    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                        <MuiTooltip title="Edit">
                            <IconButton
                                size="small"
                                onClick={() => navigate(`/pto/requests/${request.id}`)}
                            >
                                <Edit size={18} />
                            </IconButton>
                        </MuiTooltip>

                        {canCancel && (
                            <MuiTooltip title="Cancel">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleCancel(request.id)}
                                >
                                    <X size={18} />
                                </IconButton>
                            </MuiTooltip>
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
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
                        Welcome back, {user?.name.split(' ')[0]}!
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {isManager ? "Manage your time off and your team's requests." : "You've got some time off to plan!"}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={() => navigate('/pto/requests/new')}
                    size="large"
                    sx={{ px: 3, py: 1.5, borderRadius: '12px' }}
                >
                    New Request
                </Button>
            </Box>

            {/* My PTO Section */}
            <Box sx={{ mb: isManager ? 5 : 3 }}>
                {isManager && (
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon size={24} />
                        My PTO
                    </Typography>
                )}

                {/* Row 1: Balance + Upcoming Key Dates + Helpful Links */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, lg: 5 }}>
                        <Card sx={{
                            bgcolor: theme.palette.mode === 'light' ? 'primary.main' : 'primary.dark',
                            color: 'white',
                            borderRadius: 3,
                            position: 'relative',
                            overflow: 'hidden',
                            height: '100%'
                        }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" sx={{ opacity: 0.9, mb: 1.5, fontWeight: 600 }}>PTO Balance</Typography>
                                        <Stack direction="row" spacing={2.5} flexWrap="wrap">
                                            <Box>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e' }} />
                                                    <Typography variant="caption" sx={{ opacity: 0.7 }}>Available</Typography>
                                                </Stack>
                                                <Typography variant="h5" fontWeight={700}>{remaining}h</Typography>
                                            </Box>
                                            <MuiTooltip
                                                title={
                                                    <Stack spacing={0.5}>
                                                        <Typography variant="caption" fontWeight={600}>Used Hours Breakdown:</Typography>
                                                        <Typography variant="caption">Vacation: {usedByType.vacation}h</Typography>
                                                        <Typography variant="caption">Sick: {usedByType.sick}h</Typography>
                                                        {usedByType.other > 0 && <Typography variant="caption">Other: {usedByType.other}h</Typography>}
                                                    </Stack>
                                                }
                                                placement="top"
                                                arrow
                                            >
                                                <Box sx={{ cursor: 'pointer' }}>
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444' }} />
                                                        <Typography variant="caption" sx={{ opacity: 0.7 }}>Used</Typography>
                                                    </Stack>
                                                    <Typography variant="h5" fontWeight={700}>{used}h</Typography>
                                                </Box>
                                            </MuiTooltip>
                                            <Box>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                                                    <Typography variant="caption" sx={{ opacity: 0.7 }}>Pending</Typography>
                                                </Stack>
                                                <Typography variant="h5" fontWeight={700}>{pending}h</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>Total</Typography>
                                                <Typography variant="h5" fontWeight={700}>{total}h</Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
                                    <Box sx={{ width: 120, height: 120 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={30}
                                                    outerRadius={50}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <Box sx={{ bgcolor: 'background.paper', color: 'text.primary', p: 1.5, borderRadius: 1, boxShadow: 2 }}>
                                                                <Typography variant="body2" fontWeight={600}>{data.name}: {data.value}h</Typography>
                                                            </Box>
                                                        );
                                                    }
                                                    return null;
                                                }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                        <Card sx={{ borderRadius: 4, height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Upcoming Key Dates</Typography>
                                <Stack direction="row" spacing={2} sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                                        <Typography variant="caption" color="text.secondary">Holidays</Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                                        <Typography variant="caption" color="text.secondary">Blackout Dates</Typography>
                                    </Stack>
                                </Stack>
                                {holidays.length === 0 && blackoutDates.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>No upcoming key dates</Typography>
                                ) : (
                                    <Stack spacing={2}>
                                        {holidays.map((h) => (
                                            <Box key={h.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{h.name}</Typography>
                                                </Stack>
                                                <Typography variant="caption" color="text.secondary">
                                                    {h.endDate ? `${format(parseISO(h.date), 'MMM d')} - ${format(parseISO(h.endDate), 'MMM d, yyyy')}` : format(parseISO(h.date), 'MMM d, yyyy')}
                                                </Typography>
                                            </Box>
                                        ))}
                                        {blackoutDates.map((b) => (
                                            <Box key={b.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{b.name}</Typography>
                                                </Stack>
                                                <Typography variant="caption" color="text.secondary">
                                                    {b.endDate ? `${format(parseISO(b.date), 'MMM d')} - ${format(parseISO(b.endDate), 'MMM d, yyyy')}` : format(parseISO(b.date), 'MMM d, yyyy')}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                        <Card sx={{ borderRadius: 4, bgcolor: 'background.paper', height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Helpful Links</Typography>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<FileText size={18} />}
                                    sx={{ justifyContent: 'flex-start', py: 1.5 }}
                                    onClick={() => window.open('/lev-policy.pdf', '_blank')}
                                >
                                    LEV Policy
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Row 2: My PTO Requests with Filters - Full Width */}
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>My PTO Requests</Typography>

                    {/* Filters */}
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
                                Showing {filteredRequests.length} of {myRequests.length} request{myRequests.length !== 1 ? 's' : ''}
                            </Typography>
                        </Stack>
                    </Paper>

                    {/* DataGrid */}
                    <Paper>
                        <DataGrid
                            rows={filteredRequests}
                            columns={columns}
                            loading={loading}
                            pageSizeOptions={[10, 25, 50]}
                            initialState={{
                                pagination: { paginationModel: { pageSize: 10 } },
                                sorting: {
                                    sortModel: [{ field: 'createdAt', sort: 'desc' }],
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
        </Box>

        {/* Team Management Section - Managers Only */}
        {isManager && (
            <Box sx={{ mt: 6 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Users size={24} />
                    Team Management
                </Typography>

                {/* Team Metrics */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {/* Team Requests Pending */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Card sx={{ borderRadius: 4, height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{
                                        width: 48, height: 48, borderRadius: 2,
                                        bgcolor: 'warning.light', color: 'warning.main',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Clock size={24} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                            {teamRequests.filter(r => r.status === 'Submitted').length}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Pending Approvals
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Team Out Today */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Card sx={{ borderRadius: 4, height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{
                                        width: 48, height: 48, borderRadius: 2,
                                        bgcolor: 'info.light', color: 'info.main',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Users size={24} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                            {teamOutToday.length}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Team Out Today
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Upcoming Team PTO Count */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Card sx={{ borderRadius: 4, height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{
                                        width: 48, height: 48, borderRadius: 2,
                                        bgcolor: 'success.light', color: 'success.main',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <CalendarIcon size={24} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                            {upcomingTeamPto.length}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Upcoming (2 weeks)
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Team Management Details */}
                <Grid container spacing={3}>
                    {/* Left Column - Team PTO Requests */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Card sx={{ borderRadius: 4 }}>
                            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                        Team PTO Requests
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {teamRequests.filter(r => r.status === 'Submitted').length} awaiting your review
                                    </Typography>
                                </Box>
                                <Button onClick={() => navigate('/pto/requests?status=Submitted')} endIcon={<FileText size={16} />}>
                                    View All
                                </Button>
                            </Box>
                            <Divider />
                            <Box>
                                {teamRequests.length === 0 ? (
                                    <Box sx={{ p: 6, textAlign: 'center' }}>
                                        <Users size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                                        <Typography color="text.secondary">No team requests yet</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Requests from your team will appear here
                                        </Typography>
                                    </Box>
                                ) : (
                                    teamRequests.map((req, idx) => {
                                        const needsApproval = req.status === 'Submitted';
                                        return (
                                            <Box
                                                key={req.id}
                                                sx={{
                                                    p: 2,
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    justifyContent: 'space-between',
                                                    bgcolor: needsApproval ? 'rgba(255, 152, 0, 0.08)' : 'transparent',
                                                    '&:hover': { bgcolor: needsApproval ? 'rgba(255, 152, 0, 0.15)' : 'action.hover' },
                                                    borderBottom: idx !== teamRequests.length - 1 ? '1px solid' : 'none',
                                                    borderColor: 'divider',
                                                    cursor: 'pointer',
                                                    borderLeft: needsApproval ? '4px solid' : 'none',
                                                    borderLeftColor: 'warning.main',
                                                }}
                                                onClick={(e) => {
                                                    if ((e.target as HTMLElement).tagName !== 'BUTTON') {
                                                        navigate(`/pto/requests/${req.id}`);
                                                    }
                                                }}
                                            >
                                                <Stack direction="row" spacing={2} alignItems="flex-start" flex={1}>
                                                    <Box sx={{
                                                        width: 40, height: 40, borderRadius: 2,
                                                        bgcolor: needsApproval ? 'warning.main' : 'secondary.light',
                                                        color: needsApproval ? 'warning.contrastText' : 'secondary.main',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                        {needsApproval ? <Clock size={20} /> : <CalendarIcon size={20} />}
                                                    </Box>
                                                    <Box flex={1}>
                                                        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                                {req.userName || 'Unknown User'}
                                                            </Typography>
                                                            <TypeChip type={req.type} />
                                                            <StatusChip status={req.status} />
                                                        </Stack>
                                                        <Typography variant="body2" color="text.secondary" mb={0.5}>
                                                            {formatPtoDates(req.startDate, req.endDate)} • {req.totalHours} hours ({req.totalHours / 8} days)
                                                        </Typography>
                                                        {req.reason && (
                                                            <Typography variant="caption" color="text.secondary" sx={{
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 1,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                                fontStyle: 'italic'
                                                            }}>
                                                                "{req.reason}"
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Stack>
                                                {needsApproval && (
                                                    <Stack direction="row" spacing={1} sx={{ alignSelf: 'center' }}>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="error"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeny(req.id);
                                                            }}
                                                            sx={{ minWidth: 70 }}
                                                        >
                                                            Deny
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="success"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleApprove(req.id);
                                                            }}
                                                            sx={{ minWidth: 80 }}
                                                        >
                                                            Approve
                                                        </Button>
                                                    </Stack>
                                                )}
                                            </Box>
                                        );
                                    })
                                )}
                            </Box>
                        </Card>
                    </Grid>

                    {/* Right Column - Upcoming Team PTO & Quick Actions */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Stack spacing={3}>
                            {/* Manager Quick Actions */}
                            <Card sx={{ borderRadius: 4, bgcolor: 'background.paper' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Quick Actions</Typography>
                                    <Stack spacing={1.5}>
                                        <Button fullWidth variant="outlined" startIcon={<CheckCircle2 size={18} />} sx={{ justifyContent: 'flex-start', py: 1.5 }} onClick={() => navigate('/pto/requests?status=Submitted')}>
                                            Review Submitted
                                        </Button>
                                        <Button fullWidth variant="outlined" startIcon={<CalendarIcon size={18} />} sx={{ justifyContent: 'flex-start', py: 1.5 }} onClick={() => navigate('/pto/calendar')}>
                                            Team Calendar
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>

                            {/* Upcoming Team PTO */}
                            <Card sx={{ borderRadius: 4 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                        <Users size={20} />
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Upcoming Team PTO</Typography>
                                    </Stack>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                        Next 2 weeks
                                    </Typography>
                                    {upcomingTeamPto.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                            No upcoming PTO in the next 2 weeks
                                        </Typography>
                                    ) : (
                                        <Stack spacing={2}>
                                            {upcomingTeamPto.map((pto) => (
                                                <Box
                                                    key={pto.id}
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        cursor: 'pointer',
                                                        p: 1,
                                                        borderRadius: 1,
                                                        '&:hover': { bgcolor: 'action.hover' }
                                                    }}
                                                    onClick={() => navigate(`/pto/requests/${pto.id}`)}
                                                >
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{pto.userName}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {formatPtoDates(pto.startDate, pto.endDate)}
                                                        </Typography>
                                                    </Box>
                                                    <TypeChip type={pto.type} size="small" />
                                                </Box>
                                            ))}
                                        </Stack>
                                    )}
                                </CardContent>
                            </Card>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        )}
    </Box>
    );
}
