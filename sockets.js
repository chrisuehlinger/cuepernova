const WebSocket = require('ws');
const osc = require("osc");
const url = require('url');

const rtcSignals = require('./util/rtc-signals');

// Get local IP addresses for OSC logging
const getIPAddresses = function () {
  const os = require("os"),
      interfaces = os.networkInterfaces(),
      ipAddresses = [];

  for (const deviceName in interfaces) {
      const addresses = interfaces[deviceName];
      for (let i = 0; i < addresses.length; i++) {
          const addressInfo = addresses[i];
          if (addressInfo.family === "IPv4" && !addressInfo.internal) {
              ipAddresses.push(addressInfo.address);
          }
      }
  }

  return ipAddresses;
};

// Create WebSocket servers
const orbitalWS = new WebSocket.Server({ noServer: true });
const controlWS = new WebSocket.Server({ noServer: true });

// Orbital connections handle display/projection devices
orbitalWS.on('connection', function connection(ws, request) {
  const params = url.parse(request.url, true).query;
  ws.orbitalName = params.name || 'unnamed';
  
  console.log(`ORBITAL CONNECTED: ${ws.orbitalName}`);
  console.log(`Total orbitals: ${orbitalWS.clients.size}`);
  
  ws.on('close', () => {
    console.log(`ORBITAL DISCONNECTED: ${ws.orbitalName}`);
  });
  
  ws.on('error', (err) => {
    console.error(`ORBITAL ERROR (${ws.orbitalName}):`, err);
  });
});

// Control panel connections
controlWS.on('connection', function connection(ws) {
  console.log('CONTROL PANEL CONNECTED');
  
  ws.on('message', message => {
    try {
      const oscMessage = JSON.parse(message);
      console.log('Control panel message:', JSON.stringify(oscMessage, null, 2));
      
      // Route messages based on address namespace
      const namespace = oscMessage.address.split('/')[1];
      
      switch(namespace) {
        case 'orbital':
          // Broadcast to all orbital clients
          orbitalWS.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(oscMessage));
            }
          });
          break;
          
        case 'cuepernova':
          handleSystemMessage(oscMessage);
          break;
          
        default:
          console.log(`No handler for namespace: ${namespace}`);
      }
    } catch(e) {
      console.error('Error processing control message:', e);
    }
  });
});

// Handle system-level messages
async function handleSystemMessage(message) {
  const command = message.address.split('/')[2];
  
  switch(command) {
    case 'clear-rtc':
      rtcSignals.offer = {};
      rtcSignals.answer = {};
      console.log('Cleared RTC signals');
      break;
      
    default:
      console.log(`No handler for system command: ${command}`);
  }
}

// Setup OSC server for QLab integration
const udpPort = new osc.UDPPort({
  localAddress: "0.0.0.0",
  localPort: 57121
});

udpPort.on("ready", function () {
  const ipAddresses = getIPAddresses();
  console.log("Listening for OSC over UDP:");
  ipAddresses.forEach(address => {
      console.log(` - ${address}:${udpPort.options.localPort}`);
  });
});

udpPort.on("message", function (oscMessage) {
  console.log('OSC message received:', JSON.stringify(oscMessage, null, 2));
  
  const namespace = oscMessage.address.split('/')[1];
  
  switch(namespace) {
    case 'orbital':
      // Broadcast to all orbital clients
      orbitalWS.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(oscMessage));
        }
      });
      break;
      
    case 'cuepernova':
      handleSystemMessage(oscMessage);
      break;
      
    default:
      console.log(`No OSC handler for namespace: ${namespace}`);
  }
});

udpPort.on("error", function (err) {
  console.error('OSC error:', err);
});

udpPort.open();

// Export WebSocket upgrade handler
module.exports = {
  wsUpgrade: function(request, socket, head) {
    const pathname = url.parse(request.url).pathname;

    if (pathname === '/orbital') {
      orbitalWS.handleUpgrade(request, socket, head, function done(ws) {
        orbitalWS.emit('connection', ws, request);
      });
    } else if (pathname === '/control') {
      controlWS.handleUpgrade(request, socket, head, function done(ws) {
        controlWS.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  },
  
  // Utility function to send messages to all control panels
  sendControlMessage: function(message) {
    controlWS.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
};