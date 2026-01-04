import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Typography,
} from '@mui/material';
import { Calendar, TrendingUp, DollarSign, Shield } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function ModuleSelector() {
  const navigate = useNavigate();
  const { setActiveModule, currentUser } = useStore();

  const isAdmin = currentUser?.userRole === 'ADMIN';

  const handleModuleSelect = (module: 'pto' | 'evaluations' | 'payroll' | 'admin') => {
    setActiveModule(module);
    navigate(`/${module}`);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 6 }}>
        <Typography
          variant="h3"
          align="center"
          gutterBottom
          fontWeight={700}
        >
          Welcome, {currentUser?.name}!
        </Typography>

        <Typography
          variant="h6"
          align="center"
          color="text.secondary"
          sx={{ mb: 5 }}
        >
          Select a module to get started
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: isAdmin ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
            },
            gap: 3,
            maxWidth: isAdmin ? 1400 : 1100,
            mx: 'auto',
          }}
        >
          <Card
            elevation={2}
            sx={{
              borderRadius: 3,
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
          >
            <CardActionArea
              onClick={() => handleModuleSelect('pto')}
              sx={{ height: '100%' }}
            >
              <CardContent
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    mb: 0.5,
                  }}
                >
                  <Calendar size={48} strokeWidth={1.5} />
                </Box>

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  PTO Tracker
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    textAlign: 'center',
                    lineHeight: 1.5,
                    fontSize: '0.875rem',
                  }}
                >
                  Manage time-off requests, view balances, and track team calendars
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>

          <Card
            elevation={2}
            sx={{
              borderRadius: 3,
              opacity: 0.5,
              pointerEvents: 'none',
              filter: 'grayscale(0.3)',
            }}
          >
            <CardActionArea
              disabled
              sx={{ height: '100%', cursor: 'not-allowed' }}
            >
              <CardContent
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    bgcolor: 'secondary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    mb: 0.5,
                  }}
                >
                  <TrendingUp size={48} strokeWidth={1.5} />
                </Box>

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  Staff Evaluations
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    textAlign: 'center',
                    lineHeight: 1.5,
                    fontSize: '0.875rem',
                  }}
                >
                  360-degree reviews, performance tracking, and competency management
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>

          <Card
            elevation={2}
            sx={{
              borderRadius: 3,
              opacity: 0.5,
              pointerEvents: 'none',
              filter: 'grayscale(0.3)',
            }}
          >
            <CardActionArea
              disabled
              sx={{ height: '100%', cursor: 'not-allowed' }}
            >
              <CardContent
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    mb: 0.5,
                  }}
                >
                  <DollarSign size={48} strokeWidth={1.5} />
                </Box>

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  Payroll &<br />Reimbursements
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    textAlign: 'center',
                    lineHeight: 1.5,
                    fontSize: '0.875rem',
                  }}
                >
                  Submit expense reimbursements and manage payroll runs
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>

          {isAdmin && (
            <Card
              elevation={2}
              sx={{
                borderRadius: 3,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardActionArea
                onClick={() => handleModuleSelect('admin')}
                sx={{ height: '100%' }}
              >
                <CardContent
                  sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      bgcolor: 'error.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      mb: 0.5,
                    }}
                  >
                    <Shield size={48} strokeWidth={1.5} />
                  </Box>

                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                  >
                    Admin Console
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      textAlign: 'center',
                      lineHeight: 1.5,
                      fontSize: '0.875rem',
                    }}
                  >
                    Manage system settings, PTO policies, and evaluation configurations
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          )}
        </Box>
      </Box>
    </Container>
  );
}
