import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Divider,
  Alert,
} from '@mui/material';
import { Config } from '../types';

interface SettingsModalProps {
  open: boolean;
  config: Config;
  onClose: () => void;
  onSave: (config: Config) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, config, onClose, onSave }) => {
  const [formData, setFormData] = useState<Config>(config);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(config);
  }, [config]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.oscPort || formData.oscPort < 1 || formData.oscPort > 65535) {
      newErrors.oscPort = 'OSC port must be between 1 and 65535';
    }

    if (!formData.httpPort || formData.httpPort < 1 || formData.httpPort > 65535) {
      newErrors.httpPort = 'HTTP port must be between 1 and 65535';
    }

    if (!formData.httpsPort || formData.httpsPort < 1 || formData.httpsPort > 65535) {
      newErrors.httpsPort = 'HTTPS port must be between 1 and 65535';
    }

    if (formData.httpPort === formData.httpsPort) {
      newErrors.httpsPort = 'HTTP and HTTPS ports must be different';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleDownloadCA = async () => {
    try {
      const cert = await window.electronAPI.downloadCACert();
      const blob = new Blob([cert], { type: 'application/x-pem-file' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cuepernova-ca.pem';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download CA certificate:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Typography variant="h6">Server Configuration</Typography>
          
          <TextField
            label="OSC Port"
            type="number"
            value={formData.oscPort || 57121}
            onChange={(e) => setFormData({ ...formData, oscPort: parseInt(e.target.value) })}
            error={!!errors.oscPort}
            helperText={errors.oscPort || 'Port for receiving OSC messages from QLab'}
            fullWidth
          />

          <TextField
            label="HTTP Port"
            type="number"
            value={formData.httpPort || 8080}
            onChange={(e) => setFormData({ ...formData, httpPort: parseInt(e.target.value) })}
            error={!!errors.httpPort}
            helperText={errors.httpPort || 'Port for HTTP server'}
            fullWidth
          />

          <TextField
            label="HTTPS Port"
            type="number"
            value={formData.httpsPort || 8443}
            onChange={(e) => setFormData({ ...formData, httpsPort: parseInt(e.target.value) })}
            error={!!errors.httpsPort}
            helperText={errors.httpsPort || 'Port for HTTPS server (required for WebRTC)'}
            fullWidth
          />

          <TextField
            label="Default Cuestation Name"
            value={formData.defaultCuestation || 'main'}
            onChange={(e) => setFormData({ ...formData, defaultCuestation: e.target.value })}
            helperText="Default name for new cuestations"
            fullWidth
          />

          <Divider />

          <Typography variant="h6">SSL Certificate</Typography>
          
          <Alert severity="info">
            To use Cuepernova on other devices, they need to trust the CA certificate.
            Download and install it on each device.
          </Alert>

          <Button
            variant="outlined"
            onClick={handleDownloadCA}
            fullWidth
          >
            Download CA Certificate
          </Button>

          <Typography variant="caption" color="text.secondary">
            After downloading, install the certificate on your devices:
            <br />• macOS: Double-click and add to Keychain
            <br />• Windows: Double-click and install to Trusted Root
            <br />• iOS/Android: Email the certificate and open to install
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsModal;