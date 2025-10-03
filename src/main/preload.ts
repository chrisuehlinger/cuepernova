import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Directory operations
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  initializeProject: (directory: string) => ipcRenderer.invoke('initialize-project', directory),
  getLastProjectDirectory: () => ipcRenderer.invoke('get-last-project-directory'),
  
  // File operations
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
  
  // Cues operations
  getCues: () => ipcRenderer.invoke('get-cues'),
  saveCues: (cues: any[]) => ipcRenderer.invoke('save-cues', cues),
  
  // Cuestations operations
  getCuestations: () => ipcRenderer.invoke('get-cuestations'),
  saveCuestations: (cuestations: any[]) => ipcRenderer.invoke('save-cuestations', cuestations),
  openCuestation: (name: string) => ipcRenderer.invoke('open-cuestation', name),
  
  // Config operations
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config: any) => ipcRenderer.invoke('save-config', config),
  
  // Server operations
  startServer: () => ipcRenderer.invoke('start-server'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  
  // CA Certificate operations
  downloadCACert: () => ipcRenderer.invoke('download-ca-cert'),
  
  // Cueball operations
  createCueball: (name: string) => ipcRenderer.invoke('create-cueball', name),

  // OSC operations
  sendOSCCommand: (address: string, args: any[]) => ipcRenderer.invoke('send-osc-command', address, args),

  // Event listeners
  onDirectorySelected: (callback: (dir: string) => void) => {
    ipcRenderer.on('directory-selected', (_event, dir) => callback(dir));
  },
  onServerStatusChanged: (callback: (status: boolean) => void) => {
    ipcRenderer.on('server-status-changed', (_event, status) => callback(status));
  },
});

// TypeScript definitions for the renderer process
declare global {
  interface Window {
    electronAPI: {
      selectDirectory: () => Promise<string | null>;
      initializeProject: (directory: string) => Promise<void>;
      getLastProjectDirectory: () => Promise<string | undefined>;
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<void>;
      getCues: () => Promise<any[]>;
      saveCues: (cues: any[]) => Promise<void>;
      getCuestations: () => Promise<any[]>;
      saveCuestations: (cuestations: any[]) => Promise<void>;
      openCuestation: (name: string) => Promise<void>;
      getConfig: () => Promise<any>;
      saveConfig: (config: any) => Promise<void>;
      startServer: () => Promise<void>;
      stopServer: () => Promise<void>;
      getServerStatus: () => Promise<boolean>;
      downloadCACert: () => Promise<string>;
      createCueball: (name: string) => Promise<{ success: boolean; error?: string; files?: any; kebabName?: string }>;
      sendOSCCommand: (address: string, args: any[]) => Promise<void>;
      onDirectorySelected: (callback: (dir: string) => void) => void;
      onServerStatusChanged: (callback: (status: boolean) => void) => void;
    };
  }
}