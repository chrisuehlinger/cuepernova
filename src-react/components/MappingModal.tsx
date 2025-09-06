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

declare global {
  interface Window {
    Maptastic: any;
  }
}

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
  const [maptasticLoaded, setMaptasticLoaded] = useState(false);
  const [originalMapping, setOriginalMapping] = useState<MaptasticMapping | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  // Load Maptastic script
  useEffect(() => {
    if (open && !window.Maptastic) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/gh/glowbox/maptasticjs@master/build/maptastic.min.js';
      script.onload = () => {
        setMaptasticLoaded(true);
      };
      document.head.appendChild(script);
    } else if (window.Maptastic) {
      setMaptasticLoaded(true);
    }
  }, [open]);

  // Initialize Maptastic when modal opens
  useEffect(() => {
    if (open && maptasticLoaded && containerRef.current && cuestation) {
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
        if (window.Maptastic && !maptasticRef.current) {
          maptasticRef.current = window.Maptastic('mapping-preview');
          
          // Apply existing mapping if available
          if (cuestation.mapping?.layers?.[0]) {
            maptasticRef.current.setConfigData({
              layers: [cuestation.mapping.layers[0]]
            });
          }

          // Track mapping changes
          setIsTracking(true);
        }
      }, 100);
    }

    return () => {
      // Cleanup
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      maptasticRef.current = null;
      setIsTracking(false);
    };
  }, [open, maptasticLoaded, cuestation]);

  // Track mapping changes and send via WebSocket
  useEffect(() => {
    if (!isTracking || !maptasticRef.current) return;

    const trackChanges = setInterval(() => {
      if (maptasticRef.current) {
        const currentMapping = maptasticRef.current.getConfigData();
        if (currentMapping && currentMapping.layers) {
          // Only keep the first layer (single layer support)
          const singleLayerMapping: MaptasticMapping = {
            layers: [currentMapping.layers[0]]
          };
          onMappingChange(singleLayerMapping);
        }
      }
    }, 100); // Send updates frequently without throttling

    return () => clearInterval(trackChanges);
  }, [isTracking, onMappingChange]);

  const handleSave = useCallback(() => {
    if (maptasticRef.current) {
      const mapping = maptasticRef.current.getConfigData();
      if (mapping && mapping.layers) {
        // Only save the first layer
        const singleLayerMapping: MaptasticMapping = {
          layers: [mapping.layers[0]]
        };
        onSave(singleLayerMapping);
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
        >
          {!maptasticLoaded && (
            <Box sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              color: 'text.secondary'
            }}>
              <Typography>Loading Maptastic...</Typography>
            </Box>
          )}
        </Box>
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