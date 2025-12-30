import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { Plus, Trash2, Edit, Target, Award } from 'lucide-react';
import {
  getEvaluationCycles,
  getCompetencies,
  saveCompetency,
  deleteCompetency,
} from '../../services/api/evaluationsApi';
import type { EvaluationCycle, Competency, CompetencyCategory, RoleType } from '../../types';

export default function EvaluationsSettings() {
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Competency dialog state
  const [competencyDialogOpen, setCompetencyDialogOpen] = useState(false);
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);
  const [competencyForm, setCompetencyForm] = useState({
    name: '',
    description: '',
    category: 'Org-Wide' as CompetencyCategory,
    roleType: '' as RoleType | '',
  });

  const roleTypes: RoleType[] = [
    'ORGANIZER',
    'OPS_MANAGER',
    'COMMS_MANAGER',
    'DEVELOPMENT',
    'DEPUTY_DIRECTOR',
    'EXECUTIVE_DIRECTOR',
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [cyclesRes, competenciesRes] = await Promise.all([
        getEvaluationCycles(),
        getCompetencies(),
      ]);

      if (cyclesRes.success && cyclesRes.data) {
        setCycles(cyclesRes.data);
      }

      if (competenciesRes.success && competenciesRes.data) {
        setCompetencies(competenciesRes.data);
      } else {
        setError(competenciesRes.error || 'Failed to load competencies');
      }
    } catch (err) {
      setError('Failed to load evaluation settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCompetencyDialog = (competency?: Competency) => {
    if (competency) {
      setEditingCompetency(competency);
      setCompetencyForm({
        name: competency.name,
        description: competency.description,
        category: competency.category,
        roleType: competency.roleType || '',
      });
    } else {
      setEditingCompetency(null);
      setCompetencyForm({
        name: '',
        description: '',
        category: 'Org-Wide',
        roleType: '',
      });
    }
    setCompetencyDialogOpen(true);
  };

  const handleCloseCompetencyDialog = () => {
    setCompetencyDialogOpen(false);
    setEditingCompetency(null);
    setCompetencyForm({
      name: '',
      description: '',
      category: 'Org-Wide',
      roleType: '',
    });
  };

  const handleSaveCompetency = async () => {
    if (!competencyForm.name.trim() || !competencyForm.description.trim()) return;

    try {
      const response = await saveCompetency({
        id: editingCompetency?.id,
        name: competencyForm.name,
        description: competencyForm.description,
        category: competencyForm.category,
        roleType: competencyForm.roleType || undefined,
      });

      if (response.success && response.data) {
        if (editingCompetency) {
          setCompetencies(
            competencies.map((c) => (c.id === editingCompetency.id ? response.data! : c))
          );
          setSuccess('Competency updated successfully!');
        } else {
          setCompetencies([...competencies, response.data]);
          setSuccess('Competency created successfully!');
        }
        handleCloseCompetencyDialog();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to save competency');
      }
    } catch (err) {
      setError('Failed to save competency');
      console.error(err);
    }
  };

  const handleDeleteCompetency = async (competencyId: string) => {
    try {
      const response = await deleteCompetency(competencyId);

      if (response.success) {
        setCompetencies(competencies.filter((c) => c.id !== competencyId));
        setSuccess('Competency deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to delete competency');
      }
    } catch (err) {
      setError('Failed to delete competency');
      console.error(err);
    }
  };

  const formatRoleType = (roleType: string) => {
    return roleType
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 3 }}>
      <Typography variant="h6" gutterBottom fontWeight={600}>
        Evaluations Settings
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage evaluation cycles, competencies, and review configurations
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

      {/* Evaluation Cycles */}
      <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Evaluation Cycles
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage review cycles and deadlines
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Plus size={18} />}
              disabled
            >
              Add Cycle
            </Button>
          </Box>

          {cycles.length === 0 ? (
            <Alert severity="info" icon={<Target size={20} />}>
              No evaluation cycles configured. Cycle management will be available in a future update.
            </Alert>
          ) : (
            <List>
              {cycles.map((cycle) => (
                <ListItem
                  key={cycle.id}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 0 },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {cycle.name}
                        <Chip
                          label={cycle.status}
                          size="small"
                          color={
                            cycle.status === 'Active'
                              ? 'success'
                              : cycle.status === 'Upcoming'
                              ? 'info'
                              : 'default'
                          }
                        />
                      </Box>
                    }
                    secondary={`${cycle.type} • Deadline: ${cycle.deadline}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Custom Competencies */}
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Custom Competencies
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create and manage custom evaluation competencies
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Plus size={18} />}
              onClick={() => handleOpenCompetencyDialog()}
            >
              Add Competency
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Note: Built-in competencies are defined in the system. Only custom competencies can be
            edited or deleted here.
          </Typography>

          {competencies.filter((c) => c.isCustom).length === 0 ? (
            <Alert severity="info" icon={<Award size={20} />}>
              No custom competencies created. Add custom competencies to tailor evaluations to your
              organization's needs.
            </Alert>
          ) : (
            <List>
              {competencies
                .filter((c) => c.isCustom)
                .map((competency) => (
                  <ListItem
                    key={competency.id}
                    sx={{
                      borderBottom: 1,
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 0 },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {competency.name}
                          <Chip
                            label={competency.category}
                            size="small"
                            variant="outlined"
                          />
                          {competency.roleType && (
                            <Chip
                              label={formatRoleType(competency.roleType)}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={competency.description}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleOpenCompetencyDialog(competency)}
                        sx={{ mr: 1 }}
                      >
                        <Edit size={18} />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteCompetency(competency.id)}
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

      {/* Add/Edit Competency Dialog */}
      <Dialog
        open={competencyDialogOpen}
        onClose={handleCloseCompetencyDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingCompetency ? 'Edit Competency' : 'Add Custom Competency'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Competency Name"
              value={competencyForm.name}
              onChange={(e) =>
                setCompetencyForm({ ...competencyForm, name: e.target.value })
              }
              placeholder="e.g., Strategic Thinking"
              fullWidth
              required
            />

            <TextField
              label="Description"
              value={competencyForm.description}
              onChange={(e) =>
                setCompetencyForm({ ...competencyForm, description: e.target.value })
              }
              placeholder="Describe what this competency measures"
              multiline
              rows={3}
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={competencyForm.category}
                onChange={(e) =>
                  setCompetencyForm({
                    ...competencyForm,
                    category: e.target.value as CompetencyCategory,
                  })
                }
                label="Category"
              >
                <MenuItem value="Org-Wide">Organization-Wide</MenuItem>
                <MenuItem value="Role-Specific">Role-Specific</MenuItem>
              </Select>
            </FormControl>

            {competencyForm.category === 'Role-Specific' && (
              <FormControl fullWidth>
                <InputLabel>Role Type</InputLabel>
                <Select
                  value={competencyForm.roleType}
                  onChange={(e) =>
                    setCompetencyForm({
                      ...competencyForm,
                      roleType: e.target.value as RoleType,
                    })
                  }
                  label="Role Type"
                >
                  {roleTypes.map((role) => (
                    <MenuItem key={role} value={role}>
                      {formatRoleType(role)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompetencyDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveCompetency}
            disabled={!competencyForm.name.trim() || !competencyForm.description.trim()}
          >
            {editingCompetency ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
