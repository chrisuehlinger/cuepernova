import http from 'node:http';
import https from 'node:https';
import { ServerConfig } from '../types/index.js';
export declare function setupStaticRoutes(config: ServerConfig): void;
interface ServerInstances {
    httpServer: http.Server;
    httpsServer?: https.Server;
}
export default function init(config: ServerConfig): Promise<ServerInstances>;
export {};
