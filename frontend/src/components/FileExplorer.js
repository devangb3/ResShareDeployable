import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Breadcrumbs,
  Link,
  Card,
  CardActionArea,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Folder,
  InsertDriveFile,
  MoreVert,
  ArrowBack,
  Upload,
  CreateNewFolder,
  Share,
  Download,
  Delete,
  NavigateNext,
  Home,
  CloudUpload,
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../App';

const FileExplorer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, rootData, setRootData } = useAuth();
  
  const [currentPath, setCurrentPath] = useState('');
  const [currentNode, setCurrentNode] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [shareUsername, setShareUsername] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const path = location.pathname.replace('/explorer/', '').replace('/explorer', '');
    setCurrentPath(path);
    
    if (rootData) {
      const node = findNodeByPath(rootData, path);
      setCurrentNode(node);
    }
  }, [location.pathname, rootData]);

  const findNodeByPath = (root, path) => {
    if (!path || path === '') return root;
    
    const parts = path.split('/').filter(part => part !== '');
    let current = root;
    
    for (const part of parts) {
      if (current.children && current.children[part]) {
        current = current.children[part];
      } else {
        return null;
      }
    }
    
    return current;
  };

  const getPathParts = () => {
    if (!currentPath) return [];
    return currentPath.split('/').filter(part => part !== '');
  };

  const handleBreadcrumbClick = (index) => {
    const parts = getPathParts();
    const newPath = parts.slice(0, index + 1).join('/');
    navigate(`/explorer/${newPath}`);
  };

  const handleItemClick = (itemName, item) => {
    if (item.is_folder) {
      const newPath = currentPath ? `${currentPath}/${itemName}` : itemName;
      navigate(`/explorer/${newPath}`);
    } else {
      // Handle file click (preview or download)
      handleDownload(itemName);
    }
  };

  const handleMenuOpen = (event, itemName, item) => {
    event.stopPropagation();
    setSelectedItem({ name: itemName, ...item });
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedItem(null);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const folderPath = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;
      
      const response = await fetch('/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          folder_path: folderPath,
        }),
      });

      const data = await response.json();

      if (response.ok && data.result === 'SUCCESS') {
        setRootData(JSON.parse(data.root));
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
          message: data.result || 'Failed to create folder',
          severity: 'error',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Network error. Please try again.',
        severity: 'error',
      });
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', currentPath || '');

      const response = await fetch('/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.result === 'SUCCESS') {
        setRootData(JSON.parse(data.root));
        setSnackbar({
          open: true,
          message: 'File uploaded successfully!',
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: data.message || 'Failed to upload file',
          severity: 'error',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Network error. Please try again.',
        severity: 'error',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      event.target.value = '';
    }
  };

  const handleDownload = async (fileName) => {
    try {
      const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
      
      const response = await fetch('/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          path: filePath,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setSnackbar({
          open: true,
          message: 'File downloaded successfully!',
          severity: 'success',
        });
      } else {
        const data = await response.json();
        setSnackbar({
          open: true,
          message: data.message || 'Failed to download file',
          severity: 'error',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Network error. Please try again.',
        severity: 'error',
      });
    }
    handleMenuClose();
  };

  const handleShare = async () => {
    if (!shareUsername.trim() || !selectedItem) return;

    try {
      const response = await fetch('/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          target: shareUsername,
          node: JSON.stringify(selectedItem),
        }),
      });

      const data = await response.json();

      if (response.ok && data.message === 'SUCCESS') {
        setSnackbar({
          open: true,
          message: 'Item shared successfully!',
          severity: 'success',
        });
        setShareDialogOpen(false);
        setShareUsername('');
      } else {
        setSnackbar({
          open: true,
          message: data.message || 'Failed to share item',
          severity: 'error',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Network error. Please try again.',
        severity: 'error',
      });
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      const itemPath = currentPath ? `${currentPath}/${selectedItem.name}` : selectedItem.name;
      
      const response = await fetch('/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          node_path: itemPath,
        }),
      });

      const data = await response.json();

      if (response.ok && data.message === 'SUCCESS') {
        setRootData(JSON.parse(data.root));
        setSnackbar({
          open: true,
          message: 'Item deleted successfully!',
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: data.error || 'Failed to delete item',
          severity: 'error',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Network error. Please try again.',
        severity: 'error',
      });
    }
    handleMenuClose();
  };

  const renderItems = () => {
    if (!currentNode || !currentNode.children) {
      return (
        <Grid item xs={12}>
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              color: 'text.secondary',
            }}
          >
            <Folder sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              This folder is empty
            </Typography>
            <Typography variant="body2">
              Upload files or create folders to get started
            </Typography>
          </Box>
        </Grid>
      );
    }

    return Object.entries(currentNode.children).map(([name, item]) => (
      <Grid item xs={12} sm={6} md={4} lg={3} key={name}>
        <Card
          sx={{
            height: '100%',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 4,
            },
          }}
        >
          <CardActionArea
            onClick={() => handleItemClick(name, item)}
            sx={{ height: '100%', p: 2, position: 'relative' }}
          >
            <IconButton
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1,
              }}
              onClick={(e) => handleMenuOpen(e, name, item)}
            >
              <MoreVert />
            </IconButton>
            
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                pt: 2,
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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Toolbar */}
      <Paper sx={{ mb: 3 }}>
        <Toolbar sx={{ gap: 2 }}>
          <IconButton onClick={() => navigate('/home')}>
            <ArrowBack />
          </IconButton>
          
          <Breadcrumbs
            separator={<NavigateNext fontSize="small" />}
            sx={{ flexGrow: 1 }}
          >
            <Link
              component="button"
              variant="body1"
              onClick={() => navigate('/home')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              <Home sx={{ mr: 0.5, fontSize: 20 }} />
              Home
            </Link>
            {getPathParts().map((part, index) => (
              <Link
                key={index}
                component="button"
                variant="body1"
                onClick={() => handleBreadcrumbClick(index)}
                sx={{
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {part}
              </Link>
            ))}
          </Breadcrumbs>

          <input
            accept="*/*"
            style={{ display: 'none' }}
            id="upload-file"
            type="file"
            onChange={handleUpload}
          />
          <label htmlFor="upload-file">
            <Button
              variant="contained"
              component="span"
              startIcon={<Upload />}
              disabled={uploading}
            >
              Upload
            </Button>
          </label>

          <Button
            variant="outlined"
            startIcon={<CreateNewFolder />}
            onClick={() => setCreateFolderOpen(true)}
          >
            New Folder
          </Button>
        </Toolbar>
        
        {uploading && (
          <LinearProgress
            variant="determinate"
            value={uploadProgress}
            sx={{ height: 2 }}
          />
        )}
      </Paper>

      {/* File Grid */}
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          {renderItems()}
        </Grid>
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {selectedItem && !selectedItem.is_folder && (
          <MenuItem onClick={() => handleDownload(selectedItem.name)}>
            <Download sx={{ mr: 2 }} />
            Download
          </MenuItem>
        )}
        <MenuItem onClick={() => setShareDialogOpen(true)}>
          <Share sx={{ mr: 2 }} />
          Share
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onClose={() => setCreateFolderOpen(false)}>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFolderOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
        <DialogTitle>Share Item</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            fullWidth
            variant="outlined"
            value={shareUsername}
            onChange={(e) => setShareUsername(e.target.value)}
            helperText="Enter the username of the person you want to share with"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleShare} variant="contained">
            Share
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FileExplorer; 