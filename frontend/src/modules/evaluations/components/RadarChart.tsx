import { useState } from 'react';
import { Box, Paper, ToggleButtonGroup, ToggleButton, Typography } from '@mui/material';
import {
  Radar,
  RadarChart as ReRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface RadarData {
  subject: string;
  self: number;
  peer: number;
  manager: number;
  fullMark: number;
}

interface RadarChartProps {
  data: RadarData[];
  initialShowPeer?: boolean;
  initialShowManager?: boolean;
}

export default function RadarChart({
  data,
  initialShowPeer = true,
  initialShowManager = true,
}: RadarChartProps) {
  const [filters, setFilters] = useState({
    self: true,
    peer: initialShowPeer,
    manager: initialShowManager,
  });

  const handleFilterChange = (_event: React.MouseEvent<HTMLElement>, newFilters: string[]) => {
    // ToggleButtonGroup with multiple selection returns array of selected values
    setFilters({
      self: newFilters.includes('self'),
      peer: newFilters.includes('peer'),
      manager: newFilters.includes('manager'),
    });
  };

  // Build array of currently selected values for ToggleButtonGroup
  const selectedFilters = Object.entries(filters)
    .filter(([_, value]) => value)
    .map(([key]) => key);

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        minHeight: 450,
        p: 3,
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Filter Toggle Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <ToggleButtonGroup
          value={selectedFilters}
          onChange={handleFilterChange}
          aria-label="chart data filters"
          size="small"
        >
          <ToggleButton value="self" aria-label="show self ratings">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: filters.self ? '#6366f1' : 'grey.300',
                }}
              />
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2 }}
              >
                Self
              </Typography>
            </Box>
          </ToggleButton>

          <ToggleButton value="peer" aria-label="show peer ratings">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: filters.peer ? '#10b981' : 'grey.300',
                }}
              />
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2 }}
              >
                Peers
              </Typography>
            </Box>
          </ToggleButton>

          <ToggleButton value="manager" aria-label="show manager ratings">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: filters.manager ? '#f59e0b' : 'grey.300',
                }}
              />
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2 }}
              >
                Manager
              </Typography>
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Radar Chart */}
      <Box sx={{ flex: 1, minHeight: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ReRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 5]} tick={false} axisLine={false} />

            {filters.self && (
              <Radar
                name="Self"
                dataKey="self"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.3}
                strokeWidth={3}
                strokeDasharray="4 4"
              />
            )}

            {filters.peer && (
              <Radar
                name="Peers"
                dataKey="peer"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.25}
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            )}

            {filters.manager && (
              <Radar
                name="Manager"
                dataKey="manager"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.2}
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            )}

            <Tooltip
              contentStyle={{
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                fontSize: 12,
                fontWeight: 'bold',
              }}
            />
          </ReRadarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
