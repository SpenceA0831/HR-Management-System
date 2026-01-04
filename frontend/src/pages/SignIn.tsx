import { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Container, Alert, Menu, MenuItem, CircularProgress } from '@mui/material';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useStore } from '../store/useStore';
import { getDemoUsers } from '../services/api/usersApi';
import type { User } from '../types';

export default function SignIn() {
  const { setCurrentUser, setIsAuthenticated } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const open = Boolean(anchorEl);

  // Demo mode disabled for production
  useEffect(() => {
    setLoadingUsers(false);
    // Demo users no longer loaded - using real OAuth only
  }, []);

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

  const handleDemoLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setAnchorEl(null);
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
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

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {import.meta.env.VITE_GOOGLE_CLIENT_ID &&
             import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'YOUR_CLIENT_ID.apps.googleusercontent.com' ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Sign-In failed')}
                useOneTap
              />
            ) : (
              <Alert severity="info" sx={{ textAlign: 'left' }}>
                Google OAuth not configured. Using demo mode.
              </Alert>
            )}

            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={handleOpenMenu}
              disabled={loadingUsers}
              sx={{ py: 1.5 }}
            >
              {loadingUsers ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <span>Loading users...</span>
                </Box>
              ) : (
                'Sign In (Demo Mode)'
              )}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleCloseMenu}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
              PaperProps={{
                sx: { minWidth: anchorEl?.offsetWidth || 200 }
              }}
            >
              {users.length === 0 ? (
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    No users available
                  </Typography>
                </MenuItem>
              ) : (
                users.map((user) => (
                  <MenuItem
                    key={user.id}
                    onClick={() => handleDemoLogin(user)}
                    sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}
                  >
                    <Typography variant="body1" fontWeight={600}>
                      {user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.userRole} • {user.email}
                    </Typography>
                  </MenuItem>
                ))
              )}
            </Menu>
          </Box>

          <Typography variant="caption" color="text.secondary">
            Sign in with your Google Workspace account
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
