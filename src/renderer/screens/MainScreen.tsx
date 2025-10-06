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
  TextField,
  Stack,
} from '@mui/material';
import Grid from '@mui/system/Grid';
import SettingsIcon from '@mui/icons-material/Settings';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import CueList from '../components/CueList';
import CuestationManager from '../components/CuestationManager';
import ServerToggle from '../components/ServerToggle';
import SettingsModal from '../components/SettingsModal';
import { CueballCreateModal } from '../components/CueballCreateModal';
import { Cue, Cuestation, Config } from '@shared/types';

interface MainScreenProps {
  projectDir: string;
}

// Parse OSC command string into address and typed arguments
// Handles quoted strings, numbers, booleans, and special values
const parseOscCommand = (
  command: string,
): { address: string; args: (string | number | boolean)[] } => {
  const trimmed = command.trim();
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  // First, split by spaces while respecting quotes
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];

    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (
      char === quoteChar &&
      inQuotes &&
      (i === 0 || trimmed[i - 1] !== '\\')
    ) {
      inQuotes = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuotes) {
      if (current.length > 0) {
        parts.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    parts.push(current);
  }

  // First part is the address
  const address = parts[0] || '/';

  // Parse the remaining parts as arguments
  const args = parts.slice(1).map((arg) => {
    // Handle escaped characters in strings
    const unescaped = arg.replace(/\\(.)/g, '$1');

    // Try to parse as integer
    if (/^-?\d+$/.test(arg)) {
      return parseInt(arg, 10);
    }

    // Try to parse as float
    const num = parseFloat(arg);
    if (!isNaN(num) && isFinite(num)) {
      return num;
    }

    // Try to parse as boolean
    if (arg === 'true' || arg === 'True' || arg === 'TRUE') return true;
    if (arg === 'false' || arg === 'False' || arg === 'FALSE') return false;

    // Handle special OSC values
    if (arg === 'nil' || arg === 'null') return null as any;
    if (arg === 'Infinity' || arg === 'inf') return Infinity;

    // Otherwise keep as string
    return unescaped;
  });

  return { address, args };
};

const MainScreenComponent: React.FC<MainScreenProps> = ({ projectDir }) => {
  const [cues, setCues] = useState<Cue[]>([]);
  const [cuestations, setCuestations] = useState<Cuestation[]>([]);
  const [serverRunning, setServerRunning] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cueballModalOpen, setCueballModalOpen] = useState(false);
  const [config, setConfig] = useState<Config>({} as Config);
  const [oscCommand, setOscCommand] = useState('');

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

  const handleCuestationsChange = useCallback(
    async (newCuestations: Cuestation[]) => {
      setCuestations(newCuestations);
      await window.electronAPI.saveCuestations(newCuestations);
    },
    [],
  );

  const handleServerToggle = useCallback(async () => {
    if (serverRunning) {
      await window.electronAPI.stopServer();
    } else {
      await window.electronAPI.startServer();
    }
  }, [serverRunning]);

  const handleSettingsSave = useCallback(
    async (newConfig: Config) => {
      setConfig(newConfig);
      await window.electronAPI.saveConfig(newConfig);
      setSettingsOpen(false);

      // Restart server if running to apply new config
      if (serverRunning) {
        await window.electronAPI.stopServer();
        await window.electronAPI.startServer();
      }
    },
    [serverRunning],
  );

  const handleSendOSC = useCallback(async () => {
    if (!oscCommand.trim()) return;

    const { address, args } = parseOscCommand(oscCommand);

    try {
      await window.electronAPI.sendOSCCommand(address, args);
    } catch (error) {
      console.error('Failed to send OSC command:', error);
    }
  }, [oscCommand]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppBar
        position="static"
        sx={{ background: 'linear-gradient(90deg, #1e1e1e 0%, #2d2d2d 100%)' }}
      >
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
              },
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
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="/cuepernova/cuestation/showScreen/clear"
                  value={oscCommand}
                  onChange={(e) => setOscCommand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendOSC();
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSendOSC}
                  disabled={!serverRunning || !oscCommand.trim()}
                  endIcon={<SendIcon />}
                  sx={{ minWidth: '100px' }}
                >
                  Send
                </Button>
              </Stack>
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
