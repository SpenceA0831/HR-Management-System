import { Box, Button, Typography, Paper, Container } from '@mui/material';
// import { GoogleLogin } from '@react-oauth/google';
import { useStore } from '../store/useStore';
import type { User } from '../types';

export default function SignIn() {
  const { setCurrentUser, setIsAuthenticated } = useStore();

  const handleGoogleSuccess = async () => {
    // TODO: Call backend to validate and get user
    // For now, create a mock user
    const mockUser: User = {
      id: '1',
      name: 'Demo User',
      email: 'demo@example.com',
      userRole: 'STAFF',
      teamId: 'team1',
      employmentType: 'Full Time',
      hireDate: '2024-01-01',
      roleType: 'ORGANIZER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentUser(mockUser);
    setIsAuthenticated(true);
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 4,
            textAlign: 'center',
            width: '100%',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: 32,
              mx: 'auto',
              mb: 3,
            }}
          >
            HR
          </Box>

          <Typography variant="h4" gutterBottom fontWeight={700}>
            HR Management System
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            PTO Tracking & Staff Evaluations
          </Typography>

          <Box sx={{ mb: 3 }}>
            {/* TODO: Configure Google OAuth */}
            {/* <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.error('Google Sign-In failed')}
            /> */}

            {/* Temporary demo button */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => handleGoogleSuccess()}
              sx={{ py: 1.5 }}
            >
              Sign In (Demo Mode)
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary">
            Sign in with your Google Workspace account
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
