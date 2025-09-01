#!/usr/bin/env node

/**
 * Simple OSC command-line sender for Node.js
 * Usage: ./osc-send.js /path/to/command [args...]
 */

import dgram from 'node:dgram';

// Configuration
const OSC_HOST = process.env.OSC_HOST || 'localhost';
const OSC_PORT = parseInt(process.env.OSC_PORT || '57121');

/**
 * Pad data to 4-byte boundary
 */
function padBuffer(data: Buffer): Buffer {
  const padLength = (4 - (data.length % 4)) % 4;
  if (padLength === 0) return data;
  return Buffer.concat([data, Buffer.alloc(padLength)]);
}

/**
 * Encode OSC string (null-terminated and padded)
 */
function encodeString(str: string): Buffer {
  const buf = Buffer.from(str + '\0', 'utf8');
  return padBuffer(buf);
}

/**
 * Encode OSC float (32-bit big-endian)
 */
function encodeFloat(value: number): Buffer {
  const buf = Buffer.allocUnsafe(4);
  buf.writeFloatBE(value, 0);
  return buf;
}

/**
 * Encode OSC int32 (32-bit big-endian)
 */
function encodeInt32(value: number): Buffer {
  const buf = Buffer.allocUnsafe(4);
  buf.writeInt32BE(value, 0);
  return buf;
}

/**
 * Build OSC message from path and arguments
 */
function buildOSCMessage(path: string, args: (string | number)[] = []): Buffer {
  const buffers: Buffer[] = [];
  
  // Add path
  buffers.push(encodeString(path));
  
  // Build type tag string
  let typeTags = ',';
  const argBuffers: Buffer[] = [];
  
  for (const arg of args) {
    if (typeof arg === 'number') {
      // Check if it's an integer or float
      if (Number.isInteger(arg) && arg >= -2147483648 && arg <= 2147483647) {
        typeTags += 'i';
        argBuffers.push(encodeInt32(arg));
      } else {
        typeTags += 'f';
        argBuffers.push(encodeFloat(arg));
      }
    } else {
      // Treat as string
      typeTags += 's';
      argBuffers.push(encodeString(String(arg)));
    }
  }
  
  // Add type tags
  buffers.push(encodeString(typeTags));
  
  // Add arguments
  buffers.push(...argBuffers);
  
  return Buffer.concat(buffers);
}

/**
 * Send OSC message via UDP
 */
function sendOSC(host: string, port: number, path: string, args: (string | number)[]): void {
  const message = buildOSCMessage(path, args);
  const client = dgram.createSocket('udp4');
  
  client.send(message, 0, message.length, port, host, (err) => {
    if (err) {
      console.error('Error sending OSC:', err);
      process.exit(1);
    }
    
    const argsStr = args.length > 0 ? ` [${args.join(', ')}]` : '';
    console.log(`Sent: ${path}${argsStr} to ${host}:${port}`);
    client.close();
  });
}

/**
 * Parse command line arguments
 */
function parseArgs(argv: string[]): { path: string; args: (string | number)[] } {
  const path = argv[0];
  const args = argv.slice(1).map(arg => {
    // Try to parse as number
    const num = Number(arg);
    if (!isNaN(num) && arg.trim() !== '') {
      return num;
    }
    return arg;
  });
  
  return { path, args };
}

// Main
if (process.argv.length < 3) {
  console.log('Usage: osc-send.js /path/to/command [args...]');
  console.log('');
  console.log('Examples:');
  console.log('  ./osc-send.js /field/scroll/start');
  console.log('  ./osc-send.js /field/scroll/speed 100');
  console.log('  ./osc-send.js /orbital/showScreen/app field');
  console.log('');
  console.log('Environment variables:');
  console.log('  OSC_HOST - Target host (default: localhost)');
  console.log('  OSC_PORT - Target port (default: 57121)');
  process.exit(0);
}

const { path, args } = parseArgs(process.argv.slice(2));

if (!path.startsWith('/')) {
  console.error('Error: OSC path must start with /');
  process.exit(1);
}

sendOSC(OSC_HOST, OSC_PORT, path, args);