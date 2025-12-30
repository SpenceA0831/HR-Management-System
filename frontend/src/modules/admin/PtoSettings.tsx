import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Save, Plus, Trash2, Calendar, Ban } from 'lucide-react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import {
  getSystemConfig,
  updateSystemConfig,
  getHolidays,
  createHoliday,
  deleteHoliday,
  getBlackoutDates,
  createBlackoutDate,
  deleteBlackoutDate,
} from '../../services/api/ptoApi';
import type { SystemConfig, Holiday, BlackoutDate } from '../../types';

export default function PtoSettings() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [blackoutDialogOpen, setBlackoutDialogOpen] = useState(false);
  const [newHolidayDate, setNewHolidayDate] = useState<Date | null>(null);
  const [newHolidayEndDate, setNewHolidayEndDate] = useState<Date | null>(null);
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newBlackoutDate, setNewBlackoutDate] = useState<Date | null>(null);
  const [newBlackoutEndDate, setNewBlackoutEndDate] = useState<Date | null>(null);
  const [newBlackoutName, setNewBlackoutName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  // Helper to format date range display
  const formatDateRange = (startDate: string, endDate?: string) => {
    const start = parseISO(startDate);
    if (!endDate) {
      return format(start, 'EEEE, MMMM d, yyyy');
    }
    const end = parseISO(endDate);
    // Same month and year
    if (format(start, 'MMMM yyyy') === format(end, 'MMMM yyyy')) {
      return `${format(start, 'EEEE, MMMM d')} - ${format(end, 'd, yyyy')}`;
    }
    // Different months or years
    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [configRes, holidaysRes, blackoutRes] = await Promise.all([
        getSystemConfig(),
        getHolidays(),
        getBlackoutDates(),
      ]);

      if (configRes.success && configRes.data) {
        setConfig(configRes.data);
      } else {
        setError(configRes.error || 'Failed to load system configuration');
      }

      if (holidaysRes.success && holidaysRes.data) {
        setHolidays(holidaysRes.data);
      }

      if (blackoutRes.success && blackoutRes.data) {
        setBlackoutDates(blackoutRes.data);
      }
    } catch (err) {
      setError('Failed to load PTO settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await updateSystemConfig(config);

      if (response.success) {
        setSuccess('Configuration saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to save configuration');
      }
    } catch (err) {
      setError('Failed to save configuration');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!newHolidayDate || !newHolidayName.trim()) return;

    try {
      const response = await createHoliday({
        date: format(newHolidayDate, 'yyyy-MM-dd'),
        endDate: newHolidayEndDate ? format(newHolidayEndDate, 'yyyy-MM-dd') : undefined,
        name: newHolidayName,
      });

      if (response.success && response.data) {
        setHolidays([...holidays, response.data]);
        setHolidayDialogOpen(false);
        setNewHolidayDate(null);
        setNewHolidayEndDate(null);
        setNewHolidayName('');
        setSuccess('Holiday added successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to add holiday');
      }
    } catch (err) {
      setError('Failed to add holiday');
      console.error(err);
    }
  };

  const handleDeleteHoliday = async (holidayId: string) => {
    try {
      const response = await deleteHoliday(holidayId);

      if (response.success) {
        setHolidays(holidays.filter((h) => h.id !== holidayId));
        setSuccess('Holiday deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to delete holiday');
      }
    } catch (err) {
      setError('Failed to delete holiday');
      console.error(err);
    }
  };

  const handleAddBlackoutDate = async () => {
    if (!newBlackoutDate || !newBlackoutName.trim()) return;

    try {
      const response = await createBlackoutDate({
        date: format(newBlackoutDate, 'yyyy-MM-dd'),
        endDate: newBlackoutEndDate ? format(newBlackoutEndDate, 'yyyy-MM-dd') : undefined,
        name: newBlackoutName,
      });

      if (response.success && response.data) {
        setBlackoutDates([...blackoutDates, response.data]);
        setBlackoutDialogOpen(false);
        setNewBlackoutDate(null);
        setNewBlackoutEndDate(null);
        setNewBlackoutName('');
        setSuccess('Blackout date added successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to add blackout date');
      }
    } catch (err) {
      setError('Failed to add blackout date');
      console.error(err);
    }
  };

  const handleDeleteBlackoutDate = async (blackoutId: string) => {
    try {
      const response = await deleteBlackoutDate(blackoutId);

      if (response.success) {
        setBlackoutDates(blackoutDates.filter((b) => b.id !== blackoutId));
        setSuccess('Blackout date deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to delete blackout date');
      }
    } catch (err) {
      setError('Failed to delete blackout date');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!config) {
    return (
      <Box sx={{ px: 3 }}>
        <Alert severity="error">Failed to load configuration</Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ px: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          PTO Settings
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure PTO policies, hours allocation, holidays, and blackout dates
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* Default Hours Configuration */}
        <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Default Hours Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Set the number of PTO hours employees receive at the start of each year
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Full-Time Default Hours"
                type="number"
                value={config.defaultFullTimeHours}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    defaultFullTimeHours: parseInt(e.target.value) || 0,
                  })
                }
                helperText="Annual PTO hours for full-time employees"
                fullWidth
              />
              <TextField
                label="Part-Time Default Hours"
                type="number"
                value={config.defaultPartTimeHours}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    defaultPartTimeHours: parseInt(e.target.value) || 0,
                  })
                }
                helperText="Annual PTO hours for part-time employees"
                fullWidth
              />
            </Box>
          </CardContent>
        </Card>

        {/* PTO Policies */}
        <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              PTO Policies
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure how PTO is calculated and displayed
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.prorateByHireDate}
                    onChange={(e) =>
                      setConfig({ ...config, prorateByHireDate: e.target.checked })
                    }
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      Prorate by Hire Date
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Adjust first-year PTO based on when the employee was hired
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.fullTeamCalendarVisible}
                    onChange={(e) =>
                      setConfig({ ...config, fullTeamCalendarVisible: e.target.checked })
                    }
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      Full Team Calendar Visible
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Allow staff to view the entire team's PTO calendar
                    </Typography>
                  </Box>
                }
              />

              <TextField
                label="Short Notice Threshold (Days)"
                type="number"
                value={config.shortNoticeThresholdDays}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    shortNoticeThresholdDays: parseInt(e.target.value) || 0,
                  })
                }
                helperText="Number of days that triggers a 'short notice' warning"
                sx={{ maxWidth: 300 }}
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} /> : <Save size={18} />}
              onClick={handleSaveConfig}
              disabled={saving}
            >
              Save Configuration
            </Button>
          </CardContent>
        </Card>

        {/* Holidays Management */}
        <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Company Holidays
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage official company holidays
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<Plus size={18} />}
                onClick={() => setHolidayDialogOpen(true)}
              >
                Add Holiday
              </Button>
            </Box>

            {holidays.length === 0 ? (
              <Alert severity="info" icon={<Calendar size={20} />}>
                No holidays configured. Add holidays to automatically exclude them from PTO calculations.
              </Alert>
            ) : (
              <List>
                {holidays
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((holiday) => (
                    <ListItem
                      key={holiday.id}
                      sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 0 },
                      }}
                    >
                      <ListItemText
                        primary={holiday.name}
                        secondary={formatDateRange(holiday.date, holiday.endDate)}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteHoliday(holiday.id)}
                          color="error"
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Blackout Dates Management */}
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Blackout Dates
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Dates when PTO requests are restricted or prohibited
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<Plus size={18} />}
                onClick={() => setBlackoutDialogOpen(true)}
              >
                Add Blackout Date
              </Button>
            </Box>

            {blackoutDates.length === 0 ? (
              <Alert severity="info" icon={<Ban size={20} />}>
                No blackout dates configured. Add blackout dates for periods when PTO should not be requested.
              </Alert>
            ) : (
              <List>
                {blackoutDates
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((blackout) => (
                    <ListItem
                      key={blackout.id}
                      sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 0 },
                      }}
                    >
                      <ListItemText
                        primary={blackout.name}
                        secondary={formatDateRange(blackout.date, blackout.endDate)}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteBlackoutDate(blackout.id)}
                          color="error"
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Add Holiday Dialog */}
        <Dialog open={holidayDialogOpen} onClose={() => setHolidayDialogOpen(false)}>
          <DialogTitle>Add Company Holiday</DialogTitle>
          <DialogContent sx={{ pt: 2, minWidth: 400 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Holiday Name"
                value={newHolidayName}
                onChange={(e) => setNewHolidayName(e.target.value)}
                placeholder="e.g., New Year's Day"
                fullWidth
              />
              <DatePicker
                label="Start Date"
                value={newHolidayDate}
                onChange={(date) => setNewHolidayDate(date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label="End Date (Optional)"
                value={newHolidayEndDate}
                onChange={(date) => setNewHolidayEndDate(date)}
                minDate={newHolidayDate || undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: 'Leave empty for single-day holiday'
                  }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setHolidayDialogOpen(false);
              setNewHolidayDate(null);
              setNewHolidayEndDate(null);
              setNewHolidayName('');
            }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAddHoliday}
              disabled={!newHolidayDate || !newHolidayName.trim()}
            >
              Add Holiday
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Blackout Date Dialog */}
        <Dialog open={blackoutDialogOpen} onClose={() => setBlackoutDialogOpen(false)}>
          <DialogTitle>Add Blackout Date</DialogTitle>
          <DialogContent sx={{ pt: 2, minWidth: 400 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Reason"
                value={newBlackoutName}
                onChange={(e) => setNewBlackoutName(e.target.value)}
                placeholder="e.g., Annual Company Meeting"
                fullWidth
              />
              <DatePicker
                label="Start Date"
                value={newBlackoutDate}
                onChange={(date) => setNewBlackoutDate(date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label="End Date (Optional)"
                value={newBlackoutEndDate}
                onChange={(date) => setNewBlackoutEndDate(date)}
                minDate={newBlackoutDate || undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: 'Leave empty for single-day blackout'
                  }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setBlackoutDialogOpen(false);
              setNewBlackoutDate(null);
              setNewBlackoutEndDate(null);
              setNewBlackoutName('');
            }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAddBlackoutDate}
              disabled={!newBlackoutDate || !newBlackoutName.trim()}
            >
              Add Blackout Date
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
