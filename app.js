const fs = require('fs').promises;
const express = require('express');
const http = require('http');
const https = require('https');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const routes = require('./routes/index');
const signalmaster = require('./routes/signalmaster');

const app = express();

const env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

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

module.exports = async function init() {
  let httpServer, httpsServer;
  
  // Try to load SSL certificates
  try {
    const [privateKey, certificate] = await Promise.all([
      fs.readFile('certs/key.pem', 'utf8'),
      fs.readFile('certs/cert.pem', 'utf8')
    ]);
    const credentials = {key: privateKey, cert: certificate};
    httpsServer = https.createServer(credentials, app);
  } catch(e) {
    console.log('SSL certificates not found, HTTPS server will not be started');
  }

  httpServer = http.createServer(app);

  const { wsUpgrade } = require('./sockets');

  httpServer.on('upgrade', wsUpgrade);
  if (httpsServer) {
    httpsServer.on('upgrade', wsUpgrade);
  }

  let httpPort = 80,
      httpsPort = 443;
  if (app.get('env') === 'development') {
    httpPort += 8000;
    httpsPort += 8000;
  }

  httpServer.listen(httpPort, () => {
    console.log(`HTTP server listening on port ${httpPort}`);
  });
  
  if (httpsServer) {
    httpsServer.listen(httpsPort, () => {
      console.log(`HTTPS server listening on port ${httpsPort}`);
    });
  }
};