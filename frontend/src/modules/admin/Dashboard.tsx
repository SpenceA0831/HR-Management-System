import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import { Settings, Calendar, TrendingUp } from 'lucide-react';
import SystemSettings from './SystemSettings';
import PtoSettings from './PtoSettings';
import EvaluationsSettings from './EvaluationsSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminDashboard() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Admin Console
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage system-wide settings and module configurations
      </Typography>

      <Paper sx={{ borderRadius: 2 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="admin settings tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
          }}
        >
          <Tab
            icon={<Settings size={20} />}
            iconPosition="start"
            label="System Settings"
            id="admin-tab-0"
            aria-controls="admin-tabpanel-0"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab
            icon={<Calendar size={20} />}
            iconPosition="start"
            label="PTO Settings"
            id="admin-tab-1"
            aria-controls="admin-tabpanel-1"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab
            icon={<TrendingUp size={20} />}
            iconPosition="start"
            label="Evaluations Settings"
            id="admin-tab-2"
            aria-controls="admin-tabpanel-2"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
        </Tabs>

        <TabPanel value={currentTab} index={0}>
          <SystemSettings />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <PtoSettings />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <EvaluationsSettings />
        </TabPanel>
      </Paper>
    </Container>
  );
}
