import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Cuestation } from '../../src/shared/types';

interface MappingModalProps {
  open: boolean;
  cuestation: Cuestation | null;
  onClose: () => void;
  onSave: () => void;
}

const MappingModal: React.FC<MappingModalProps> = ({
  open,
  cuestation,
  onClose,
  onSave,
}) => {
  if (!cuestation) return null;

  const handleSave = () => {
    // The mapping is already saved to the server by the iframe
    // Just close the modal and trigger any parent refresh
    onSave();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      slotProps={{
        paper: {
          sx: {
            width: '80vw',
            height: '80vh',
            maxWidth: 'none',
          }
        }
      }}
    >
      <DialogTitle variant="h2" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography>
          Edit Mapping - {cuestation.name}
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, position: 'relative' }}>
        <Box
          component="iframe"
          src={`https://localhost:8443/mapping-editor.html?name=${encodeURIComponent(cuestation.name)}`}
          sx={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title="Mapping Editor"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MappingModal;