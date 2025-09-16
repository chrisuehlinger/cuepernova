/**
 * Refactored IPC handlers using DataStore
 */

import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { ServerManager } from '../server/index';
import { CertificateManager } from '../server/certificate-manager';
import { DataStore } from '@shared/data/DataStore';
import { Cue, Cuestation, Config } from '@shared/types/index';
import { getLastProjectDirectory, setLastProjectDirectory } from '../store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface IpcContext {
  serverManager: ServerManager;
  certificateManager: CertificateManager;
  getProjectDir: () => string | null;
  setProjectDir: (dir: string) => void;
  createCuestationWindow: (name: string) => Promise<void>;
}

let dataStore: DataStore | null = null;

export function setupIpcHandlers(context: IpcContext) {
  // Directory selection
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    
    if (result.canceled) {
      return null;
    }
    
    return result.filePaths[0];
  });

  // Get last project directory
  ipcMain.handle('get-last-project-directory', async () => {
    return getLastProjectDirectory();
  });

  // Project initialization
  ipcMain.handle('initialize-project', async (event, directory: string) => {
    context.setProjectDir(directory);
    
    // Save last project directory
    setLastProjectDirectory(directory);
    
    // Create necessary directories
    const dirs = [
      'public',
      'public/cueballs',
      'public/media',
      'public/css',
      'public/js',
      '.cuepernova'
    ];
    for (const dir of dirs) {
      await fs.mkdir(path.join(directory, dir), { recursive: true });
    }

    // Create gitignore for .cuepernova
    const gitignorePath = path.join(directory, '.gitignore');
    try {
      const existing = await fs.readFile(gitignorePath, 'utf-8');
      if (!existing.includes('.cuepernova')) {
        await fs.appendFile(gitignorePath, '\n.cuepernova/\n');
      }
    } catch {
      await fs.writeFile(gitignorePath, '.cuepernova/\nnode_modules/\n');
    }

    // Initialize DataStore
    dataStore = new DataStore({
      projectDir: directory,
      cacheEnabled: true,
      cacheTTL: 5000,
      autoSave: true
    });

    // Validate or create database
    const validation = await dataStore.validateDatabaseFile();
    if (!validation.success) {
      // Create default database if validation fails
      await dataStore.batchUpdate({
        cues: [],
        cuestations: [],
        config: {
          oscPort: 57121,
          httpPort: 8080,
          httpsPort: 8443,
          defaultCuestation: 'main'
        }
      });
    }

    // Initialize CA certificate
    await context.certificateManager.initializeCA(directory);
  });

  // File operations (for non-database files)
  ipcMain.handle('read-file', async (event, filePath: string) => {
    const projectDir = context.getProjectDir();
    if (!projectDir) throw new Error('No project directory set');
    
    const fullPath = path.join(projectDir, filePath);
    return await fs.readFile(fullPath, 'utf-8');
  });

  ipcMain.handle('write-file', async (event, filePath: string, content: string) => {
    const projectDir = context.getProjectDir();
    if (!projectDir) throw new Error('No project directory set');
    
    const fullPath = path.join(projectDir, filePath);
    await fs.writeFile(fullPath, content);
  });

  // Cue operations using DataStore
  ipcMain.handle('get-cues', async () => {
    if (!dataStore) throw new Error('DataStore not initialized');
    return await dataStore.getCues();
  });

  ipcMain.handle('save-cues', async (event, cues: Cue[]) => {
    if (!dataStore) throw new Error('DataStore not initialized');
    await dataStore.saveCues(cues);
  });

  ipcMain.handle('add-cue', async (event, cue: Omit<Cue, 'id'>) => {
    if (!dataStore) throw new Error('DataStore not initialized');
    return await dataStore.addCue(cue);
  });

  ipcMain.handle('update-cue', async (event, id: string, updates: Partial<Cue>) => {
    if (!dataStore) throw new Error('DataStore not initialized');
    return await dataStore.updateCue(id, updates);
  });

  ipcMain.handle('delete-cue', async (event, id: string) => {
    if (!dataStore) throw new Error('DataStore not initialized');
    return await dataStore.deleteCue(id);
  });

  // Cuestation operations using DataStore
  ipcMain.handle('get-cuestations', async () => {
    if (!dataStore) throw new Error('DataStore not initialized');
    return await dataStore.getCuestations();
  });

  ipcMain.handle('save-cuestations', async (event, cuestations: Cuestation[]) => {
    if (!dataStore) throw new Error('DataStore not initialized');
    await dataStore.saveCuestations(cuestations);
  });

  ipcMain.handle('add-cuestation', async (event, cuestation: Omit<Cuestation, 'id'>) => {
    if (!dataStore) throw new Error('DataStore not initialized');
    return await dataStore.addCuestation(cuestation);
  });

  ipcMain.handle('update-cuestation', async (event, id: string, updates: Partial<Cuestation>) => {
    if (!dataStore) throw new Error('DataStore not initialized');
    return await dataStore.updateCuestation(id, updates);
  });

  ipcMain.handle('delete-cuestation', async (event, id: string) => {
    if (!dataStore) throw new Error('DataStore not initialized');
    return await dataStore.deleteCuestation(id);
  });

  // Config operations using DataStore
  ipcMain.handle('get-config', async () => {
    if (!dataStore) throw new Error('DataStore not initialized');
    return await dataStore.getConfig();
  });

  ipcMain.handle('save-config', async (event, config: Config) => {
    if (!dataStore) throw new Error('DataStore not initialized');
    await dataStore.saveConfig(config);
  });

  ipcMain.handle('update-config', async (event, updates: Partial<Config>) => {
    if (!dataStore) throw new Error('DataStore not initialized');
    return await dataStore.updateConfig(updates);
  });

  // Database operations
  ipcMain.handle('export-database', async () => {
    if (!dataStore) throw new Error('DataStore not initialized');
    return await dataStore.exportDatabase();
  });

  ipcMain.handle('import-database', async (event, jsonData: string) => {
    if (!dataStore) throw new Error('DataStore not initialized');
    const result = await dataStore.importDatabase(jsonData);
    if (!result.success) {
      throw new Error(result.error);
    }
  });

  ipcMain.handle('backup-database', async (event, backupPath?: string) => {
    if (!dataStore) throw new Error('DataStore not initialized');
    await dataStore.backup(backupPath);
  });

  // Server management
  ipcMain.handle('start-server', async () => {
    const projectDir = context.getProjectDir();
    if (!projectDir) throw new Error('No project directory set');
    
    await context.serverManager.start(projectDir, context.certificateManager);
    
    // Notify all windows that server started
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('server-status-changed', true);
    });
  });

  ipcMain.handle('stop-server', async () => {
    await context.serverManager.stop();
    
    // Notify all windows that server stopped
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('server-status-changed', false);
    });
  });

  ipcMain.handle('get-server-status', () => {
    return (context.serverManager as any).isRunning;
  });

  // Certificate operations
  ipcMain.handle('download-ca-cert', async () => {
    const projectDir = context.getProjectDir();
    if (!projectDir) throw new Error('No project directory set');
    
    const certPath = path.join(projectDir, '.cuepernova/ca-cert.pem');
    const cert = await fs.readFile(certPath, 'utf-8');
    
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: 'cuepernova-ca-cert.pem',
      filters: [{ name: 'Certificate', extensions: ['pem'] }],
    });
    
    if (filePath) {
      await fs.writeFile(filePath, cert);
    }
  });

  // Window operations
  ipcMain.handle('open-cuestation', async (event, name: string) => {
    await context.createCuestationWindow(name);
  });

  // Cueball operations
  ipcMain.handle('create-cueball', async (event, name: string, template: string) => {
    const projectDir = context.getProjectDir();
    if (!projectDir) throw new Error('No project directory set');
    
    const cueballDir = path.join(projectDir, 'public/cueballs', name);
    await fs.mkdir(cueballDir, { recursive: true });
    
    // Read template files
    const templateDir = path.join(__dirname, '../../templates/cueball');
    const templateFiles = ['index.html', 'cueball.js', 'style.css'];
    
    for (const file of templateFiles) {
      const content = await fs.readFile(path.join(templateDir, file), 'utf-8');
      const processedContent = content.replace(/{{CUEBALL_NAME}}/g, name);
      await fs.writeFile(path.join(cueballDir, file), processedContent);
    }
  });

  ipcMain.handle('get-cueball-templates', async () => {
    return ['basic', 'interactive', 'webrtc'];
  });

  // Cache operations
  ipcMain.handle('invalidate-cache', () => {
    if (dataStore) {
      dataStore.invalidateCache();
    }
  });
}

// Export function to get DataStore instance
export function getDataStore(): DataStore | null {
  return dataStore;
}

// Export function to reset DataStore (useful for testing)
export function resetDataStore(): void {
  dataStore = null;
}