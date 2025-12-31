import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Collapse,
  IconButton,
  Stack,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Alert,
} from '@mui/material';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Competency, Rating, EvaluationStatus } from '../../../types';
import { RATING_LABELS, getStatusLabel, getStatusColor } from '../../../constants/evaluations';

interface EvaluationFormProps {
  competencies: Competency[];
  initialRatings: Rating[];
  onSave: (ratings: Omit<Rating, 'id' | 'evaluationId' | 'createdAt' | 'updatedAt'>[], submit: boolean) => void;
  onApprove?: () => void;
  onPullBack?: () => void;
  title: string;
  status: EvaluationStatus;
  userRole: string;
}

export default function EvaluationForm({
  competencies,
  initialRatings,
  onSave,
  onApprove,
  onPullBack,
  title,
  status,
}: EvaluationFormProps) {
  // Local ratings state (simplified Rating type without DB fields)
  type LocalRating = {
    competencyId: string;
    score: number;
    comments: string;
  };

  const [ratings, setRatings] = useState<LocalRating[]>([]);

  useEffect(() => {
    setRatings(
      competencies.map((c) => {
        const existing = initialRatings.find((r) => r.competencyId === c.id);
        return {
          competencyId: c.id,
          score: existing?.score || 3,
          comments: existing?.comments || '',
        };
      })
    );
  }, [competencies, initialRatings]);

  const [expandedSections, setExpandedSections] = useState({
    org: true,
    role: true,
  });

  const isReadOnly = status !== 'Draft';

  const toggleSection = (section: 'org' | 'role') => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleRatingChange = (id: string, score: number) => {
    if (isReadOnly) return;
    const newRatings = ratings.map((r) => (r.competencyId === id ? { ...r, score } : r));
    setRatings(newRatings);
  };

  const handleCommentChange = (id: string, comments: string) => {
    if (isReadOnly) return;
    const newRatings = ratings.map((r) => (r.competencyId === id ? { ...r, comments } : r));
    setRatings(newRatings);
  };

  const orgWide = competencies.filter((c) => c.category === 'Org-Wide');
  const roleSpecific = competencies.filter((c) => c.category === 'Role-Specific');

  const calculateGroupAverage = (list: Competency[]) => {
    const groupRatings = ratings.filter((r) => list.some((c) => c.id === r.competencyId));
    if (groupRatings.length === 0) return '0.0';
    const sum = groupRatings.reduce((acc, r) => acc + r.score, 0);
    return (sum / groupRatings.length).toFixed(1);
  };

  const renderGroup = (
    groupTitle: string,
    groupDescription: string,
    list: Competency[],
    accentColor: 'primary' | 'warning',
    isExpanded: boolean,
    onToggle: () => void
  ) => {
    const avg = calculateGroupAverage(list);

    return (
      <Box sx={{ mb: 6 }}>
        {/* Section Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            bgcolor: `${accentColor}.50`,
            borderRadius: 4,
            border: '1px solid',
            borderColor: `${accentColor}.100`,
            mb: 3,
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              boxShadow: 1,
            },
          }}
          onClick={onToggle}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: `${accentColor}.900`,
                  }}
                >
                  {groupTitle}
                </Typography>
                <IconButton size="small" sx={{ color: `${accentColor}.600` }}>
                  {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </IconButton>
              </Box>
              <Typography variant="body2" sx={{ color: `${accentColor}.700`, fontWeight: 500, mt: 0.5 }}>
                {groupDescription}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                bgcolor: 'background.paper',
                px: 2,
                py: 1,
                borderRadius: 3,
                boxShadow: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  color: 'text.secondary',
                  fontSize: '0.625rem',
                }}
              >
                Section Avg
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: `${accentColor}.600` }}>
                {avg}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Competencies List */}
        <Collapse in={isExpanded}>
          <Stack spacing={4}>
            {list.map((comp) => {
              const rating =
                ratings.find((r) => r.competencyId === comp.id) || {
                  competencyId: comp.id,
                  score: 3,
                  comments: '',
                };
              return (
                <Paper
                  key={comp.id}
                  elevation={0}
                  sx={{
                    p: 4,
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'box-shadow 0.2s',
                    '&:hover': {
                      boxShadow: 2,
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      gap: 3,
                    }}
                  >
                    {/* Competency Info */}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        {comp.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {comp.description}
                      </Typography>
                    </Box>

                    {/* Rating Buttons */}
                    <Box sx={{ minWidth: { xs: '100%', md: 290 } }}>
                      <ToggleButtonGroup
                        value={rating.score}
                        exclusive
                        onChange={(_, newValue) => {
                          if (newValue !== null) handleRatingChange(comp.id, newValue);
                        }}
                        disabled={isReadOnly}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(5, 1fr)',
                          gap: 0.5,
                          width: '100%',
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <Tooltip
                            key={val}
                            title={RATING_LABELS[val]?.label ?? 'Unknown'}
                            placement="top"
                            arrow
                          >
                            <ToggleButton
                              value={val}
                              sx={{
                                borderRadius: 2,
                                border: '2px solid',
                                borderColor:
                                  rating.score === val ? `${accentColor}.600` : 'divider',
                                bgcolor:
                                  rating.score === val ? `${accentColor}.50` : 'background.default',
                                color: rating.score === val ? `${accentColor}.600` : 'text.disabled',
                                fontWeight: 700,
                                '&:hover': {
                                  borderColor: rating.score === val ? `${accentColor}.700` : 'grey.400',
                                  bgcolor: rating.score === val ? `${accentColor}.100` : 'grey.50',
                                },
                                '&.Mui-disabled': {
                                  cursor: 'not-allowed',
                                },
                              }}
                            >
                              {val}
                            </ToggleButton>
                          </Tooltip>
                        ))}
                      </ToggleButtonGroup>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          textAlign: 'center',
                          mt: 1,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: 1.2,
                          color: `${accentColor}.600`,
                          fontSize: '0.625rem',
                        }}
                      >
                        {RATING_LABELS[rating.score]?.label || 'Unknown'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Comments */}
                  <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 1.5,
                        color: 'text.secondary',
                        display: 'block',
                        mb: 1,
                        fontSize: '0.625rem',
                      }}
                    >
                      Reflections & Evidence
                    </Typography>
                    <TextField
                      disabled={isReadOnly}
                      value={rating.comments}
                      onChange={(e) => handleCommentChange(comp.id, e.target.value)}
                      placeholder="Share a specific project or moment that illustrates this..."
                      multiline
                      rows={3}
                      fullWidth
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                        },
                      }}
                    />
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        </Collapse>
      </Box>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          mb: 6,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 3,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
            <Chip
              label={getStatusLabel(status)}
              color={getStatusColor(status)}
              size="small"
              sx={{
                fontWeight: 700,
                textTransform: 'uppercase',
                fontSize: '0.625rem',
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Honest reflection is the first step toward professional excellence.
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {status === 'Draft' && (
            <>
              <Button
                variant="outlined"
                onClick={() => onSave(ratings, false)}
                sx={{ px: 3, py: 1.5, fontWeight: 700 }}
              >
                Save Draft
              </Button>
              <Button
                variant="contained"
                onClick={() => onSave(ratings, true)}
                sx={{ px: 4, py: 1.5, fontWeight: 700 }}
              >
                Submit for Review
              </Button>
            </>
          )}
          {status === 'Submitted' && (
            <>
              {onPullBack && (
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={onPullBack}
                  sx={{ px: 3, py: 1.5, fontWeight: 700 }}
                >
                  Pull Back to Draft
                </Button>
              )}
              {onApprove && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={onApprove}
                  sx={{ px: 4, py: 1.5, fontWeight: 700 }}
                >
                  Approve (Manager View)
                </Button>
              )}
            </>
          )}
          {status === 'Submitted' && !onApprove && !onPullBack && (
            <Alert severity="info" sx={{ py: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontStyle: 'italic' }}>
                Waiting for manager approval...
              </Typography>
            </Alert>
          )}
        </Box>
      </Paper>

      {/* Competency Groups */}
      {renderGroup(
        '1. Team Competencies',
        'Core organizational values.',
        orgWide,
        'primary',
        expandedSections.org,
        () => toggleSection('org')
      )}
      {renderGroup(
        '2. Role Competencies',
        `Skills specific to ${title.split(' ')[0]}.`,
        roleSpecific,
        'warning',
        expandedSections.role,
        () => toggleSection('role')
      )}
    </Box>
  );
}
