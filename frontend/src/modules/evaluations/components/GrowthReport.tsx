import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  Alert,
  Stack,
  Grid,
} from '@mui/material';
import { PieChart } from 'lucide-react';
import type { Competency, Rating } from '../../../types';
import RadarChart from './RadarChart';

interface GrowthReportProps {
  competencies: Competency[];
  selfRatings: Rating[];
  peerRatings: Rating[];
  managerRatings: Rating[];
}

export default function GrowthReport({
  competencies,
  selfRatings,
  peerRatings,
  managerRatings,
}: GrowthReportProps) {
  // Transform competency and rating data for radar chart
  const radarData = competencies.map((comp) => ({
    subject: comp.name,
    self: selfRatings.find((r) => r.competencyId === comp.id)?.score || 0,
    peer: peerRatings.find((r) => r.competencyId === comp.id)?.score || 0,
    manager: managerRatings.find((r) => r.competencyId === comp.id)?.score || 0,
    fullMark: 5,
  }));

  // Calculate perception gap: Self - Average(Peer, Manager)
  const calculateGap = (s: number, p: number, m: number) => {
    const avgOthers = (p + m) / 2;
    return s - avgOthers;
  };

  // Find priority growth areas (significant perception gap where self > others)
  const priorityAreas = competencies
    .map((c) => {
      const s = selfRatings.find((r) => r.competencyId === c.id)?.score || 0;
      const p = peerRatings.find((r) => r.competencyId === c.id)?.score || 0;
      const m = managerRatings.find((r) => r.competencyId === c.id)?.score || 0;
      const gap = calculateGap(s, p, m);
      return { ...c, gap, mScore: m };
    })
    .sort((a, b) => b.gap - a.gap) // Highest gaps first (self-inflation)
    .filter((a) => a.gap > 0.5)
    .slice(0, 3);

  // Calculate averages
  const selfAvg = selfRatings.length > 0
    ? (selfRatings.reduce((a, b) => a + b.score, 0) / selfRatings.length).toFixed(1)
    : '0.0';
  const peerAvg = peerRatings.length > 0
    ? (peerRatings.reduce((a, b) => a + b.score, 0) / peerRatings.length).toFixed(1)
    : '0.0';
  const managerAvg = managerRatings.length > 0
    ? (managerRatings.reduce((a, b) => a + b.score, 0) / managerRatings.length).toFixed(1)
    : '0.0';

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 5,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          mb: 6,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Chip
            label="Growth Report"
            color="primary"
            size="small"
            sx={{
              height: 24,
              fontSize: '0.625rem',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          />
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: -1 }}>
            Perception & Performance
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, maxWidth: 600 }}>
          Detailed gap analysis comparing self-assessment with blind peer and manager reviews.
        </Typography>
      </Paper>

      <Grid container spacing={5}>
        {/* Radar Chart Section */}
        <Grid size={{ xs: 12, xl: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 5,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Section Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'primary.50',
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'primary.main',
                  }}
                >
                  <PieChart size={24} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  360° Alignment Radar
                </Typography>
              </Box>
            </Box>

            {/* Radar Chart */}
            <Box sx={{ flex: 1, minHeight: 350 }}>
              <RadarChart data={radarData} initialShowPeer initialShowManager />
            </Box>

            {/* Average Stats */}
            <Grid container spacing={3} sx={{ pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
              <Grid size={{ xs: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'text.secondary' }}>
                    Self Avg
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mt: 1 }}>
                    {selfAvg}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'text.secondary' }}>
                    Peer Avg
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main', mt: 1 }}>
                    {peerAvg}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'text.secondary' }}>
                    Mgr Avg
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'warning.main', mt: 1 }}>
                    {managerAvg}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Priority Areas */}
        <Grid size={{ xs: 12, xl: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 5,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'error.light',
              bgcolor: 'error.50',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                color: 'error.dark',
                mb: 3,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  width: 16,
                  height: 16,
                }}
              >
                ⚠️
              </Box>
              Perception Gaps
            </Typography>
            <Stack spacing={2}>
              {priorityAreas.length > 0 ? (
                priorityAreas.map((area, i) => (
                  <Paper
                    key={i}
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid',
                      borderColor: 'error.200',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {area.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          fontSize: '0.625rem',
                        }}
                      >
                        {area.category}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
                        Gap: +{area.gap.toFixed(1)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'error.light',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          fontSize: '0.563rem',
                        }}
                      >
                        Self Overrated
                      </Typography>
                    </Box>
                  </Paper>
                ))
              ) : (
                <Alert severity="success" variant="outlined">
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    No significant perception gaps found. Excellent alignment!
                  </Typography>
                </Alert>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Comparison Scorecard Table */}
      <Paper
        elevation={0}
        sx={{
          mt: 6,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        {/* Table Header */}
        <Box
          sx={{
            p: 5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
              Alignment Scorecard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
              Comparison of self-perception versus external feedback.
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              bgcolor: 'background.default',
              p: 1,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: '#6366f1' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.625rem' }}>
                Self
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: '#10b981' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.625rem' }}>
                Peer
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: '#f59e0b' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.625rem' }}>
                Mgr
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.625rem', letterSpacing: 1.5, color: 'text.secondary' }}>
                  Competency
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.625rem', letterSpacing: 1.5, color: 'text.secondary' }}>
                  Self
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.625rem', letterSpacing: 1.5, color: 'text.secondary' }}>
                  Peers
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.625rem', letterSpacing: 1.5, color: 'text.secondary' }}>
                  Manager
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.625rem', letterSpacing: 1.5, color: 'text.secondary' }}>
                  Gap
                </TableCell>
                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.625rem', letterSpacing: 1.5, color: 'text.secondary' }}>
                  Assessment
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {competencies.map((comp) => {
                const s = selfRatings.find((r) => r.competencyId === comp.id)?.score || 0;
                const p = peerRatings.find((r) => r.competencyId === comp.id)?.score || 0;
                const m = managerRatings.find((r) => r.competencyId === comp.id)?.score || 0;
                const gap = calculateGap(s, p, m);

                return (
                  <TableRow
                    key={comp.id}
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {comp.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: 'text.secondary',
                          textTransform: 'uppercase',
                          fontSize: '0.625rem',
                          display: 'block',
                          mt: 0.5,
                        }}
                      >
                        {comp.category}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#6366f1' }}>
                        {s.toFixed(1)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#10b981' }}>
                        {p.toFixed(1)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                        {m.toFixed(1)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${gap > 0 ? '+' : ''}${gap.toFixed(1)}`}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.625rem',
                          bgcolor:
                            gap > 0.5
                              ? 'error.50'
                              : gap < -0.5
                                ? 'primary.50'
                                : 'success.50',
                          color:
                            gap > 0.5
                              ? 'error.main'
                              : gap < -0.5
                                ? 'primary.main'
                                : 'success.main',
                          border: '1px solid',
                          borderColor:
                            gap > 0.5
                              ? 'error.light'
                              : gap < -0.5
                                ? 'primary.light'
                                : 'success.light',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {gap > 1 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'error.main',
                              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                              '@keyframes pulse': {
                                '0%, 100%': {
                                  opacity: 1,
                                },
                                '50%': {
                                  opacity: 0.5,
                                },
                              },
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: 'error.main',
                              textTransform: 'uppercase',
                              fontSize: '0.625rem',
                            }}
                          >
                            Inflation Warning
                          </Typography>
                        </Box>
                      ) : gap < -1 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: 'primary.main',
                              textTransform: 'uppercase',
                              fontSize: '0.625rem',
                            }}
                          >
                            Self-Modesty
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.light' }} />
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: 'text.secondary',
                              textTransform: 'uppercase',
                              fontSize: '0.625rem',
                            }}
                          >
                            Aligned
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
