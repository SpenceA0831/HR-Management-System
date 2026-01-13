import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { Home, Moon, Sun, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Layout() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { currentUser, mode, toggleMode, clearState, activeModule, setActiveModule } = useStore();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    clearState();
    handleMenuClose();
  };

  const handleHomeClick = () => {
    setActiveModule(null);
    navigate('/');
  };

  const getModuleName = () => {
    if (!activeModule) return 'HR Management System';
    if (activeModule === 'pto') return 'PTO Tracker';
    if (activeModule === 'evaluations') return 'Staff Evaluations';
    if (activeModule === 'admin') return 'Admin Console';
    return 'HR Management System';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="static"
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                bgcolor: mode === 'dark' ? 'white' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: mode === 'dark' ? '2px' : 0,
              }}
            >
              <img
                src="/logo.png"
                alt="HR Management System"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {getModuleName()}
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {activeModule && (
              <Tooltip title="Back to Module Selector">
                <IconButton onClick={handleHomeClick} color="inherit" size="small">
                  <Home size={20} />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Toggle Theme">
              <IconButton onClick={toggleMode} color="inherit" size="small">
                {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </IconButton>
            </Tooltip>

            <IconButton onClick={handleMenuOpen} size="small">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
                {currentUser?.name[0]}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
        <Outlet />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { width: 200, borderRadius: 3, mt: 1.5 } }}
      >
        <MenuItem disabled>
          <Typography variant="body2" fontWeight={600}>
            {currentUser?.name}
          </Typography>
        </MenuItem>
        <MenuItem disabled>
          <Typography variant="caption" color="text.secondary">
            {currentUser?.email}
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleSignOut}>
          <LogOut size={18} style={{ marginRight: 8 }} />
          Sign Out
        </MenuItem>
      </Menu>
    </Box>
  );
}
