import React, { useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import HomePage from './components/HomePage';
import FileExplorer from './components/FileExplorer';
import Navbar from './components/Navbar';

// Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Theme Context
const ThemeContext = createContext();

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
};

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [rootData, setRootData] = useState(null);
  const [shareList, setShareList] = useState([]);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: darkMode 
              ? '0 4px 20px rgba(0,0,0,0.3)' 
              : '0 4px 20px rgba(0,0,0,0.1)',
          },
        },
      },
    },
  });

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const login = (username, root, shares) => {
    setUser(username);
    setRootData(root);
    setShareList(shares || []);
  };

  const logout = () => {
    setUser(null);
    setRootData(null);
    setShareList([]);
  };

  const authValue = {
    user,
    rootData,
    shareList,
    login,
    logout,
    setRootData,
    setShareList,
  };

  const themeValue = {
    darkMode,
    toggleTheme,
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthContext.Provider value={authValue}>
        <ThemeContext.Provider value={themeValue}>
          <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
            {user && <Navbar />}
            <Routes>
              <Route 
                path="/login" 
                element={!user ? <LoginPage /> : <Navigate to="/home" />} 
              />
              <Route 
                path="/register" 
                element={!user ? <RegisterPage /> : <Navigate to="/home" />} 
              />
              <Route 
                path="/home" 
                element={user ? <HomePage /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/explorer/*" 
                element={user ? <FileExplorer /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/" 
                element={<Navigate to={user ? "/home" : "/login"} />} 
              />
            </Routes>
          </Box>
        </ThemeContext.Provider>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;
