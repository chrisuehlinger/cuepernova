import express from 'express';
import * as http from 'node:http';
import * as https from 'node:https';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import morgan from 'morgan';
import { WebSocketServer } from 'ws';
import { wsUpgrade, initOSCServer, broadcastToCuestations } from './sockets.js';
import { setupSignalmaster } from './signalmaster.js';
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

  constructor() { }

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

    // Serve static HTML and CSS files
    this.app.use('/static', express.static(path.join(__dirname, '../../static')));

    // Serve compiled renderer JS assets
    this.app.use('/static/js', express.static(path.join(__dirname, '../../renderer/static')));

    // Serve project files from public directory
    this.app.use('/cueballs', express.static(path.join(projectDir, 'public/cueballs')));
    this.app.use('/media', express.static(path.join(projectDir, 'public/media')));
    this.app.use('/css', express.static(path.join(projectDir, 'public/css')));
    this.app.use('/js', express.static(path.join(projectDir, 'public/js')));
    this.app.use('/node_modules', express.static(path.join(projectDir, 'node_modules')));

    // Also serve entire public directory at /public for convenience
    this.app.use('/public', express.static(path.join(projectDir, 'public')));

    // Serve data from db.json
    this.app.get('/cues.json', async (req, res) => {
      try {
        const dbPath = path.join(projectDir, 'db.json');
        const data = await fs.readFile(dbPath, 'utf-8');
        const db = JSON.parse(data);
        res.json(db.cues || []);
      } catch (error) {
        res.json([]);
      }
    });

    this.app.get('/cuestations.json', async (req, res) => {
      try {
        const dbPath = path.join(projectDir, 'db.json');
        const data = await fs.readFile(dbPath, 'utf-8');
        const db = JSON.parse(data);
        res.json(db.cuestations || []);
      } catch (error) {
        res.json([]);
      }
    });

    // Also serve the entire db.json for debugging/development
    this.app.get('/db.json', async (req, res) => {
      try {
        const dbPath = path.join(projectDir, 'db.json');
        const data = await fs.readFile(dbPath, 'utf-8');
        res.json(JSON.parse(data));
      } catch (error) {
        res.json({
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
    });

    // Serve individual cuestation configuration
    this.app.get('/api/cuestation/:name', async (req, res) => {
      try {
        const dbPath = path.join(projectDir, 'db.json');
        const data = await fs.readFile(dbPath, 'utf-8');
        const db = JSON.parse(data);
        const cuestation = db.cuestations?.find((c: any) => c.name === req.params.name);

        if (cuestation) {
          // Ensure cuestation has showtime resolution
          if (!cuestation.showtimeResolution) {
            cuestation.showtimeResolution = { width: 1920, height: 1080 };
          }
          // Ensure cuestation has default mapping if none exists
          if (!cuestation.mapping) {
            const width = cuestation.showtimeResolution?.width || 1920;
            const height = cuestation.showtimeResolution?.height || 1080;
            cuestation.mapping = {
              layers: [{
                // Target points are normalized (0-1)
                targetPoints: [[0, 0], [1, 0], [1, 1], [0, 1]],
                // Source points are in resolution coordinates
                sourcePoints: [[0, 0], [width, 0], [width, height], [0, height]]
              }]
            };
          }
          res.json(cuestation);
        } else {
          // Return default configuration for unknown cuestations
          const width = 1920;
          const height = 1080;
          res.json({
            id: 'default',
            name: req.params.name,
            showtimeResolution: { width, height },
            mapping: {
              layers: [{
                // Target points are normalized (0-1)
                targetPoints: [[0, 0], [1, 0], [1, 1], [0, 1]],
                // Source points are in resolution coordinates
                sourcePoints: [[0, 0], [width, 0], [width, height], [0, height]]
              }]
            }
          });
        }
      } catch (error) {
        console.error('Error fetching cuestation config:', error);
        res.status(500).json({ error: 'Failed to fetch cuestation configuration' });
      }
    });

    // Update cuestation mapping
    this.app.put('/api/cuestation/:name/mapping', async (req, res) => {
      try {
        const dbPath = path.join(projectDir, 'db.json');
        const data = await fs.readFile(dbPath, 'utf-8');
        const db = JSON.parse(data);

        const cuestationIndex = db.cuestations?.findIndex((c: any) => c.name === req.params.name);

        if (cuestationIndex >= 0) {
          // Update the mapping
          db.cuestations[cuestationIndex].mapping = req.body;

          // Save the updated database
          await fs.writeFile(dbPath, JSON.stringify(db, null, 2));

          // Send mapping update to the specific cuestation via WebSocket
          const message = {
            address: `/cuepernova/cuestation/${req.params.name}/mapping-update`,
            args: [JSON.stringify(req.body)]
          };
          broadcastToCuestations(message);

          res.json({ success: true });
        } else {
          res.status(404).json({ error: 'Cuestation not found' });
        }
      } catch (error) {
        console.error('Error updating cuestation mapping:', error);
        res.status(500).json({ error: 'Failed to update mapping' });
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
      res.sendFile(path.join(__dirname, '../../static/cuestation.html'));
    });

    this.app.get('/control.html', (req, res) => {
      res.sendFile(path.join(__dirname, '../../static/control.html'));
    });

    this.app.get('/mapping-editor.html', (req, res) => {
      res.sendFile(path.join(__dirname, '../../static/mapping-editor.html'));
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
    this.wss = new WebSocketServer({ noServer: true });

    // Setup WebSocket upgrade handling on both HTTP and HTTPS servers
    this.httpServer.on('upgrade', wsUpgrade);
    this.httpsServer.on('upgrade', wsUpgrade);

    // Load config from db.json and setup sockets
    const dbPath = path.join(projectDir, 'db.json');
    let config: any = {};
    try {
      const dbData = await fs.readFile(dbPath, 'utf-8');
      const db = JSON.parse(dbData);
      config = db.config || {
        oscPort: 57121,
        httpPort: this.httpPort,
        httpsPort: this.httpsPort,
        defaultCuestation: 'main',
      };
    } catch (error) {
      // Use default config
      config = {
        oscPort: 57121,
        httpPort: this.httpPort,
        httpsPort: this.httpsPort,
        defaultCuestation: 'main',
      };
    }

    // Setup OSC handling
    initOSCServer(config.oscPort || 57121);

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