import { WebSocketServer, WebSocket } from 'ws';
import osc from 'osc';
import url from 'node:url';
import os from 'node:os';
import { IncomingMessage } from 'node:http';
import { Duplex } from 'node:stream';

import rtcSignals from '../utils/rtc-signals.js';
import { WebSocketMessage, OSCMessage, RTCSignals } from '../types/index.js';

// Extended WebSocket with custom properties
interface OrbitalWebSocket extends WebSocket {
  orbitalName?: string;
}

// Get local IP addresses for OSC logging
const getIPAddresses = function (): string[] {
  const interfaces = os.networkInterfaces();
  const ipAddresses: string[] = [];

  for (const deviceName in interfaces) {
      const addresses = interfaces[deviceName];
      if (addresses) {
        for (let i = 0; i < addresses.length; i++) {
            const addressInfo = addresses[i];
            if (addressInfo.family === "IPv4" && !addressInfo.internal) {
                ipAddresses.push(addressInfo.address);
            }
        }
      }
  }

  return ipAddresses;
};

// Create WebSocket servers
const orbitalWS = new WebSocketServer({ noServer: true });
const controlWS = new WebSocketServer({ noServer: true });

// Orbital connections handle display/projection devices
orbitalWS.on('connection', function connection(ws: OrbitalWebSocket, request: IncomingMessage) {
  const params = url.parse(request.url || '', true).query;
  ws.orbitalName = (params.name as string) || 'unnamed';
  
  console.log(`ORBITAL CONNECTED: ${ws.orbitalName}`);
  console.log(`Total orbitals: ${orbitalWS.clients.size}`);
  
  ws.on('close', () => {
    console.log(`ORBITAL DISCONNECTED: ${ws.orbitalName}`);
  });
  
  ws.on('error', (err: Error) => {
    console.error(`ORBITAL ERROR (${ws.orbitalName}):`, err);
  });
});

// Control panel connections
controlWS.on('connection', function connection(ws: WebSocket) {
  console.log('CONTROL PANEL CONNECTED');
  
  ws.on('message', (message: Buffer | ArrayBuffer | Buffer[]) => {
    try {
      const oscMessage: WebSocketMessage = JSON.parse(message.toString());
      console.log('Control panel message:', JSON.stringify(oscMessage, null, 2));
      
      // Route messages based on address namespace
      const pathParts = oscMessage.address.split('/');
      const namespace = pathParts[1];
      const subNamespace = pathParts[2];
      
      if (namespace === 'cuepernova') {
        switch(subNamespace) {
          case 'orbital':
            // Broadcast to all orbital clients
            orbitalWS.clients.forEach((client: WebSocket) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(oscMessage));
              }
            });
            break;
            
          case 'system':
            handleSystemMessage(oscMessage);
            break;
            
          default:
            console.log(`No handler for sub-namespace: ${subNamespace}`);
        }
      } else {
        console.log(`No handler for namespace: ${namespace}`);
      }
    } catch(e) {
      console.error('Error processing control message:', e);
    }
  });
});

// Handle system-level messages
async function handleSystemMessage(message: WebSocketMessage): Promise<void> {
  const command = message.address.split('/')[3];
  
  switch(command) {
    case 'clear-rtc':
      rtcSignals.offer = {};
      rtcSignals.answer = {};
      console.log('Cleared RTC signals');
      break;
      
    case 'clearMappings':
      // Broadcast clearMappings message to all orbitals
      orbitalWS.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            address: '/cuepernova/orbital/clearMappings',
            args: []
          }));
        }
      });
      console.log('Sent clearMappings to all orbitals');
      break;
      
    case 'resetMapping':
      // Reset mapping for specific orbital
      const targetOrbital = message.args && message.args[0];
      if (targetOrbital) {
        orbitalWS.clients.forEach((client: OrbitalWebSocket) => {
          if (client.readyState === WebSocket.OPEN && client.orbitalName === targetOrbital) {
            client.send(JSON.stringify({
              address: '/cuepernova/orbital/clearMappings',
              args: []
            }));
          }
        });
        console.log(`Sent clearMappings to orbital: ${targetOrbital}`);
      }
      break;
      
    default:
      console.log(`No handler for system command: ${command}`);
  }
}

// Setup OSC server for QLab integration
let udpPort: any; // osc types not available

export function initOSCServer(port: number = 57121): void {
  udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: port
  });

  udpPort.on("ready", function () {
    const ipAddresses = getIPAddresses();
    console.log("Listening for OSC over UDP:");
    ipAddresses.forEach((address: string) => {
        console.log(` - ${address}:${udpPort.options.localPort}`);
    });
  });

  udpPort.on("message", function (oscMessage: OSCMessage) {
    console.log('OSC message received:', JSON.stringify(oscMessage, null, 2));
    
    const pathParts = oscMessage.address.split('/');
    const namespace = pathParts[1];
    const subNamespace = pathParts[2];
    
    if (namespace === 'cuepernova') {
      switch(subNamespace) {
        case 'orbital':
          // Broadcast to all orbital clients
          orbitalWS.clients.forEach((client: WebSocket) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(oscMessage));
            }
          });
          break;
          
        case 'system':
          handleSystemMessage(oscMessage);
          break;
          
        default:
          console.log(`No OSC handler for sub-namespace: ${subNamespace}`);
      }
    } else {
      console.log(`No OSC handler for namespace: ${namespace}`);
    }
  });

  udpPort.on("error", function (err: Error) {
    console.error('OSC error:', err);
  });

  udpPort.open();
}

// Export WebSocket upgrade handler
export const wsUpgrade = function(request: IncomingMessage, socket: Duplex, head: Buffer): void {
    const pathname = url.parse(request.url || '').pathname;

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
};

export const sendControlMessage = function(message: WebSocketMessage): void {
    controlWS.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
};