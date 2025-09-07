import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import { Cuestation, MaptasticMapping } from '../../src/shared/types';
// @ts-ignore - maptastic doesn't have TypeScript definitions
import { Maptastic } from 'maptastic';

interface MappingModalProps {
  open: boolean;
  cuestation: Cuestation | null;
  onClose: () => void;
  onSave: (mapping: MaptasticMapping) => void;
  onMappingChange: (mapping: MaptasticMapping) => void;
}

const MappingModal: React.FC<MappingModalProps> = ({
  open,
  cuestation,
  onClose,
  onSave,
  onMappingChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const maptasticRef = useRef<any>(null);
  const [originalMapping, setOriginalMapping] = useState<MaptasticMapping | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  // Initialize Maptastic when modal opens
  useEffect(() => {
    if (open && containerRef.current && cuestation) {
      // Store original mapping
      setOriginalMapping(cuestation.mapping || {
        layers: [{
          targetPoints: [[0, 0], [1, 0], [1, 1], [0, 1]],
          sourcePoints: [[0, 0], [1, 0], [1, 1], [0, 1]]
        }]
      });

      // Create mapping container
      const mappingDiv = document.createElement('div');
      mappingDiv.id = 'mapping-preview';
      mappingDiv.style.width = '100%';
      mappingDiv.style.height = '100%';
      mappingDiv.style.position = 'relative';
      mappingDiv.style.background = 'repeating-linear-gradient(0deg, #333 0px, #333 20px, #444 20px, #444 40px), repeating-linear-gradient(90deg, #333 0px, #333 20px, #444 20px, #444 40px)';
      mappingDiv.style.backgroundSize = '40px 40px';
      containerRef.current.appendChild(mappingDiv);

      // Initialize Maptastic on the container
      setTimeout(() => {
        if (!maptasticRef.current) {
          try {
            maptasticRef.current = new Maptastic('mapping-preview');
            
            // Apply existing mapping if available
            if (cuestation.mapping?.layers?.[0]) {
              maptasticRef.current.setLayout([{
                id: 'mapping-preview',
                targetPoints: cuestation.mapping.layers[0].targetPoints,
                sourcePoints: cuestation.mapping.layers[0].sourcePoints
              }]);
            }

            // Enable config mode
            maptasticRef.current.setConfigEnabled(true);

            // Track mapping changes
            setIsTracking(true);
          } catch (error) {
            console.error('Failed to initialize Maptastic:', error);
          }
        }
      }, 100);
    }

    return () => {
      // Cleanup
      if (maptasticRef.current) {
        maptasticRef.current.setConfigEnabled(false);
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      maptasticRef.current = null;
      setIsTracking(false);
    };
  }, [open, cuestation]);

  // Track mapping changes and send via WebSocket
  useEffect(() => {
    if (!isTracking || !maptasticRef.current) return;

    const trackChanges = setInterval(() => {
      if (maptasticRef.current) {
        try {
          const layout = maptasticRef.current.getLayout();
          if (layout && layout.length > 0) {
            // Only keep the first layer (single layer support)
            const singleLayerMapping: MaptasticMapping = {
              layers: [{
                targetPoints: layout[0].targetPoints,
                sourcePoints: layout[0].sourcePoints
              }]
            };
            onMappingChange(singleLayerMapping);
          }
        } catch (error) {
          console.error('Error getting Maptastic layout:', error);
        }
      }
    }, 100); // Send updates frequently without throttling

    return () => clearInterval(trackChanges);
  }, [isTracking, onMappingChange]);

  const handleSave = useCallback(() => {
    if (maptasticRef.current) {
      try {
        const layout = maptasticRef.current.getLayout();
        if (layout && layout.length > 0) {
          // Only save the first layer
          const singleLayerMapping: MaptasticMapping = {
            layers: [{
              targetPoints: layout[0].targetPoints,
              sourcePoints: layout[0].sourcePoints
            }]
          };
          onSave(singleLayerMapping);
        }
      } catch (error) {
        console.error('Error saving mapping:', error);
      }
    }
    onClose();
  }, [onSave, onClose]);

  const handleCancel = useCallback(() => {
    // Restore original mapping
    if (originalMapping) {
      onMappingChange(originalMapping);
    }
    onClose();
  }, [originalMapping, onMappingChange, onClose]);

  if (!cuestation) return null;

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          width: '80vw',
          height: '80vh',
          maxWidth: 'none',
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          Edit Mapping - {cuestation.name}
        </Typography>
        <IconButton onClick={handleCancel}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, position: 'relative' }}>
        <Box
          ref={containerRef}
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            background: '#1a1a1a',
          }}
        />
        <Box sx={{ 
          position: 'absolute', 
          bottom: 16, 
          left: 16, 
          background: 'rgba(0,0,0,0.8)',
          p: 2,
          borderRadius: 1
        }}>
          <Typography variant="caption" color="text.secondary">
            Drag the corners to adjust the mapping. The grid shows the transformation area.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Mapping
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MappingModal;