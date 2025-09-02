import { WebSocketServer, WebSocket } from 'ws';
import osc from 'osc';
import url from 'node:url';
import os from 'node:os';
import rtcSignals from '../utils/rtc-signals.js';
// Get local IP addresses for OSC logging
const getIPAddresses = function () {
    const interfaces = os.networkInterfaces();
    const ipAddresses = [];
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
const cuestationWS = new WebSocketServer({ noServer: true });
const controlWS = new WebSocketServer({ noServer: true });
// Cuestation connections handle display/projection devices
cuestationWS.on('connection', function connection(ws, request) {
    const params = url.parse(request.url || '', true).query;
    ws.cuestationName = params.name || 'unnamed';
    console.log(`CUESTATION CONNECTED: ${ws.cuestationName}`);
    console.log(`Total cuestations: ${cuestationWS.clients.size}`);
    ws.on('close', () => {
        console.log(`CUESTATION DISCONNECTED: ${ws.cuestationName}`);
    });
    ws.on('error', (err) => {
        console.error(`CUESTATION ERROR (${ws.cuestationName}):`, err);
    });
});
// Control panel connections
controlWS.on('connection', function connection(ws) {
    console.log('CONTROL PANEL CONNECTED');
    ws.on('message', (message) => {
        try {
            const oscMessage = JSON.parse(message.toString());
            console.log('Control panel message:', JSON.stringify(oscMessage, null, 2));
            // Route messages based on address namespace
            const pathParts = oscMessage.address.split('/');
            const namespace = pathParts[1];
            const subNamespace = pathParts[2];
            if (namespace === 'cuepernova') {
                switch (subNamespace) {
                    case 'cuestation':
                        // Broadcast to all cuestation clients
                        cuestationWS.clients.forEach((client) => {
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
            }
            else {
                console.log(`No handler for namespace: ${namespace}`);
            }
        }
        catch (e) {
            console.error('Error processing control message:', e);
        }
    });
});
// Handle system-level messages
async function handleSystemMessage(message) {
    const command = message.address.split('/')[3];
    switch (command) {
        case 'clear-rtc':
            rtcSignals.offer = {};
            rtcSignals.answer = {};
            console.log('Cleared RTC signals');
            break;
        case 'clearMappings':
            // Broadcast clearMappings message to all cuestations
            cuestationWS.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        address: '/cuepernova/cuestation/clearMappings',
                        args: []
                    }));
                }
            });
            console.log('Sent clearMappings to all cuestations');
            break;
        case 'resetMapping':
            // Reset mapping for specific cuestation
            const targetCuestation = message.args && message.args[0];
            if (targetCuestation) {
                cuestationWS.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN && client.cuestationName === targetCuestation) {
                        client.send(JSON.stringify({
                            address: '/cuepernova/cuestation/clearMappings',
                            args: []
                        }));
                    }
                });
                console.log(`Sent clearMappings to cuestation: ${targetCuestation}`);
            }
            break;
        default:
            console.log(`No handler for system command: ${command}`);
    }
}
// Setup OSC server for QLab integration
let udpPort; // osc types not available
export function initOSCServer(port = 57121) {
    udpPort = new osc.UDPPort({
        localAddress: "0.0.0.0",
        localPort: port
    });
    udpPort.on("ready", function () {
        const ipAddresses = getIPAddresses();
        console.log("Listening for OSC over UDP:");
        ipAddresses.forEach((address) => {
            console.log(` - ${address}:${udpPort.options.localPort}`);
        });
    });
    udpPort.on("message", function (oscMessage) {
        console.log('OSC message received:', JSON.stringify(oscMessage, null, 2));
        const pathParts = oscMessage.address.split('/');
        const namespace = pathParts[1];
        const subNamespace = pathParts[2];
        if (namespace === 'cuepernova') {
            switch (subNamespace) {
                case 'cuestation':
                    // Broadcast to all cuestation clients
                    cuestationWS.clients.forEach((client) => {
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
        }
        else {
            console.log(`No OSC handler for namespace: ${namespace}`);
        }
    });
    udpPort.on("error", function (err) {
        console.error('OSC error:', err);
    });
    udpPort.open();
}
// Export WebSocket upgrade handler
export const wsUpgrade = function (request, socket, head) {
    const pathname = url.parse(request.url || '').pathname;
    if (pathname === '/cuestation') {
        cuestationWS.handleUpgrade(request, socket, head, function done(ws) {
            cuestationWS.emit('connection', ws, request);
        });
    }
    else if (pathname === '/control') {
        controlWS.handleUpgrade(request, socket, head, function done(ws) {
            controlWS.emit('connection', ws, request);
        });
    }
    else {
        socket.destroy();
    }
};
export const sendControlMessage = function (message) {
    controlWS.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
};
