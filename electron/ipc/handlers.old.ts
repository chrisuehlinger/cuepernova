import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { ServerManager } from '../server-manager.js';
import { CertificateManager } from '../certificate-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // Create default db.json if it doesn't exist
    const dbPath = path.join(directory, 'db.json');
    try {
      await fs.access(dbPath);
    } catch {
      const defaultDb = {
        cues: [],
        cuestations: [],
        config: {
          oscPort: 57121,
          httpPort: 8080,
          httpsPort: 8443,
          defaultCuestation: 'main',
        }
      };
      await fs.writeFile(dbPath, JSON.stringify(defaultDb, null, 2));
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

  // Database operations helper
  const readDatabase = async (): Promise<any> => {
    const projectDir = context.getProjectDir();
    if (!projectDir) throw new Error('No project directory set');
    
    const dbPath = path.join(projectDir, 'db.json');
    try {
      const data = await fs.readFile(dbPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      // Return default structure if file doesn't exist
      return {
        cues: [],
        cuestations: [],
        config: {
          oscPort: 57121,
          httpPort: 8080,
          httpsPort: 8443,
          defaultCuestation: 'main',
        }
      };
    }
  };

  const writeDatabase = async (db: any): Promise<void> => {
    const projectDir = context.getProjectDir();
    if (!projectDir) throw new Error('No project directory set');
    
    const dbPath = path.join(projectDir, 'db.json');
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
  };

  // Cues operations
  ipcMain.handle('get-cues', async () => {
    const db = await readDatabase();
    return db.cues || [];
  });

  ipcMain.handle('save-cues', async (event, cues: any[]) => {
    const db = await readDatabase();
    db.cues = cues;
    await writeDatabase(db);
  });

  // Cuestations operations
  ipcMain.handle('get-cuestations', async () => {
    const db = await readDatabase();
    return db.cuestations || [];
  });

  ipcMain.handle('save-cuestations', async (event, cuestations: any[]) => {
    const db = await readDatabase();
    db.cuestations = cuestations;
    await writeDatabase(db);
  });

  ipcMain.handle('open-cuestation', async (event, name: string) => {
    await context.createCuestationWindow(name);
  });

  // Config operations
  ipcMain.handle('get-config', async () => {
    const db = await readDatabase();
    return db.config || {
      oscPort: 57121,
      httpPort: 8080,
      httpsPort: 8443,
      defaultCuestation: 'main',
    };
  });

  ipcMain.handle('save-config', async (event, config: any) => {
    const db = await readDatabase();
    db.config = config;
    await writeDatabase(db);
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

  // Cueball creation
  ipcMain.handle('create-cueball', async (event, cueballName: string) => {
    const projectDir = context.getProjectDir();
    if (!projectDir) throw new Error('No project directory set');

    try {
      // Convert name to kebab-case for file names
      const kebabName = cueballName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-_]/g, '');
      
      // Check if cueball already exists
      const htmlPath = path.join(projectDir, 'public', 'cueballs', `${kebabName}.html`);
      const cssPath = path.join(projectDir, 'public', 'css', `${kebabName}.css`);
      const jsPath = path.join(projectDir, 'public', 'js', `${kebabName}.js`);
      
      try {
        await fs.access(htmlPath);
        return { success: false, error: `Cueball "${kebabName}" already exists` };
      } catch {
        // File doesn't exist, which is what we want
      }

      // Read template files from the dist/main directory
      // The templates are copied there during build
      // __dirname is dist/main/electron/ipc, so go up 2 levels to dist/main
      const templatesDir = path.join(__dirname, '..', '..', 'templates', 'cueball');
      
      // Try to read from templates directory
      const htmlTemplate = await fs.readFile(path.join(templatesDir, 'cueball.html'), 'utf-8');
      const cssTemplate = await fs.readFile(path.join(templatesDir, 'cueball.css'), 'utf-8');
      const jsTemplate = await fs.readFile(path.join(templatesDir, 'cueball.js'), 'utf-8');

      // Replace placeholders
      const htmlContent = htmlTemplate
        .replace(/{{NAME}}/g, cueballName)
        .replace(/{{KEBAB_NAME}}/g, kebabName);
      
      const cssContent = cssTemplate
        .replace(/{{NAME}}/g, cueballName)
        .replace(/{{KEBAB_NAME}}/g, kebabName);
      
      const jsContent = jsTemplate
        .replace(/{{NAME}}/g, cueballName)
        .replace(/{{KEBAB_NAME}}/g, kebabName);

      // Write files
      await fs.writeFile(htmlPath, htmlContent, 'utf-8');
      await fs.writeFile(cssPath, cssContent, 'utf-8');
      await fs.writeFile(jsPath, jsContent, 'utf-8');

      return { 
        success: true, 
        files: {
          html: `public/cueballs/${kebabName}.html`,
          css: `public/css/${kebabName}.css`,
          js: `public/js/${kebabName}.js`
        },
        kebabName
      };
    } catch (error) {
      console.error('Error creating cueball:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create cueball';
      return { success: false, error: errorMessage };
    }
  });
}