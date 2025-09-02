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
import { Cue } from '../types';

interface CueListProps {
  cues: Cue[];
  onChange: (cues: Cue[]) => void;
  serverRunning: boolean;
}

const CueList: React.FC<CueListProps> = ({ cues, onChange, serverRunning }) => {
  const [editDialog, setEditDialog] = useState(false);
  const [editingCue, setEditingCue] = useState<Cue | null>(null);
  const [formData, setFormData] = useState<Partial<Cue>>({});

  const handleAdd = () => {
    const newCue: Cue = {
      id: Date.now().toString(),
      number: (cues.length + 1).toString(),
      name: 'New Cue',
      type: 'black',
      args: [],
    };
    setEditingCue(null);
    setFormData(newCue);
    setEditDialog(true);
  };

  const handleEdit = (cue: Cue) => {
    setEditingCue(cue);
    setFormData({ ...cue });
    setEditDialog(true);
  };

  const handleDelete = (cueId: string) => {
    onChange(cues.filter(c => c.id !== cueId));
  };

  const handleSave = () => {
    if (editingCue) {
      // Update existing cue
      onChange(cues.map(c => c.id === editingCue.id ? { ...formData } as Cue : c));
    } else {
      // Add new cue
      onChange([...cues, formData as Cue]);
    }
    setEditDialog(false);
    setFormData({});
  };

  const handleExecute = async (cue: Cue) => {
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
      // This would normally send via WebSocket to the server
      console.log('Executing cue:', message);
      // TODO: Implement WebSocket connection to send cue
    } catch (error) {
      console.error('Failed to execute cue:', error);
    }
  };

  const cueTypes = [
    'black', 'white', 'freeze', 'clear',
    'message', 'video', 'image', 'cueball', 'osc'
  ];

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
                value={formData.type || 'black'}
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

export default CueList;