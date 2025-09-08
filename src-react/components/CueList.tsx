import React, { useState, useCallback, useMemo } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Cue } from '../../src/shared/types';

interface CueListProps {
  cues: Cue[];
  onChange: (cues: Cue[]) => void;
  serverRunning: boolean;
  config?: { httpPort?: number; httpsPort?: number; oscPort?: number };
}

const CueListComponent: React.FC<CueListProps> = ({ cues, onChange, serverRunning, config }) => {
  const [editDialog, setEditDialog] = useState(false);
  const [editingCue, setEditingCue] = useState<Cue | null>(null);
  const [formData, setFormData] = useState<Partial<Cue>>({});

  const handleAdd = useCallback(() => {
    const newCue: Cue = {
      id: crypto.randomUUID(),
      number: (cues.length + 1).toString(),
      name: 'New Cue',
      type: 'clear',
      args: [],
    };
    setEditingCue(null);
    setFormData(newCue);
    setEditDialog(true);
  }, [cues.length]);

  const handleEdit = useCallback((cue: Cue) => {
    setEditingCue(cue);
    setFormData({ ...cue });
    setEditDialog(true);
  }, []);

  const handleDelete = useCallback((cueId: string) => {
    onChange(cues.filter(c => c.id !== cueId));
  }, [cues, onChange]);

  const handleSave = useCallback(() => {
    if (editingCue) {
      // Update existing cue
      onChange(cues.map(c => c.id === editingCue.id ? { ...formData } as Cue : c));
    } else {
      // Add new cue
      onChange([...cues, formData as Cue]);
    }
    setEditDialog(false);
    setFormData({});
  }, [editingCue, formData, cues, onChange]);

  const handleExecute = useCallback(async (cue: Cue) => {
    if (!serverRunning) {
      alert('Server must be running to execute cues');
      return;
    }

    // Send OSC message via WebSocket to server
    const message = {
      address: `/cuepernova/cuestation/showScreen/${cue.type}`,
      args: cue.args,
    };

    try {
      // Determine WebSocket URL based on context (Electron vs web)
      let wsUrl: string;
      
      if (window.electronAPI) {
        // Running in Electron - use localhost with configured ports
        // In Electron, we always use ws:// since it's connecting to localhost
        const port = config?.httpPort || 8080;
        wsUrl = `ws://localhost:${port}/control`;
      } else {
        // Running in web browser - detect protocol from current page
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        wsUrl = `${protocol}://${window.location.host}/control`;
      }
      
      // Create temporary WebSocket connection to send the cue
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        ws.send(JSON.stringify(message));
        console.log('Executed cue:', message);
        // Close after sending
        setTimeout(() => ws.close(), 100);
      };
      
      ws.onerror = (error) => {
        console.error('Failed to execute cue:', error);
        alert('Failed to connect to server. Make sure the server is running.');
      };
    } catch (error) {
      console.error('Failed to execute cue:', error);
    }
  }, [serverRunning, config]);

  const cueTypes = useMemo(() => [
    'clear', 'message', 'video', 'image', 'cueball', 'osc'
  ], []);

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Cue
        </Button>
      </Box>

      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {cues.map((cue) => (
          <ListItem
            key={cue.id}
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
                  onClick={() => handleExecute(cue)}
                  disabled={!serverRunning}
                  color="primary"
                >
                  <PlayArrowIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => handleEdit(cue)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => handleDelete(cue.id)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
            }
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: 40 }}>
                    #{cue.number}
                  </Typography>
                  <Typography variant="body1">{cue.name}</Typography>
                  <Chip label={cue.type} size="small" color="primary" />
                </Box>
              }
              secondary={cue.notes}
            />
          </ListItem>
        ))}
      </List>

      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCue ? 'Edit Cue' : 'Add Cue'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Cue Number"
              value={formData.number || ''}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              fullWidth
            />
            <TextField
              label="Cue Name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type || 'clear'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Cue['type'] })}
                label="Type"
              >
                {cueTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Arguments (comma separated)"
              value={formData.args?.join(', ') || ''}
              onChange={(e) => setFormData({
                ...formData,
                args: e.target.value.split(',').map(s => s.trim()).filter(s => s)
              })}
              fullWidth
              helperText="For video: path, loop | For message: text, subtitle"
            />
            <TextField
              label="Notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const CueList = React.memo(CueListComponent);

export default CueList;