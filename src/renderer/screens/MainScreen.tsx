import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Paper,
  Container,
  Button,
} from '@mui/material';
import Grid from '@mui/system/Grid';
import SettingsIcon from '@mui/icons-material/Settings';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import AddIcon from '@mui/icons-material/Add';
import CueList from '../components/CueList';
import CuestationManager from '../components/CuestationManager';
import ServerToggle from '../components/ServerToggle';
import SettingsModal from '../components/SettingsModal';
import { CueballCreateModal } from '../components/CueballCreateModal';
import { Cue, Cuestation, Config } from '@shared/types';

interface MainScreenProps {
  projectDir: string;
}

const MainScreenComponent: React.FC<MainScreenProps> = ({ projectDir }) => {
  const [cues, setCues] = useState<Cue[]>([]);
  const [cuestations, setCuestations] = useState<Cuestation[]>([]);
  const [serverRunning, setServerRunning] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cueballModalOpen, setCueballModalOpen] = useState(false);
  const [config, setConfig] = useState<Config>({} as Config);

  useEffect(() => {
    loadData();
    checkServerStatus();

    // Listen for server status changes
    window.electronAPI.onServerStatusChanged((status: boolean) => {
      setServerRunning(status);
    });
  }, []);

  const loadData = async () => {
    try {
      const [loadedCues, loadedCuestations, loadedConfig] = await Promise.all([
        window.electronAPI.getCues(),
        window.electronAPI.getCuestations(),
        window.electronAPI.getConfig(),
      ]);
      setCues(loadedCues);
      setCuestations(loadedCuestations);
      setConfig(loadedConfig);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const checkServerStatus = async () => {
    const status = await window.electronAPI.getServerStatus();
    setServerRunning(status);
  };

  const handleCuesChange = useCallback(async (newCues: Cue[]) => {
    setCues(newCues);
    await window.electronAPI.saveCues(newCues);
  }, []);

  const handleCuestationsChange = useCallback(async (newCuestations: Cuestation[]) => {
    setCuestations(newCuestations);
    await window.electronAPI.saveCuestations(newCuestations);
  }, []);

  const handleServerToggle = useCallback(async () => {
    if (serverRunning) {
      await window.electronAPI.stopServer();
    } else {
      await window.electronAPI.startServer();
    }
  }, [serverRunning]);

  const handleSettingsSave = useCallback(async (newConfig: Config) => {
    setConfig(newConfig);
    await window.electronAPI.saveConfig(newConfig);
    setSettingsOpen(false);
    
    // Restart server if running to apply new config
    if (serverRunning) {
      await window.electronAPI.stopServer();
      await window.electronAPI.startServer();
    }
  }, [serverRunning]);

  return (
    <Box sx={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" sx={{ background: 'linear-gradient(90deg, #1e1e1e 0%, #2d2d2d 100%)' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Cuepernova - {projectDir.split('/').pop()}
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setCueballModalOpen(true)}
            sx={{ 
              mr: 2,
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            CUEBALL
          </Button>
          
          <ServerToggle
            isRunning={serverRunning}
            onToggle={handleServerToggle}
          />
          
          <IconButton
            color="inherit"
            onClick={() => setSettingsOpen(true)}
            sx={{ ml: 2 }}
          >
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ py: 3, flexGrow: 1, overflow: 'auto' }}>
        <Grid container spacing={3} sx={{ height: '100%' }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: '#1e1e1e',
              }}
            >
              <Typography variant="h5" gutterBottom>
                Cue List
              </Typography>
              <CueList
                cues={cues}
                onChange={handleCuesChange}
                serverRunning={serverRunning}
                config={config}
                cuestations={cuestations}
              />
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: '#1e1e1e',
              }}
            >
              <Typography variant="h5" gutterBottom>
                Cuestations
              </Typography>
              <CuestationManager
                cuestations={cuestations}
                onChange={handleCuestationsChange}
                serverRunning={serverRunning}
                config={config}
              />
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <SettingsModal
        open={settingsOpen}
        config={config}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSettingsSave}
      />
      
      <CueballCreateModal
        open={cueballModalOpen}
        onClose={() => setCueballModalOpen(false)}
        onCueballCreated={() => {
          // Optionally refresh or show a success message
          console.log('Cueball created successfully');
        }}
      />
    </Box>
  );
};

const MainScreen = React.memo(MainScreenComponent);

export default MainScreen;