import { IncomingMessage } from 'node:http';
import { Duplex } from 'node:stream';
import { WebSocketMessage } from '../types/index.js';
export declare function initOSCServer(port?: number): void;
export declare const wsUpgrade: (request: IncomingMessage, socket: Duplex, head: Buffer) => void;
export declare const sendControlMessage: (message: WebSocketMessage) => void;
