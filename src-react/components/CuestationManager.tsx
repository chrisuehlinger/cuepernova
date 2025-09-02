import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Typography,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MapIcon from '@mui/icons-material/Map';
import { Cuestation } from '../types';

interface CuestationManagerProps {
  cuestations: Cuestation[];
  onChange: (cuestations: Cuestation[]) => void;
  serverRunning: boolean;
}

const CuestationManager: React.FC<CuestationManagerProps> = ({
  cuestations,
  onChange,
  serverRunning,
}) => {
  const [editDialog, setEditDialog] = useState(false);
  const [editingCuestation, setEditingCuestation] = useState<Cuestation | null>(null);
  const [formData, setFormData] = useState<Partial<Cuestation>>({});

  const handleAdd = () => {
    const newCuestation: Cuestation = {
      id: Date.now().toString(),
      name: `Cuestation ${cuestations.length + 1}`,
      description: '',
    };
    setEditingCuestation(null);
    setFormData(newCuestation);
    setEditDialog(true);
  };

  const handleEdit = (cuestation: Cuestation) => {
    setEditingCuestation(cuestation);
    setFormData({ ...cuestation });
    setEditDialog(true);
  };

  const handleDelete = (cuestationId: string) => {
    onChange(cuestations.filter(c => c.id !== cuestationId));
  };

  const handleSave = () => {
    if (editingCuestation) {
      // Update existing cuestation
      onChange(cuestations.map(c => 
        c.id === editingCuestation.id ? { ...formData } as Cuestation : c
      ));
    } else {
      // Add new cuestation
      onChange([...cuestations, formData as Cuestation]);
    }
    setEditDialog(false);
    setFormData({});
  };

  const handleOpen = async (cuestation: Cuestation) => {
    if (!serverRunning) {
      alert('Server must be running to open cuestations');
      return;
    }

    try {
      await window.electronAPI.openCuestation(cuestation.name);
    } catch (error) {
      console.error('Failed to open cuestation:', error);
    }
  };

  const handleOpenMapping = async (cuestation: Cuestation) => {
    if (!serverRunning) {
      alert('Server must be running to access mapping interface');
      return;
    }

    // Open mapping interface in new window
    const mappingUrl = `https://localhost:8443/mapping.html?name=${encodeURIComponent(cuestation.name)}`;
    window.open(mappingUrl, '_blank');
  };

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Cuestation
        </Button>
      </Box>

      {cuestations.length === 0 && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No cuestations configured. Add one to get started.
          </Typography>
        </Box>
      )}

      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {cuestations.map((cuestation) => (
          <ListItem
            key={cuestation.id}
            sx={{
              mb: 1,
              background: '#2d2d2d',
              borderRadius: 1,
              '&:hover': { background: '#3d3d3d' },
            }}
            secondaryAction={
              <Stack direction="row" spacing={1}>
                <IconButton
                  edge="end"
                  onClick={() => handleOpenMapping(cuestation)}
                  disabled={!serverRunning}
                  color="primary"
                  title="Open Mapping Interface"
                >
                  <MapIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleOpen(cuestation)}
                  disabled={!serverRunning}
                  color="primary"
                  title="Open Cuestation Window"
                >
                  <OpenInNewIcon />
                </IconButton>
                <IconButton 
                  edge="end" 
                  onClick={() => handleEdit(cuestation)}
                  title="Edit"
                >
                  <EditIcon />
                </IconButton>
                <IconButton 
                  edge="end" 
                  onClick={() => handleDelete(cuestation.id)}
                  title="Delete"
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            }
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">{cuestation.name}</Typography>
                  {cuestation.mappings && (
                    <Chip label="Mapped" size="small" color="success" />
                  )}
                </Box>
              }
              secondary={cuestation.description}
            />
          </ListItem>
        ))}
      </List>

      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCuestation ? 'Edit Cuestation' : 'Add Cuestation'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              helperText="Unique name for this cuestation (no spaces)"
              error={!formData.name || formData.name.includes(' ')}
            />
            <TextField
              label="Description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              helperText="Optional description for this cuestation"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!formData.name || formData.name.includes(' ')}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CuestationManager;