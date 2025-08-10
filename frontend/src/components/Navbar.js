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
  Button,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Home,
  Folder,
  Logout,
  Delete,
  SmartToy,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useThemeMode } from '../App';
import { authAPI } from '../utils/api';
import { useTheme } from '@mui/material/styles';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const handleDeleteAccount = () => {
    console.log('Delete account clicked');
    handleMenuClose();
  };

  const handleHomeClick = () => {
    navigate('/home');
  };

  const navButtonStyle = (active) => ({
    my: 2,
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
    display: 'flex',
    alignItems: 'center',
    fontWeight: active ? 600 : 400,
  });

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
          <img 
            src="/logo192.png"
            alt="ResShare Logo"
            style={{
              width: '32px',
              height: '32px',
              cursor: 'pointer',
            }}
            onClick={handleHomeClick}
          />
          <Typography 
            variant="h6" 
            sx={{ 
              color: theme.palette.text.primary,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={handleHomeClick}
          >
            ResShare Drive
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
          <Button
            onClick={() => navigate('/home')}
            sx={navButtonStyle(location.pathname === '/home')}
            startIcon={<Home sx={{ color: theme.palette.text.primary }} />}
          >
            Home
          </Button>
          <Button
            onClick={() => navigate('/explorer')}
            sx={navButtonStyle(location.pathname.startsWith('/explorer'))}
            startIcon={<Folder sx={{ color: theme.palette.text.primary }} />}
          >
            Explorer
          </Button>
          <Button
            onClick={() => navigate('/chat')}
            sx={navButtonStyle(location.pathname === '/chat')}
            startIcon={<SmartToy sx={{ color: theme.palette.text.primary }} />}
          >
            AI Chat
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Go to Home">
            <IconButton 
              onClick={handleHomeClick}
              aria-label="Go to Home"
              sx={{ 
                color: location.pathname === '/home' ? theme.palette.primary.main : theme.palette.action.active,
                '&:hover': { backgroundColor: 'action.hover' },
              }}
            >
              <Home fontSize="medium" />
            </IconButton>
          </Tooltip>

          <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton 
              onClick={toggleTheme}
              aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              sx={{ 
                color: theme.palette.action.active,
                '&:hover': { backgroundColor: 'action.hover' },
              }}
            >
              {darkMode ? <Brightness7 fontSize="medium" /> : <Brightness4 fontSize="medium" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Account settings">
            <IconButton
              onClick={handleMenuOpen}
              aria-label="Account settings"
              sx={{ 
                ml: 1,
                color: theme.palette.action.active,
                '&:hover': { backgroundColor: 'action.hover' },
              }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                  color: theme.palette.primary.contrastText,
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
              <Avatar sx={{ bgcolor: 'primary.main', color: theme.palette.primary.contrastText }}>
                {user?.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="subtitle2">{user}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Signed in
                </Typography>
              </Box>
            </MenuItem>
            
            <MenuItem onClick={handleLogout} sx={{ color: theme.palette.text.primary }}>
              <Logout fontSize="medium" sx={{ mr: 2, color: theme.palette.action.active }} />
              Logout
            </MenuItem>
            
            <MenuItem onClick={handleDeleteAccount} sx={{ color: theme.palette.error.main }}>
              <Delete fontSize="medium" sx={{ mr: 2, color: theme.palette.error.main }} />
              Delete Account
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 