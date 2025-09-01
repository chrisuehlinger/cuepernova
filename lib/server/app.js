import { promises as fs } from 'node:fs';
import express from 'express';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import logger from 'morgan';

import routes from '../../routes/index.js';
import signalmaster from './signalmaster.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

// view engine setup
app.set('views', path.join(__dirname, '..', '..', 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.use('/', routes);
app.use('/signalmaster', signalmaster);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use((err, req, res, next) => {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
            title: 'error'
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {},
        title: 'error'
    });
});

export function setupStaticRoutes(config) {
  const packageRoot = path.join(__dirname, '..', '..');
  const projectRoot = process.cwd();
  
  // Serve package's static files (built-in pages)
  app.use(express.static(path.join(packageRoot, 'static')));
  
  // Serve project's cueballs folder
  const cueballsPath = path.resolve(projectRoot, config.paths.cueballs);
  app.use('/cueballs', express.static(cueballsPath));
  
  // Serve project's media folder
  const mediaPath = path.resolve(projectRoot, config.paths.media);
  app.use('/media', express.static(mediaPath));
  
  // Serve project's node_modules
  const nodeModulesPath = path.resolve(projectRoot, config.paths.nodeModules);
  app.use('/node_modules', express.static(nodeModulesPath));
}

export default async function init(config) {
  let httpServer, httpsServer;
  
  // Setup static routes with config
  setupStaticRoutes(config);
  
  // Try to load SSL certificates if configured
  if (config.server.ssl?.cert && config.server.ssl?.key) {
    try {
      const [privateKey, certificate] = await Promise.all([
        fs.readFile(config.server.ssl.key, 'utf8'),
        fs.readFile(config.server.ssl.cert, 'utf8')
      ]);
      const credentials = {key: privateKey, cert: certificate};
      httpsServer = https.createServer(credentials, app);
    } catch(e) {
      console.log('SSL certificates not found, HTTPS server will not be started');
    }
  }

  httpServer = http.createServer(app);

  const { wsUpgrade, initOSCServer } = await import('./sockets.js');
  
  // Initialize OSC server with configured port
  initOSCServer(config.osc.port);

  httpServer.on('upgrade', wsUpgrade);
  if (httpsServer) {
    httpsServer.on('upgrade', wsUpgrade);
  }

  httpServer.listen(config.server.httpPort, () => {
    console.log(`HTTP server listening on port ${config.server.httpPort}`);
  });
  
  if (httpsServer) {
    httpsServer.listen(config.server.httpsPort, () => {
      console.log(`HTTPS server listening on port ${config.server.httpsPort}`);
    });
  }
  
  return { httpServer, httpsServer };
};