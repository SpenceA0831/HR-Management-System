import { useState, useEffect } from 'react';
import {
    Grid, Typography, Button, Card, CardContent,
    Box, Divider, Stack, Skeleton, useTheme
} from '@mui/material';
import {
    Plus, Calendar as CalendarIcon, Clock,
    CheckCircle2, FileText, Users
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import * as ptoApi from '../../services/api/ptoApi';
import type { PtoRequest, PtoBalance, Holiday } from '../../types';
import { StatusChip } from '../../components/StatusChip';
import { TypeChip } from '../../components/TypeChip';
import { formatPtoDates } from '../../utils/ptoUtils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format, parseISO, addDays, isAfter, isBefore, startOfDay } from 'date-fns';

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
    const [upcomingTeamPto, setUpcomingTeamPto] = useState<PtoRequest[]>([]);
    const [teamOutToday, setTeamOutToday] = useState<PtoRequest[]>([]);

    const fetchData = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const isManager = user.userRole === 'MANAGER' || user.userRole === 'ADMIN';

            // Fetch requests, balance, and holidays
            const [reqsResponse, balResponse, holidaysResponse] = await Promise.all([
                ptoApi.getPtoRequests({}), // Backend will filter by current user appropriately
                ptoApi.getPtoBalance(), // Let backend determine current user's balance
                ptoApi.getHolidays()
            ]);

            if (reqsResponse.success && reqsResponse.data) {
                const allRequests = reqsResponse.data;

                    // Split requests for managers: their own vs team's
                    if (isManager) {
                        // Match by userId
                        const myReqs = allRequests.filter(r =>
                            r.userId === user.id
                        ).slice(0, 5);
                        // Team requests: only show submitted requests that need approval
                        const teamReqs = allRequests.filter(r =>
                            r.userId !== user.id &&
                            r.status === 'Submitted'
                        ).slice(0, 5);
                        setMyRequests(myReqs);
                        setTeamRequests(teamReqs);
                    } else {
                        setMyRequests(allRequests.slice(0, 5));
                    }
                }

                if (balResponse.success && balResponse.data) {
                    setBalance(balResponse.data);
                }

                if (holidaysResponse.success && holidaysResponse.data) {
                    // Filter holidays to upcoming ones
                    const today = startOfDay(new Date());
                    const upcomingHolidays = holidaysResponse.data
                        .filter(h => isAfter(parseISO(h.date), today) || format(parseISO(h.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
                        .slice(0, 3);
                    setHolidays(upcomingHolidays);
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

    const handleApprove = async (requestId: string) => {
        try {
            console.log('Approving request:', requestId);
            console.log('Current user:', user);

            // Find the request to see its details
            const request = teamRequests.find(r => r.id === requestId);
            console.log('Request details:', request);
            console.log('Request status:', request?.status);
            console.log('Request approverId:', request?.approverId);
            console.log('Current user id:', user?.id);
            console.log('Do IDs match?', request?.approverId === user?.id);

            const response = await ptoApi.approvePtoRequest(requestId);
            console.log('Approve response:', response);

            if (response.success) {
                alert('Request approved successfully!');
                // Refresh data after approval
                if (user) {
                    fetchData();
                }
            } else {
                alert(`Failed to approve: ${response.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to approve request:', error);
            alert('Failed to approve request. Please check console for details.');
        }
    };

    const handleDeny = async (requestId: string) => {
        const reason = prompt('Enter reason for denial:');
        if (reason === null) return; // User cancelled
        if (!reason.trim()) {
            alert('Reason is required when denying a request');
            return;
        }

        try {
            console.log('Denying request:', requestId, 'with reason:', reason);
            const response = await ptoApi.denyPtoRequest(requestId, reason);
            console.log('Deny response:', response);

            if (response.success) {
                alert('Request denied successfully!');
                // Refresh data after denial
                if (user) {
                    fetchData();
                }
            } else {
                alert(`Failed to deny: ${response.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to deny request:', error);
            alert('Failed to deny request. Please check console for details.');
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
    const total = balance?.availableHours || 120;
    const remaining = total - used - pending;

    const pieData = [
        { name: 'Remaining', value: remaining, color: '#22c55e' },
        { name: 'Used', value: used, color: '#ef4444' },
        { name: 'Awaiting Approval', value: pending, color: '#f59e0b' },
    ].filter(d => d.value > 0);

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

                <Grid container spacing={3}>
                    {/* Left Column */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Stack spacing={3}>
                            {/* Personal Balance Card */}
                            {(() => {
                                return (
                                <Card sx={{
                                    bgcolor: theme.palette.mode === 'light' ? 'primary.main' : 'primary.dark',
                                    color: 'white',
                                    borderRadius: 4,
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <CardContent sx={{ p: 4 }}>
                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                                            {/* Left side - Stats */}
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" sx={{ opacity: 0.8, mb: 1, fontWeight: 500 }}>Available PTO</Typography>
                                                <Typography variant="h2" sx={{ fontWeight: 800, mb: 2 }}>
                                                    {remaining} <Typography component="span" variant="h5">hours</Typography>
                                                </Typography>
                                                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />
                                                <Stack direction="row" spacing={3} flexWrap="wrap">
                                                    <Box>
                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e' }} />
                                                            <Typography variant="caption" sx={{ opacity: 0.7 }}>Remaining</Typography>
                                                        </Stack>
                                                        <Typography variant="h6">{remaining}h</Typography>
                                                    </Box>
                                                    <Box>
                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444' }} />
                                                            <Typography variant="caption" sx={{ opacity: 0.7 }}>Used</Typography>
                                                        </Stack>
                                                        <Typography variant="h6">{used}h</Typography>
                                                    </Box>
                                                    <Box>
                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                                                            <Typography variant="caption" sx={{ opacity: 0.7 }}>Awaiting Approval</Typography>
                                                        </Stack>
                                                        <Typography variant="h6">{pending}h</Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>Yearly Total</Typography>
                                                        <Typography variant="h6">{total}h</Typography>
                                                    </Box>
                                                </Stack>
                                            </Box>
                                            {/* Right side - Pie Chart */}
                                            <Box sx={{ width: 160, height: 160 }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={pieData}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={45}
                                                            outerRadius={70}
                                                            paddingAngle={2}
                                                            dataKey="value"
                                                            stroke="none"
                                                        >
                                                            {pieData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            content={({ active, payload }) => {
                                                                if (active && payload && payload.length) {
                                                                    const data = payload[0].payload;
                                                                    return (
                                                                        <Box sx={{
                                                                            bgcolor: 'background.paper',
                                                                            color: 'text.primary',
                                                                            p: 1.5,
                                                                            borderRadius: 1,
                                                                            boxShadow: 2
                                                                        }}>
                                                                            <Typography variant="body2" fontWeight={600}>
                                                                                {data.name}: {data.value}h
                                                                            </Typography>
                                                                        </Box>
                                                                    );
                                                                }
                                                                return null;
                                                            }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            );
                        })()}

                        {/* My PTO Requests */}
                        <Card sx={{ borderRadius: 4 }}>
                            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    My PTO Requests
                                </Typography>
                                <Button onClick={() => navigate('/pto/requests')} endIcon={<FileText size={16} />}>
                                    View All
                                </Button>
                            </Box>
                            <Divider />
                            <Box>
                                {myRequests.length === 0 ? (
                                    <Box sx={{ p: 6, textAlign: 'center' }}>
                                        <Typography color="text.secondary">No requests found.</Typography>
                                    </Box>
                                ) : (
                                    myRequests.map((req, idx) => (
                                        <Box
                                            key={req.id}
                                            sx={{
                                                p: 3,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: 'action.hover' },
                                                borderBottom: idx !== myRequests.length - 1 ? '1px solid' : 'none',
                                                borderColor: 'divider'
                                            }}
                                            onClick={() => navigate(`/pto/requests/${req.id}`)}
                                        >
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Box sx={{
                                                    width: 48, height: 48, borderRadius: 2,
                                                    bgcolor: 'secondary.light', color: 'secondary.main',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <CalendarIcon size={24} />
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                        {req.type}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatPtoDates(req.startDate, req.endDate)} • {req.totalHours} hours
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                            <StatusChip status={req.status} />
                                        </Box>
                                    ))
                                )}
                            </Box>
                        </Card>
                    </Stack>
                </Grid>

                {/* Right Column */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Stack spacing={3}>
                        {/* Quick Actions */}
                        <Card sx={{ borderRadius: 4, bgcolor: 'background.paper' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Quick Actions</Typography>
                                <Stack spacing={1.5}>
                                    <Button fullWidth variant="outlined" startIcon={<Clock size={18} />} sx={{ justifyContent: 'flex-start', py: 1.5 }} onClick={() => navigate('/pto/requests/new')}>
                                        New Request
                                    </Button>
                                    <Button fullWidth variant="outlined" startIcon={<CalendarIcon size={18} />} sx={{ justifyContent: 'flex-start', py: 1.5 }} onClick={() => navigate('/pto/calendar')}>
                                        View Calendar
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Upcoming Holidays */}
                        <Card sx={{ borderRadius: 4 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Upcoming Holidays</Typography>
                                {holidays.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                        No upcoming holidays
                                    </Typography>
                                ) : (
                                    <Stack spacing={2}>
                                        {holidays.map((h) => (
                                            <Box key={h.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{h.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {format(parseISO(h.date), 'MMM d, yyyy')}
                                                </Typography>
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
