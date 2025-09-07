import React, { useState, useCallback, useEffect } from 'react';
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
import { Cuestation, MaptasticMapping } from '../../src/shared/types';
import MappingModal from './MappingModal';

interface CuestationManagerProps {
  cuestations: Cuestation[];
  onChange: (cuestations: Cuestation[]) => void;
  serverRunning: boolean;
}

const CuestationManagerComponent: React.FC<CuestationManagerProps> = ({
  cuestations,
  onChange,
  serverRunning,
}) => {
  const [editDialog, setEditDialog] = useState(false);
  const [editingCuestation, setEditingCuestation] = useState<Cuestation | null>(null);
  const [formData, setFormData] = useState<Partial<Cuestation>>({});
  const [mappingModal, setMappingModal] = useState(false);
  const [mappingCuestation, setMappingCuestation] = useState<Cuestation | null>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  const handleAdd = useCallback(() => {
    const newCuestation: Cuestation = {
      id: crypto.randomUUID(),
      name: `Cuestation ${cuestations.length + 1}`,
      description: '',
      showtimeResolution: {
        width: 1920,
        height: 1080
      }
    };
    setEditingCuestation(null);
    setFormData(newCuestation);
    setEditDialog(true);
  }, [cuestations.length]);

  const handleEdit = useCallback((cuestation: Cuestation) => {
    setEditingCuestation(cuestation);
    setFormData({ ...cuestation });
    setEditDialog(true);
  }, []);

  const handleDelete = useCallback((cuestationId: string) => {
    onChange(cuestations.filter(c => c.id !== cuestationId));
  }, [cuestations, onChange]);

  const handleSave = useCallback(() => {
    if (editingCuestation) {
      // Update existing cuestation
      onChange(cuestations.map(c => 
        c.id === editingCuestation.id ? { ...formData } as Cuestation : c
      ));
    } else {
      // Add new cuestation with default mapping
      const newCuestation = {
        ...formData,
        // Default Maptastic mapping (identity transform)
        mapping: {
          layers: [{
            targetPoints: [
              [0, 0], [1, 0], [1, 1], [0, 1]
            ],
            sourcePoints: [
              [0, 0], [1, 0], [1, 1], [0, 1]
            ]
          }]
        }
      } as Cuestation;
      onChange([...cuestations, newCuestation]);
    }
    setEditDialog(false);
    setFormData({});
  }, [editingCuestation, formData, cuestations, onChange]);

  const handleOpen = useCallback(async (cuestation: Cuestation) => {
    if (!serverRunning) {
      alert('Server must be running to open cuestations');
      return;
    }

    try {
      await window.electronAPI.openCuestation(cuestation.name);
    } catch (error) {
      console.error('Failed to open cuestation:', error);
    }
  }, [serverRunning]);

  // Setup WebSocket connection when server is running
  useEffect(() => {
    if (serverRunning && !wsConnection) {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${protocol}://${window.location.host}/control`);
      
      ws.onopen = () => {
        console.log('Control WebSocket connected');
        setWsConnection(ws);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('Control WebSocket disconnected');
        setWsConnection(null);
      };
      
      return () => {
        ws.close();
      };
    }
  }, [serverRunning, wsConnection]);

  const handleEditMapping = useCallback((cuestation: Cuestation) => {
    if (!serverRunning) {
      alert('Server must be running to edit mappings');
      return;
    }
    setMappingCuestation(cuestation);
    setMappingModal(true);
  }, [serverRunning]);

  const handleMappingChange = useCallback((mapping: MaptasticMapping) => {
    if (wsConnection && mappingCuestation) {
      // Send mapping update to specific cuestation
      const message = {
        address: `/cuepernova/cuestation/${mappingCuestation.name}/mapping-update`,
        args: [JSON.stringify(mapping)]
      };
      wsConnection.send(JSON.stringify(message));
    }
  }, [wsConnection, mappingCuestation]);

  const handleMappingSave = useCallback((mapping: MaptasticMapping) => {
    if (mappingCuestation) {
      // Update the cuestation with the new mapping
      const updatedCuestations = cuestations.map(c => 
        c.id === mappingCuestation.id 
          ? { ...c, mapping } 
          : c
      );
      onChange(updatedCuestations);
      setMappingModal(false);
      setMappingCuestation(null);
    }
  }, [mappingCuestation, cuestations, onChange]);

  const handleMappingClose = useCallback(() => {
    setMappingModal(false);
    setMappingCuestation(null);
  }, []);

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
                  onClick={() => handleOpen(cuestation)}
                  disabled={!serverRunning}
                  color="primary"
                  title="Open Cuestation Window"
                >
                  <OpenInNewIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleEditMapping(cuestation)}
                  disabled={!serverRunning}
                  color="secondary"
                  title="Edit Mapping"
                >
                  <MapIcon />
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
                  <Chip 
                    label={`${cuestation.showtimeResolution?.width || 1920}×${cuestation.showtimeResolution?.height || 1080}`} 
                    size="small" 
                    variant="outlined" 
                  />
                  {cuestation.mapping && (
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
            <Stack direction="row" spacing={2}>
              <TextField
                label="Width"
                type="number"
                value={formData.showtimeResolution?.width || 1920}
                onChange={(e) => setFormData({
                  ...formData,
                  showtimeResolution: {
                    ...formData.showtimeResolution,
                    width: parseInt(e.target.value) || 1920,
                    height: formData.showtimeResolution?.height || 1080
                  }
                })}
                fullWidth
                helperText="Showtime width in pixels"
              />
              <TextField
                label="Height"
                type="number"
                value={formData.showtimeResolution?.height || 1080}
                onChange={(e) => setFormData({
                  ...formData,
                  showtimeResolution: {
                    ...formData.showtimeResolution,
                    width: formData.showtimeResolution?.width || 1920,
                    height: parseInt(e.target.value) || 1080
                  }
                })}
                fullWidth
                helperText="Showtime height in pixels"
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Common resolutions: 1920×1080 (Full HD), 1280×720 (HD), 3840×2160 (4K)
            </Typography>
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

      <MappingModal
        open={mappingModal}
        cuestation={mappingCuestation}
        onClose={handleMappingClose}
        onSave={handleMappingSave}
        onMappingChange={handleMappingChange}
      />
    </Box>
  );
};

const CuestationManager = React.memo(CuestationManagerComponent);

export default CuestationManager;