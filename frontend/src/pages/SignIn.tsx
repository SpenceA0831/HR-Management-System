import { useState } from 'react';
import { Box, Typography, Paper, Container, Alert } from '@mui/material';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useStore } from '../store/useStore';

export default function SignIn() {
  const { setCurrentUser, setIsAuthenticated } = useStore();
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setError(null);

      // Decode JWT to get email
      if (!credentialResponse.credential) {
        throw new Error('No credential received');
      }

      // Decode the JWT token to get user email
      const base64Url = credentialResponse.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      const userEmail = payload.email;

      // Call backend to get user by email (using POST to avoid CORS)
      const response = await fetch(
        `${import.meta.env.VITE_APPS_SCRIPT_URL}?action=getUserByEmail`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8', // Use text/plain to avoid CORS preflight
          },
          body: JSON.stringify({ email: userEmail }),
        }
      );
      const userData = await response.json();

      if (!userData.success) {
        throw new Error(userData.error || 'User not found in system. Please contact your administrator.');
      }

      setCurrentUser(userData.data);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in. Please try again.');
    }
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
            component="img"
            src="/logo.png"
            alt="Lift Every Voice Philly"
            sx={{
              width: 120,
              height: 'auto',
              mx: 'auto',
              mb: 3,
            }}
          />

          <Typography variant="h4" gutterBottom fontWeight={700}>
            HR Management System
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            PTO Tracking & Staff Evaluations
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Sign-In failed')}
            />
          </Box>

          <Typography variant="caption" color="text.secondary">
            Sign in with your Google Workspace account
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
