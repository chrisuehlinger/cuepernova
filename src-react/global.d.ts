interface ElectronAPI {
  selectDirectory: () => Promise<string | null>;
  initializeProject: (directory: string) => Promise<void>;
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
  onDirectorySelected: (callback: (dir: string) => void) => void;
  onServerStatusChanged: (callback: (status: boolean) => void) => void;
}

interface Window {
  electronAPI: ElectronAPI;
}