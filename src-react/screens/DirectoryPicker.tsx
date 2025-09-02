import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Container,
  Stack,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';

interface DirectoryPickerProps {
  onDirectorySelect: (directory: string) => void;
}

const DirectoryPicker: React.FC<DirectoryPickerProps> = ({ onDirectorySelect }) => {
  const [selectedDir, setSelectedDir] = useState<string | null>(null);

  const handleSelectDirectory = async () => {
    const directory = await window.electronAPI.selectDirectory();
    if (directory) {
      setSelectedDir(directory);
      onDirectorySelect(directory);
    }
  };

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
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};

export default DirectoryPicker;