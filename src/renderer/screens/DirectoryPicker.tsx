import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Container,
  Stack,
  TextField,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import ConnectedTvIcon from '@mui/icons-material/ConnectedTv';

interface DirectoryPickerProps {
  onDirectorySelect: (directory: string) => void;
}

const DirectoryPicker: React.FC<DirectoryPickerProps> = ({ onDirectorySelect }) => {
  const [selectedDir, setSelectedDir] = useState<string | null>(null);
  const [hostIP, setHostIP] = useState<string>('');
  const [cuestationName, setCuestationName] = useState<string>('');
  const [useHttps, setUseHttps] = useState<boolean>(true);
  const [httpPort, setHttpPort] = useState<number>(8080);
  const [httpsPort, setHttpsPort] = useState<number>(8443);

  const handleSelectDirectory = async () => {
    const directory = await window.electronAPI.selectDirectory();
    if (directory) {
      setSelectedDir(directory);
      onDirectorySelect(directory);
    }
  };

  const handleLaunchCuestation = () => {
    if (hostIP && cuestationName) {
      const protocol = useHttps ? 'https' : 'http';
      const port = useHttps ? httpsPort : httpPort;
      const url = `${protocol}://${hostIP}:${port}/cuestation.html?name=${encodeURIComponent(cuestationName)}`;
      window.location.href = url;
    }
  };

  // Check for last project directory on component mount
  useEffect(() => {
    const checkLastDirectory = async () => {
      const lastDir = await window.electronAPI.getLastProjectDirectory();
      if (lastDir) {
        setSelectedDir(lastDir);
        onDirectorySelect(lastDir);
      }
    };
    checkLastDirectory();

    // Load config to get default ports
    const loadConfig = async () => {
      try {
        const config = await window.electronAPI.getConfig();
        if (config) {
          setHttpPort(config.httpPort || 8080);
          setHttpsPort(config.httpsPort || 8443);
        }
      } catch (error) {
        // If config fails, keep default values
        console.log('Using default ports');
      }
    };
    loadConfig();
  }, [onDirectorySelect]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 6,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
          }}
        >
          <Typography variant="h3" gutterBottom sx={{ mb: 4 }}>
            Cuepernova
          </Typography>
          
          <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
            Open source theater projection control system
          </Typography>

          <Stack spacing={3} alignItems="center">
            <Typography variant="body1" color="text.secondary">
              Select a directory to open or create a new project
            </Typography>

            <Button
              variant="contained"
              size="large"
              startIcon={<FolderOpenIcon />}
              onClick={handleSelectDirectory}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
              }}
            >
              Open Project Directory
            </Button>

            {selectedDir && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Selected: {selectedDir}
              </Typography>
            )}

            <Divider sx={{ width: '100%', my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            <Typography variant="body1" color="text.secondary">
              Connect to a remote Cuepernova server
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Server IP"
                variant="outlined"
                size="small"
                value={hostIP}
                onChange={(e) => setHostIP(e.target.value)}
                placeholder="192.168.1.100"
                sx={{ width: 180 }}
              />
              <TextField
                label="Cuestation Name"
                variant="outlined"
                size="small"
                value={cuestationName}
                onChange={(e) => setCuestationName(e.target.value)}
                placeholder="projector-1"
                sx={{ width: 180 }}
              />
            </Stack>

            <FormControlLabel
              control={
                <Checkbox
                  checked={useHttps}
                  onChange={(e) => setUseHttps(e.target.checked)}
                  color="primary"
                />
              }
              label={`Use HTTPS (port ${useHttps ? httpsPort : httpPort})`}
            />

            <Button
              variant="contained"
              size="large"
              startIcon={<ConnectedTvIcon />}
              onClick={handleLaunchCuestation}
              disabled={!hostIP || !cuestationName}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
              }}
            >
              Launch Cuestation
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};

export default DirectoryPicker;