import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  CloudQueue,
  AccountCircle,
  Brightness4,
  Brightness7,
  Home,
  Logout,
  Delete,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth, useThemeMode } from '../App';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      // Call logout API
      await fetch('/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const handleDeleteAccount = () => {
    // This would open a confirmation dialog
    console.log('Delete account clicked');
    handleMenuClose();
  };

  const handleHomeClick = () => {
    navigate('/home');
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CloudQueue 
            sx={{ 
              fontSize: 32, 
              color: 'primary.main',
              cursor: 'pointer',
            }}
            onClick={handleHomeClick}
          />
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'text.primary',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={handleHomeClick}
          >
            ResShare Drive
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Go to Home">
            <IconButton 
              onClick={handleHomeClick}
              sx={{ color: 'text.primary' }}
            >
              <Home />
            </IconButton>
          </Tooltip>

          <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton 
              onClick={toggleTheme}
              sx={{ color: 'text.primary' }}
            >
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Account settings">
            <IconButton
              onClick={handleMenuOpen}
              sx={{ ml: 1 }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                }}
              >
                {user?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            PaperProps={{
              elevation: 3,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                minWidth: 200,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem disabled>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {user?.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="subtitle2">{user}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Signed in
                </Typography>
              </Box>
            </MenuItem>
            
            <MenuItem onClick={handleLogout}>
              <Logout fontSize="small" sx={{ mr: 2 }} />
              Logout
            </MenuItem>
            
            <MenuItem onClick={handleDeleteAccount} sx={{ color: 'error.main' }}>
              <Delete fontSize="small" sx={{ mr: 2 }} />
              Delete Account
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 