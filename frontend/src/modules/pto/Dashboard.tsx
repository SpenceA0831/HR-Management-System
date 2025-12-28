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

    const [requests, setRequests] = useState<PtoRequest[]>([]);
    const [myRequests, setMyRequests] = useState<PtoRequest[]>([]);
    const [teamRequests, setTeamRequests] = useState<PtoRequest[]>([]);
    const [balance, setBalance] = useState<PtoBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [upcomingTeamPto, setUpcomingTeamPto] = useState<PtoRequest[]>([]);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
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
                    setRequests(allRequests.slice(0, 5));

                    // Split requests for managers: their own vs team's
                    if (isManager) {
                        // Match by email (more reliable) or userId as fallback
                        const myReqs = allRequests.filter(r =>
                            r.userEmail === user.email || r.userId === user.id
                        ).slice(0, 5);
                        const teamReqs = allRequests.filter(r =>
                            r.userEmail !== user.email && r.userId !== user.id
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

                // For managers: get upcoming team PTO (next 2 weeks)
                if (isManager && reqsResponse.success && reqsResponse.data) {
                    const today = startOfDay(new Date());
                    const twoWeeksFromNow = addDays(today, 14);
                    const upcoming = reqsResponse.data
                        .filter(r =>
                            r.status === 'Approved' &&
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

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
                        Welcome back, {user?.name.split(' ')[0]}!
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {isManager ? "Here's what's happening with your team today." : "You've got some time off to plan!"}
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

            <Grid container spacing={3}>
                {/* Left Column */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Stack spacing={3}>
                        {/* Balance Card for Employee / Team Summary for Manager */}
                        {!isManager ? (() => {
                            const used = balance?.usedHours || 0;
                            const pending = balance?.pendingHours || 0;
                            const total = balance?.availableHours || 120;
                            const remaining = total - used - pending;

                            const pieData = [
                                { name: 'Remaining', value: remaining, color: '#22c55e' },
                                { name: 'Used', value: used, color: '#ef4444' },
                                { name: 'Pending', value: pending, color: '#f59e0b' },
                            ].filter(d => d.value > 0);

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
                                                            <Typography variant="caption" sx={{ opacity: 0.7 }}>Pending</Typography>
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
                        })() : (
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Card sx={{ borderRadius: 3, textAlign: 'center', p: 1, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                                        <CardContent>
                                            <Typography color="inherit" variant="subtitle2" gutterBottom sx={{ opacity: 0.9 }}>
                                                Team Requests
                                            </Typography>
                                            <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                                {teamRequests.filter(r => r.status === 'Pending' || r.status === 'Submitted').length}
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                                Awaiting Your Approval
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Card sx={{ borderRadius: 3, textAlign: 'center', p: 1 }}>
                                        <CardContent>
                                            <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                                                My Requests
                                            </Typography>
                                            <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                                {myRequests.length}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Total This Year
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Card sx={{ borderRadius: 3, textAlign: 'center', p: 1 }}>
                                        <CardContent>
                                            <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                                                Team Out Today
                                            </Typography>
                                            <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.main' }}>
                                                {upcomingTeamPto.filter(r => {
                                                    const today = new Date().toISOString().split('T')[0];
                                                    return r.startDate <= today && r.endDate >= today;
                                                }).length}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                On PTO Right Now
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Card sx={{ borderRadius: 3, textAlign: 'center', p: 1 }}>
                                        <CardContent>
                                            <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                                                Upcoming Team PTO
                                            </Typography>
                                            <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
                                                {upcomingTeamPto.length}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Next 2 Weeks
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        )}

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

                        {/* Recent Team Activity (Managers Only) */}
                        {isManager && (
                            <Card sx={{ borderRadius: 4 }}>
                                <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            Team PTO Requests
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {teamRequests.filter(r => r.status === 'Pending' || r.status === 'Submitted').length} pending your review
                                        </Typography>
                                    </Box>
                                    <Button onClick={() => navigate('/pto/requests')} endIcon={<FileText size={16} />}>
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
                                            const needsApproval = req.status === 'Pending' || req.status === 'Submitted';
                                            return (
                                                <Box
                                                    key={req.id}
                                                    sx={{
                                                        p: 3,
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
                                                            width: 48, height: 48, borderRadius: 2,
                                                            bgcolor: needsApproval ? 'warning.main' : 'secondary.light',
                                                            color: needsApproval ? 'warning.contrastText' : 'secondary.main',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                        }}>
                                                            {needsApproval ? <Clock size={24} /> : <CalendarIcon size={24} />}
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
                                                        <Stack direction="row" spacing={1}>
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                color="error"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/pto/requests/${req.id}`);
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
                                                                    navigate(`/pto/requests/${req.id}`);
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
                        )}
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
                                    {isManager ? (
                                        <>
                                            <Button fullWidth variant="outlined" startIcon={<CheckCircle2 size={18} />} sx={{ justifyContent: 'flex-start', py: 1.5 }} onClick={() => navigate('/pto/requests')}>
                                                Review Pending
                                            </Button>
                                            <Button fullWidth variant="outlined" startIcon={<CalendarIcon size={18} />} sx={{ justifyContent: 'flex-start', py: 1.5 }} onClick={() => navigate('/pto/calendar')}>
                                                Team Calendar
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button fullWidth variant="outlined" startIcon={<Clock size={18} />} sx={{ justifyContent: 'flex-start', py: 1.5 }} onClick={() => navigate('/pto/requests/new')}>
                                                New Request
                                            </Button>
                                            <Button fullWidth variant="outlined" startIcon={<CalendarIcon size={18} />} sx={{ justifyContent: 'flex-start', py: 1.5 }} onClick={() => navigate('/pto/calendar')}>
                                                View Calendar
                                            </Button>
                                        </>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Upcoming Team PTO - Managers Only */}
                        {isManager && (
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
                        )}

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
    );
}
