import express from 'express';
import * as http from 'node:http';
import * as https from 'node:https';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import morgan from 'morgan';
import { WebSocketServer } from 'ws';
import { setupSockets } from '../src/server/sockets.js';
import { setupSignalmaster } from '../src/server/signalmaster.js';
import { CertificateManager } from './certificate-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ServerManager {
  private app: express.Application | null = null;
  private httpServer: http.Server | null = null;
  private httpsServer: https.Server | null = null;
  private wss: WebSocketServer | null = null;
  private projectDir: string | null = null;
  private isRunning = false;
  private httpPort = 8080;
  private httpsPort = 8443;

  constructor() {}

  async start(projectDir: string, certificateManager: CertificateManager): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    this.projectDir = projectDir;
    this.app = express();

    // Middleware
    this.app.use(morgan('dev'));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Serve static files from package
    this.app.use('/static', express.static(path.join(__dirname, '../../../static')));
    
    // Serve compiled renderer assets
    this.app.use('/static/js', express.static(path.join(__dirname, '../../renderer/static')));
    
    // Serve project files
    this.app.use('/cueballs', express.static(path.join(projectDir, 'cueballs')));
    this.app.use('/media', express.static(path.join(projectDir, 'media')));
    this.app.use('/css', express.static(path.join(projectDir, 'css')));
    this.app.use('/js', express.static(path.join(projectDir, 'js')));
    
    // Serve configuration files
    this.app.get('/cues.json', async (req, res) => {
      try {
        const cuesPath = path.join(projectDir, 'cues.json');
        const data = await fs.readFile(cuesPath, 'utf-8');
        res.json(JSON.parse(data));
      } catch (error) {
        res.json([]);
      }
    });

    this.app.get('/cuestations.json', async (req, res) => {
      try {
        const cuestationsPath = path.join(projectDir, 'cuestations.json');
        const data = await fs.readFile(cuestationsPath, 'utf-8');
        res.json(JSON.parse(data));
      } catch (error) {
        res.json([]);
      }
    });

    // Serve CA root certificate
    this.app.get('/CAROOT.pem', async (req, res) => {
      try {
        const certPath = path.join(projectDir, '.cuepernova', 'ca-cert.pem');
        const cert = await fs.readFile(certPath);
        res.type('application/x-pem-file');
        res.send(cert);
      } catch (error) {
        res.status(404).send('CA certificate not found');
      }
    });

    // Serve HTML pages
    this.app.get('/cuestation.html', (req, res) => {
      res.sendFile(path.join(__dirname, '../../../static/cuestation.html'));
    });

    this.app.get('/mapping.html', (req, res) => {
      res.sendFile(path.join(__dirname, '../../../static/mapping.html'));
    });

    this.app.get('/control.html', (req, res) => {
      res.sendFile(path.join(__dirname, '../../../static/control.html'));
    });

    // Setup SignalMaster routes for WebRTC
    setupSignalmaster(this.app);

    // Default route
    this.app.get('/', (req, res) => {
      res.redirect('/control.html');
    });

    // Error handling
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error(err.stack);
      res.status(500).send('Something broke!');
    });

    // Create HTTP server
    this.httpServer = http.createServer(this.app);

    // Create HTTPS server with certificates
    const { cert, key } = await certificateManager.getServerCertificates(projectDir);
    this.httpsServer = https.createServer({ cert, key }, this.app);

    // Setup WebSocket server on HTTPS
    this.wss = new WebSocketServer({ server: this.httpsServer });
    
    // Load config and setup sockets
    const configPath = path.join(projectDir, 'cuepernova.config.json');
    let config: any = {};
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(configData);
    } catch (error) {
      // Use default config
      config = {
        oscPort: 57121,
        httpPort: this.httpPort,
        httpsPort: this.httpsPort,
      };
    }

    // Setup WebSocket and OSC handling
    setupSockets(this.wss, config);

    // Start servers
    await new Promise<void>((resolve, reject) => {
      this.httpServer!.listen(this.httpPort, () => {
        console.log(`HTTP server listening on port ${this.httpPort}`);
        resolve();
      }).on('error', reject);
    });

    await new Promise<void>((resolve, reject) => {
      this.httpsServer!.listen(this.httpsPort, () => {
        console.log(`HTTPS server listening on port ${this.httpsPort}`);
        resolve();
      }).on('error', reject);
    });

    this.isRunning = true;
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    // Close HTTP server
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => resolve());
      });
      this.httpServer = null;
    }

    // Close HTTPS server
    if (this.httpsServer) {
      await new Promise<void>((resolve) => {
        this.httpsServer!.close(() => resolve());
      });
      this.httpsServer = null;
    }

    this.app = null;
    this.isRunning = false;
  }

  getStatus(): boolean {
    return this.isRunning;
  }

  getPort(): number | null {
    return this.isRunning ? this.httpsPort : null;
  }
}