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
    <Container maxWidth="md">
      <Box sx={{ py: 8 }}>
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
          sx={{ mb: 6 }}
        >
          Select a module to get started
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: isAdmin ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr'
            },
            gap: 4,
          }}
        >
          <Card
            elevation={3}
            sx={{
              borderRadius: 4,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
              },
            }}
          >
            <CardActionArea
              onClick={() => handleModuleSelect('pto')}
              sx={{ height: '100%' }}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 320,
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    mx: 'auto',
                    mb: 3,
                  }}
                >
                  <Calendar size={40} />
                </Box>

                <Typography
                  variant="h5"
                  sx={{
                    mb: 2,
                    fontWeight: 700,
                    lineHeight: 1.3,
                  }}
                >
                  PTO Tracker
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    lineHeight: 1.6,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  Manage time-off requests, view balances, and track team calendars
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>

          <Card
            elevation={3}
            sx={{
              borderRadius: 4,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
              },
            }}
          >
            <CardActionArea
              onClick={() => handleModuleSelect('evaluations')}
              sx={{ height: '100%' }}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 320,
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 2,
                    bgcolor: 'secondary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    mx: 'auto',
                    mb: 3,
                  }}
                >
                  <TrendingUp size={40} />
                </Box>

                <Typography
                  variant="h5"
                  sx={{
                    mb: 2,
                    fontWeight: 700,
                    lineHeight: 1.3,
                  }}
                >
                  Staff Evaluations
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    lineHeight: 1.6,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  360-degree reviews, performance tracking, and competency management
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>

          <Card
            elevation={3}
            sx={{
              borderRadius: 4,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
              },
            }}
          >
            <CardActionArea
              onClick={() => handleModuleSelect('payroll')}
              sx={{ height: '100%' }}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 320,
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 2,
                    bgcolor: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    mx: 'auto',
                    mb: 3,
                  }}
                >
                  <DollarSign size={40} />
                </Box>

                <Typography
                  variant="h5"
                  sx={{
                    mb: 2,
                    fontWeight: 700,
                    lineHeight: 1.3,
                  }}
                >
                  Payroll &<br />Reimbursements
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    lineHeight: 1.6,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  Submit expense reimbursements and manage payroll runs
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>

          {isAdmin && (
            <Card
              elevation={3}
              sx={{
                borderRadius: 4,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
            >
              <CardActionArea
                onClick={() => handleModuleSelect('admin')}
                sx={{ height: '100%' }}
              >
                <CardContent
                  sx={{
                    textAlign: 'center',
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 320,
                  }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      bgcolor: 'error.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      mx: 'auto',
                      mb: 3,
                    }}
                  >
                    <Shield size={40} />
                  </Box>

                  <Typography
                    variant="h5"
                    sx={{
                      mb: 2,
                      fontWeight: 700,
                      lineHeight: 1.3,
                    }}
                  >
                    Admin Console
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
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
