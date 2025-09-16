import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert
} from '@mui/material';

interface CueballCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCueballCreated?: () => void;
}

export const CueballCreateModal: React.FC<CueballCreateModalProps> = ({
  open,
  onClose,
  onCueballCreated
}) => {
  const [cueballName, setCueballName] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!cueballName.trim()) {
      setError('Please enter a cueball name');
      return;
    }

    // Validate name (alphanumeric, spaces, hyphens, underscores)
    const validName = /^[a-zA-Z0-9\s\-_]+$/.test(cueballName);
    if (!validName) {
      setError('Name can only contain letters, numbers, spaces, hyphens, and underscores');
      return;
    }

    setError('');
    setCreating(true);

    try {
      const result = await window.electronAPI.createCueball(cueballName.trim());
      
      if (result.success) {
        onCueballCreated?.();
        handleClose();
      } else {
        setError(result.error || 'Failed to create cueball');
      }
    } catch (err) {
      setError('An error occurred while creating the cueball');
      console.error('Cueball creation error:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setCueballName('');
    setError('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !creating) {
      handleCreate();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Create New Cueball</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            A cueball is a custom screen type that can display HTML content with JavaScript and CSS.
            The cueball will be created in the public/cueballs directory of your project.
          </Typography>
          
          <TextField
            autoFocus
            fullWidth
            label="Cueball Name"
            value={cueballName}
            onChange={(e) => setCueballName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., Video Player, Title Card, Animation"
            disabled={creating}
            helperText="This name will be used for the file and as the cueball identifier"
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={creating}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreate} 
          variant="contained"
          disabled={creating || !cueballName.trim()}
        >
          {creating ? 'Creating...' : 'Create Cueball'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};