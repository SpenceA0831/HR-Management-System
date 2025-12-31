import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  Typography,
  Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Check } from 'lucide-react';
import type { Evaluation, EvaluationCycle } from '../../../types';
import { WORKFLOW_STATUS_SEQUENCES } from '../../../constants/evaluations';

interface TimelineProps {
  evaluation?: Evaluation;
  cycle: EvaluationCycle;
}

// Custom connector for modern look
const CustomConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 20,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage:
        'linear-gradient(90deg, rgb(99, 102, 241) 0%, rgb(99, 102, 241) 100%)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage:
        'linear-gradient(90deg, rgb(99, 102, 241) 0%, rgb(99, 102, 241) 100%)',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
    borderRadius: 1,
  },
}));

// Custom step icon
const CustomStepIcon = styled('div')<{ ownerState: { active?: boolean; completed?: boolean } }>(
  ({ theme, ownerState }) => ({
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    border: `4px solid ${theme.palette.background.paper}`,
    boxShadow: theme.shadows[2],
    fontSize: '0.875rem',
    fontWeight: 700,
    backgroundColor: ownerState.completed
      ? theme.palette.primary.main
      : ownerState.active
        ? theme.palette.primary.light
        : theme.palette.grey[100],
    color: ownerState.completed || ownerState.active ? '#fff' : theme.palette.grey[400],
  })
);

function StepIcon(props: { active?: boolean; completed?: boolean; icon: React.ReactNode }) {
  const { active, completed, icon } = props;

  return (
    <CustomStepIcon ownerState={{ active, completed }}>
      {completed ? <Check size={20} strokeWidth={3} /> : icon}
    </CustomStepIcon>
  );
}

export default function Timeline({ evaluation, cycle }: TimelineProps) {
  const getSteps = () => {
    if (!evaluation) {
      return [
        {
          label: 'Upcoming',
          date: cycle.deadline,
          status: 'upcoming' as const,
        },
      ];
    }

    const sequence = WORKFLOW_STATUS_SEQUENCES[evaluation.type] || [];
    const currentIndex = sequence.indexOf(evaluation.status);

    return sequence.map((status, idx) => ({
      label: status.replace(/-/g, ' '),
      date: idx === 0 ? cycle.selfDeadline || cycle.deadline : cycle.deadline,
      status:
        idx < currentIndex
          ? ('complete' as const)
          : idx === currentIndex
            ? ('active' as const)
            : ('upcoming' as const),
    }));
  };

  const steps = getSteps();
  const activeStep = steps.findIndex((s) => s.status === 'active');

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 4, fontSize: '0.875rem', letterSpacing: 1.2 }}>
        Evaluation Journey
      </Typography>

      <Stepper activeStep={activeStep} connector={<CustomConnector />} alternativeLabel>
        {steps.map((step, index) => {
          const isCompleted = step.status === 'complete';
          const isActive = step.status === 'active';

          return (
            <Step key={index} completed={isCompleted}>
              <StepLabel
                StepIconComponent={() => (
                  <StepIcon active={isActive} completed={isCompleted} icon={index + 1} />
                )}
              >
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: step.status === 'upcoming' ? 'text.disabled' : 'text.primary',
                    }}
                  >
                    {step.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                      display: 'block',
                      mt: 0.5,
                    }}
                  >
                    {new Date(step.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Typography>
                  {isActive && (
                    <Chip
                      label="CURRENT PHASE"
                      color="primary"
                      size="small"
                      sx={{
                        mt: 1,
                        height: 20,
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        '@keyframes pulse': {
                          '0%, 100%': {
                            opacity: 1,
                          },
                          '50%': {
                            opacity: 0.7,
                          },
                        },
                      }}
                    />
                  )}
                </Box>
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Paper>
  );
}
