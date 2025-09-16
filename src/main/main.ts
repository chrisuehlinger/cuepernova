/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, dialog, Menu } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { resolveHtmlPath } from './util';
import { setupIpcHandlers } from './ipc/handlers';
import { ServerManager } from './server/index';
import { CertificateManager } from './server/certificate-manager';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let serverManager: ServerManager;
let certificateManager: CertificateManager;
let projectDir: string | null = null;
const cuestationWindows = new Map<string, BrowserWindow>();

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};


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

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
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

app
  .whenReady()
  .then(() => {
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
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);


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