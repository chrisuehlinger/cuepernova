import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { ServerManager } from '../server-manager.js';
import { CertificateManager } from '../certificate-manager.js';

interface IpcContext {
  serverManager: ServerManager;
  certificateManager: CertificateManager;
  getProjectDir: () => string | null;
  setProjectDir: (dir: string) => void;
  createCuestationWindow: (name: string) => Promise<void>;
}

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

  // Project initialization
  ipcMain.handle('initialize-project', async (event, directory: string) => {
    context.setProjectDir(directory);
    
    // Create necessary directories
    const dirs = ['cueballs', 'media', 'css', 'js', '.cuepernova'];
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

    // Create default cues.json if it doesn't exist
    const cuesPath = path.join(directory, 'cues.json');
    try {
      await fs.access(cuesPath);
    } catch {
      await fs.writeFile(cuesPath, JSON.stringify([], null, 2));
    }

    // Create default cuestations.json if it doesn't exist
    const cuestationsPath = path.join(directory, 'cuestations.json');
    try {
      await fs.access(cuestationsPath);
    } catch {
      await fs.writeFile(cuestationsPath, JSON.stringify([], null, 2));
    }

    // Create default config if it doesn't exist
    const configPath = path.join(directory, 'cuepernova.config.json');
    try {
      await fs.access(configPath);
    } catch {
      const defaultConfig = {
        oscPort: 57121,
        httpPort: 8080,
        httpsPort: 8443,
        defaultCuestation: 'main',
      };
      await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
    }

    // Initialize CA certificate
    await context.certificateManager.initializeCA(directory);
  });

  // File operations
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

  // Cues operations
  ipcMain.handle('get-cues', async () => {
    const projectDir = context.getProjectDir();
    if (!projectDir) throw new Error('No project directory set');
    
    const cuesPath = path.join(projectDir, 'cues.json');
    try {
      const data = await fs.readFile(cuesPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  });

  ipcMain.handle('save-cues', async (event, cues: any[]) => {
    const projectDir = context.getProjectDir();
    if (!projectDir) throw new Error('No project directory set');
    
    const cuesPath = path.join(projectDir, 'cues.json');
    await fs.writeFile(cuesPath, JSON.stringify(cues, null, 2));
  });

  // Cuestations operations
  ipcMain.handle('get-cuestations', async () => {
    const projectDir = context.getProjectDir();
    if (!projectDir) throw new Error('No project directory set');
    
    const cuestationsPath = path.join(projectDir, 'cuestations.json');
    try {
      const data = await fs.readFile(cuestationsPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  });

  ipcMain.handle('save-cuestations', async (event, cuestations: any[]) => {
    const projectDir = context.getProjectDir();
    if (!projectDir) throw new Error('No project directory set');
    
    const cuestationsPath = path.join(projectDir, 'cuestations.json');
    await fs.writeFile(cuestationsPath, JSON.stringify(cuestations, null, 2));
  });

  ipcMain.handle('open-cuestation', async (event, name: string) => {
    await context.createCuestationWindow(name);
  });

  // Config operations
  ipcMain.handle('get-config', async () => {
    const projectDir = context.getProjectDir();
    if (!projectDir) throw new Error('No project directory set');
    
    const configPath = path.join(projectDir, 'cuepernova.config.json');
    try {
      const data = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return {
        oscPort: 57121,
        httpPort: 8080,
        httpsPort: 8443,
        defaultCuestation: 'main',
      };
    }
  });

  ipcMain.handle('save-config', async (event, config: any) => {
    const projectDir = context.getProjectDir();
    if (!projectDir) throw new Error('No project directory set');
    
    const configPath = path.join(projectDir, 'cuepernova.config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  });

  // Server operations
  ipcMain.handle('start-server', async () => {
    const projectDir = context.getProjectDir();
    if (!projectDir) throw new Error('No project directory set');
    
    await context.serverManager.start(projectDir, context.certificateManager);
    
    // Notify all windows
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('server-status-changed', true);
    });
  });

  ipcMain.handle('stop-server', async () => {
    await context.serverManager.stop();
    
    // Notify all windows
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('server-status-changed', false);
    });
  });

  ipcMain.handle('get-server-status', async () => {
    return context.serverManager.getStatus();
  });

  // CA Certificate operations
  ipcMain.handle('download-ca-cert', async () => {
    const projectDir = context.getProjectDir();
    if (!projectDir) throw new Error('No project directory set');
    
    return await context.certificateManager.getCACertificate(projectDir);
  });
}