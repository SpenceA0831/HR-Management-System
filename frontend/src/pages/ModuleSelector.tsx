import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Typography,
} from '@mui/material';
import { Calendar, TrendingUp, Shield } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function ModuleSelector() {
  const navigate = useNavigate();
  const { setActiveModule, currentUser } = useStore();

  const isAdmin = currentUser?.userRole === 'ADMIN';

  const handleModuleSelect = (module: 'pto' | 'evaluations' | 'admin') => {
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
              md: isAdmin ? '1fr 1fr 1fr' : '1fr 1fr'
            },
            gap: 4,
          }}
        >
          <Box>
            <Card
              elevation={3}
              sx={{
                height: '100%',
                borderRadius: 4,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
            >
              <CardActionArea
                onClick={() => handleModuleSelect('pto')}
                sx={{ height: '100%', p: 4 }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
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

                  <Typography variant="h4" gutterBottom fontWeight={600}>
                    PTO Tracker
                  </Typography>

                  <Typography variant="body1" color="text.secondary">
                    Manage time-off requests, view balances, and track team calendars
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Box>

          <Box>
            <Card
              elevation={3}
              sx={{
                height: '100%',
                borderRadius: 4,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
            >
              <CardActionArea
                onClick={() => handleModuleSelect('evaluations')}
                sx={{ height: '100%', p: 4 }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
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

                  <Typography variant="h4" gutterBottom fontWeight={600}>
                    Staff Evaluations
                  </Typography>

                  <Typography variant="body1" color="text.secondary">
                    360-degree reviews, performance tracking, and competency management
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Box>

          {isAdmin && (
            <Box>
              <Card
                elevation={3}
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleModuleSelect('admin')}
                  sx={{ height: '100%', p: 4 }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
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

                    <Typography variant="h4" gutterBottom fontWeight={600}>
                      Admin Console
                    </Typography>

                    <Typography variant="body1" color="text.secondary">
                      Manage system settings, PTO policies, and evaluation configurations
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
}
