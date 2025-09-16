import React, { useState, useCallback } from 'react';
import {
  Box,
  IconButton,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';

interface ServerToggleProps {
  isRunning: boolean;
  onToggle: () => Promise<void>;
}

const ServerToggleComponent: React.FC<ServerToggleProps> = ({ isRunning, onToggle }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      await onToggle();
    } catch (error) {
      console.error('Failed to toggle server:', error);
    } finally {
      setLoading(false);
    }
  }, [onToggle]);

  return (
    <Tooltip title={isRunning ? 'Stop Server' : 'Start Server'}>
      <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={handleClick}
          disabled={loading}
          sx={{
            color: isRunning ? '#4caf50' : '#f44336',
            animation: isRunning ? 'glow 2s ease-in-out infinite' : 'none',
            '@keyframes glow': {
              '0%': {
                boxShadow: '0 0 5px rgba(76, 175, 80, 0.5)',
              },
              '50%': {
                boxShadow: '0 0 20px rgba(76, 175, 80, 0.8), 0 0 30px rgba(76, 175, 80, 0.6)',
              },
              '100%': {
                boxShadow: '0 0 5px rgba(76, 175, 80, 0.5)',
              },
            },
          }}
        >
          <PowerSettingsNewIcon fontSize="large" />
        </IconButton>
        {loading && (
          <CircularProgress
            size={48}
            sx={{
              position: 'absolute',
              top: -4,
              left: -4,
              zIndex: 1,
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
};

const ServerToggle = React.memo(ServerToggleComponent);

export default ServerToggle;