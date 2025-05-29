import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Card,
  CardActionArea,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Snackbar,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  CreateNewFolder,
  Upload,
  Folder,
  InsertDriveFile,
  Share,
  People,
  Storage,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { fileAPI, utils } from '../utils/api';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, rootData, shareList, setRootData } = useAuth();
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalFolders: 0,
    sharedItems: 0,
  });

  useEffect(() => {
    if (rootData) {
      calculateStats(rootData);
    }
  }, [rootData, shareList]);

  const calculateStats = (node) => {
    let files = 0;
    let folders = 0;
    
    const traverse = (currentNode) => {
      if (currentNode.is_folder) {
        folders++;
        if (currentNode.children) {
          Object.values(currentNode.children).forEach(child => traverse(child));
        }
      } else {
        files++;
      }
    };

    if (node.children) {
      Object.values(node.children).forEach(child => traverse(child));
    }

    // Calculate shared items count from shareList object
    let sharedItemsCount = 0;
    if (shareList && typeof shareList === 'object') {
      Object.values(shareList).forEach(nodes => {
        if (Array.isArray(nodes)) {
          sharedItemsCount += nodes.length;
        }
      });
    }

    setStats({
      totalFiles: files,
      totalFolders: folders,
      sharedItems: sharedItemsCount,
    });
  };

  const handleSpeedDialToggle = () => {
    setSpeedDialOpen(!speedDialOpen);
  };

  const handleCreateFolder = () => {
    setCreateFolderOpen(true);
    setSpeedDialOpen(false);
  };

  const handleConfirmCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setSnackbar({
        open: true,
        message: 'Folder name cannot be empty',
        severity: 'error',
      });
      return;
    }

    const validationError = utils.validateFileName(newFolderName);
    if (validationError) {
      setSnackbar({
        open: true,
        message: validationError,
        severity: 'error',
      });
      return;
    }

    try {
      const response = await fileAPI.createFolder(newFolderName);
      
      if (response.result === 'SUCCESS') {
        setRootData(JSON.parse(response.root));
        setSnackbar({
          open: true,
          message: 'Folder created successfully!',
          severity: 'success',
        });
        setCreateFolderOpen(false);
        setNewFolderName('');
      } else {
        setSnackbar({
          open: true,
          message: response.result || 'Failed to create folder',
          severity: 'error',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to create folder',
        severity: 'error',
      });
    }
  };

  const handleUploadFile = () => {
    // Trigger file input click
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = false;
    fileInput.onchange = handleFileSelected;
    fileInput.click();
    setSpeedDialOpen(false);
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fileAPI.uploadFile(file, '');
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.message === 'SUCCESS') {
        setRootData(JSON.parse(response.root));
        setSnackbar({
          open: true,
          message: 'File uploaded successfully!',
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: response.message || 'Failed to upload file',
          severity: 'error',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to upload file',
        severity: 'error',
      });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
      event.target.value = '';
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleFolderClick = (folderName) => {
    navigate(`/explorer/${folderName}`);
  };

  const handleFileClick = (fileName) => {
    // Handle file preview or download
    console.log('File clicked:', fileName);
  };

  const renderRootItems = () => {
    if (!rootData || !rootData.children) return null;

    return Object.entries(rootData.children).map(([name, item]) => (
      <Grid item xs={12} sm={6} md={4} lg={3} key={name}>
        <Card
          sx={{
            height: '100%',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6,
            },
          }}
        >
          <CardActionArea
            onClick={() => item.is_folder ? handleFolderClick(name) : handleFileClick(name)}
            sx={{ height: '100%', p: 2 }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {item.is_folder ? (
                <Folder sx={{ fontSize: 48, color: 'primary.main' }} />
              ) : (
                <InsertDriveFile sx={{ fontSize: 48, color: 'text.secondary' }} />
              )}
              <Typography
                variant="subtitle1"
                align="center"
                sx={{
                  fontWeight: 500,
                  wordBreak: 'break-word',
                }}
              >
                {name}
              </Typography>
              {!item.is_folder && item.file_obj && (
                <Chip
                  label={`${(item.file_obj.size / 1024).toFixed(1)} KB`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </CardActionArea>
        </Card>
      </Grid>
    ));
  };

  const renderSharedItems = () => {
    // Convert shareList object to array format
    let sharedItemsArray = [];
    
    if (shareList && typeof shareList === 'object') {
      // shareList is an object with structure: { "username": [nodes...] }
      Object.entries(shareList).forEach(([fromUser, nodes]) => {
        if (Array.isArray(nodes)) {
          nodes.forEach(node => {
            sharedItemsArray.push({
              name: node.name || 'Shared Item',
              sharedBy: fromUser,
              node: node
            });
          });
        }
      });
    }

    if (sharedItemsArray.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          No shared items yet
        </Typography>
      );
    }

    return (
      <List>
        {sharedItemsArray.map((item, index) => (
          <ListItem
            key={index}
            secondaryAction={
              <Tooltip title="View">
                <IconButton edge="end" aria-label="view"> {/* Added aria-label for accessibility */}
                  <Visibility />
                </IconButton>
              </Tooltip>
            }
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <Share />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={item.name}
              secondary={`Shared by ${item.sharedBy}`}
            />
          </ListItem>
        ))}
      </List>
    );
  };

  const speedDialActions = [
    {
      icon: <CreateNewFolder />,
      name: 'Create Folder',
      onClick: handleCreateFolder,
    },
    {
      icon: <Upload />,
      name: 'Upload File',
      onClick: handleUploadFile,
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Welcome back, {user}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your files and folders with ease
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Side - My Files and Shared With Me */}
        <Grid item size ={{xs: 20, sm:9}}>
          {/* My Files Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Storage sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                My Files
              </Typography>
            </Box>
            <Grid container spacing={2}>
              {renderRootItems()}
              {(!rootData || !rootData.children || Object.keys(rootData.children).length === 0) && (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 6,
                      color: 'text.secondary',
                    }}
                  >
                    <Storage sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      No files yet
                    </Typography>
                    <Typography variant="body2">
                      Start by creating a folder or uploading a file
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Shared with Me Section */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Share sx={{ mr: 2, color: 'secondary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Shared with Me
              </Typography>
            </Box>
            {renderSharedItems()}
          </Paper>
        </Grid>

        {/* Right Side - Stats Cards */}
        <Grid item size ={{xs: 12, sm:3}}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                }}
              >
                <Storage sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {stats.totalFiles}
                  </Typography>
                  <Typography variant="body2">Total Files</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                }}
              >
                <Folder sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {stats.totalFolders}
                  </Typography>
                  <Typography variant="body2">Total Folders</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                }}
              >
                <People sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {stats.sharedItems}
                  </Typography>
                  <Typography variant="body2">Shared Items</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Speed Dial for Actions */}
      <SpeedDial
        ariaLabel="File actions"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        icon={<SpeedDialIcon />}
        onClose={() => setSpeedDialOpen(false)}
        onOpen={() => setSpeedDialOpen(true)}
        open={speedDialOpen}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.onClick}
          />
        ))}
      </SpeedDial>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onClose={() => setCreateFolderOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            variant="outlined"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleConfirmCreateFolder();
              }
            }}
            helperText="Enter a name for the new folder"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreateFolderOpen(false);
            setNewFolderName('');
          }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmCreateFolder} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Progress */}
      {uploading && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 90,
            right: 24,
            minWidth: 300,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 3,
            p: 2,
            zIndex: 1300,
          }}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            Uploading file...
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {uploadProgress}% complete
          </Typography>
        </Box>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default HomePage; 