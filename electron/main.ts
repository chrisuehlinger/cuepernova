import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { setupIpcHandlers } from './ipc/handlers.js';
import { ServerManager } from './server/index.js';
import { CertificateManager } from './server/certificate-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let serverManager: ServerManager;
let certificateManager: CertificateManager;
let projectDir: string | null = null;
const cuestationWindows = new Map<string, BrowserWindow>();

const isDev = process.env.NODE_ENV === 'development';

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../../../static/images/icon.png'),
  });

  // Disable CSP entirely for development
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': []
      }
    });
  });

  // Load React app
  if (isDev) {
    await mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    // Close all cuestation windows
    cuestationWindows.forEach(window => window.close());
    cuestationWindows.clear();
  });
}

async function createCuestationWindow(name: string): Promise<void> {
  // Close existing window with same name if it exists
  if (cuestationWindows.has(name)) {
    cuestationWindows.get(name)?.close();
  }

  const cuestationWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: `Cuestation: ${name}`,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
    },
  });

  cuestationWindows.set(name, cuestationWindow);

  // Load cuestation page from server
  const serverPort = serverManager.getPort();
  if (serverPort) {
    await cuestationWindow.loadURL(`https://localhost:${serverPort}/cuestation.html?name=${encodeURIComponent(name)}`);
  }

  cuestationWindow.on('closed', () => {
    cuestationWindows.delete(name);
  });
}

app.whenReady().then(async () => {
  // Initialize managers
  serverManager = new ServerManager();
  certificateManager = new CertificateManager();
  
  // Setup IPC handlers
  setupIpcHandlers({
    serverManager,
    certificateManager,
    getProjectDir: () => projectDir,
    setProjectDir: (dir: string) => { projectDir = dir; },
    createCuestationWindow,
  });

  // Create app menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Project...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow!, {
              properties: ['openDirectory'],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow?.webContents.send('directory-selected', result.filePaths[0]);
            }
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Cuepernova',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'About Cuepernova',
              message: 'Cuepernova',
              detail: 'Open source theater projection control system\n\nVersion: 0.0.1',
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template as any);
  Menu.setApplicationMenu(menu);

  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  // Stop server if running
  if (serverManager) {
    await serverManager.stop();
  }
});

// Handle certificate errors (accept self-signed certs for localhost)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // Only accept certificates for localhost
  const urlObj = new URL(url);
  if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});