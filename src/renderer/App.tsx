import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import DirectoryPicker from './screens/DirectoryPicker';
import MainScreen from './screens/MainScreen';

function App() {
  const [projectDir, setProjectDir] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Listen for directory selection from menu
    window.electronAPI.onDirectorySelected((dir: string) => {
      handleDirectorySelect(dir);
    });
  }, []);

  const handleDirectorySelect = async (directory: string) => {
    try {
      await window.electronAPI.initializeProject(directory);
      setProjectDir(directory);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize project:', error);
    }
  };

  if (!isInitialized) {
    return <DirectoryPicker onDirectorySelect={handleDirectorySelect} />;
  }

  return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MainScreen projectDir={projectDir!} />
    </Box>
  );
}

export default App;