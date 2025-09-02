/**
 * Refactored WebSocket server using centralized WebSocketManager
 */

import osc from 'osc';
import os from 'node:os';
import { WebSocketManager } from '../shared/websocket/WebSocketManager.js';
import { WebSocketMessage, OSCMessage } from '../shared/types/index.js';
import rtcSignals from '../utils/rtc-signals.js';

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

// Create WebSocket manager instance
export const wsManager = new WebSocketManager({
  maxClients: 100,
  heartbeatInterval: 30000,
  enableLogging: true
});

// Setup connection/disconnection handlers
wsManager.onConnection((client) => {
  console.log(`Client connected: ${client.type} - ${client.name}`);
  
  // Send initial state if needed
  if (client.type === 'control') {
    // Send current system status
    const status = wsManager.getStatus();
    wsManager.sendToClient(client, {
      address: '/system/status',
      args: [status.cuestations, status.controlPanels]
    });
  }
});

wsManager.onDisconnection((client) => {
  console.log(`Client disconnected: ${client.type} - ${client.name}`);
});

// Setup custom message routes
wsManager.addRoute(/^\/cuepernova\/rtc\//, (message, client) => {
  // Handle RTC signaling
  const command = message.address.split('/')[3];
  
  switch (command) {
    case 'offer':
      if (message.args[0] && message.args[1]) {
        const [fromId, offer] = message.args;
        rtcSignals.offer[fromId as string] = offer;
      }
      break;
      
    case 'answer':
      if (message.args[0] && message.args[1]) {
        const [fromId, answer] = message.args;
        rtcSignals.answer[fromId as string] = answer;
      }
      break;
      
    case 'get-offer':
      if (message.args[0]) {
        const peerId = message.args[0] as string;
        const offer = rtcSignals.offer[peerId];
        if (offer) {
          wsManager.sendToClient(client, {
            address: '/cuepernova/rtc/offer',
            args: [peerId, offer]
          });
        }
      }
      break;
      
    case 'get-answer':
      if (message.args[0]) {
        const peerId = message.args[0] as string;
        const answer = rtcSignals.answer[peerId];
        if (answer) {
          wsManager.sendToClient(client, {
            address: '/cuepernova/rtc/answer',
            args: [peerId, answer]
          });
        }
      }
      break;
  }
});

// Setup OSC server
let udpPort: any;

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
    
    // Forward to WebSocketManager for routing
    wsManager.handleOSCMessage(oscMessage);
  });

  udpPort.on("error", function (err: Error) {
    console.error('OSC error:', err);
  });

  udpPort.open();
}

// Export functions for external use
export const broadcastToCuestations = (message: WebSocketMessage) => {
  wsManager.broadcastToCuestations(message);
};

export const broadcastToControl = (message: WebSocketMessage) => {
  wsManager.broadcastToControl(message);
};

export const getConnectionStatus = () => {
  return wsManager.getStatus();
};

// Export WebSocket upgrade handler
export const wsUpgrade = wsManager.handleUpgrade.bind(wsManager);

// Cleanup function
export const shutdown = () => {
  if (udpPort) {
    udpPort.close();
  }
  wsManager.shutdown();
};