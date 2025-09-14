/**
 * Centralized WebSocket management with TypeScript safety
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'node:http';
import { Duplex } from 'node:stream';
import crypto from 'node:crypto';
const uuidv4 = () => crypto.randomUUID();
import url from 'node:url';
import { 
  TypedWebSocket, 
  WebSocketClient,
  WebSocketMessage,
  OSCMessage,
  SystemMessage
} from '../types/index.js';
import { 
  validateWebSocketMessage,
  isSystemMessage,
  safeValidate,
  WebSocketMessageSchema
} from '../types/validation.js';

export interface WebSocketManagerOptions {
  maxClients?: number;
  heartbeatInterval?: number;
  enableLogging?: boolean;
}

export type MessageHandler = (message: WebSocketMessage, client: WebSocketClient) => void | Promise<void>;
export type ConnectionHandler = (client: WebSocketClient) => void;
export type DisconnectionHandler = (client: WebSocketClient) => void;

interface MessageRoute {
  pattern: RegExp;
  handler: MessageHandler;
  namespace?: string;
}

export class WebSocketManager {
  private cuestationServer: WebSocketServer;
  private controlServer: WebSocketServer;
  private cueballServer: WebSocketServer;
  private cuestationClients = new Map<string, WebSocketClient>();
  private controlClients = new Map<string, WebSocketClient>();
  private cueballClients = new Map<string, WebSocketClient>();
  private messageRoutes: MessageRoute[] = [];
  private connectionHandlers = new Set<ConnectionHandler>();
  private disconnectionHandlers = new Set<DisconnectionHandler>();
  private options: Required<WebSocketManagerOptions>;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(options: WebSocketManagerOptions = {}) {
    this.options = {
      maxClients: options.maxClients ?? 100,
      heartbeatInterval: options.heartbeatInterval ?? 30000,
      enableLogging: options.enableLogging ?? true
    };

    // Create WebSocket servers
    this.cuestationServer = new WebSocketServer({ noServer: true });
    this.controlServer = new WebSocketServer({ noServer: true });
    this.cueballServer = new WebSocketServer({ noServer: true });

    this.setupServers();
    this.startHeartbeat();
    this.setupDefaultRoutes();
  }

  // ============================================
  // Server Setup
  // ============================================

  private setupServers(): void {
    // Cuestation server
    this.cuestationServer.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      const params = url.parse(request.url || '', true).query;
      const name = (params.name as string) || `cuestation-${uuidv4()}`;
      
      const typedWs = ws as any as TypedWebSocket;
      typedWs.id = uuidv4();
      typedWs.type = 'cuestation';
      typedWs.cuestationName = name;
      typedWs.lastActivity = Date.now();

      const client: WebSocketClient = {
        id: typedWs.id,
        socket: typedWs,
        type: 'cuestation',
        name
      };

      this.cuestationClients.set(client.id, client);
      this.log(`Cuestation connected: ${name} (${client.id})`);
      
      this.setupClientHandlers(client);
      this.notifyConnectionHandlers(client);
    });

    // Control server
    this.controlServer.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      const typedWs = ws as any as TypedWebSocket;
      typedWs.id = uuidv4();
      typedWs.type = 'control';
      typedWs.lastActivity = Date.now();

      const client: WebSocketClient = {
        id: typedWs.id,
        socket: typedWs,
        type: 'control',
        name: `control-${typedWs.id}`
      };

      this.controlClients.set(client.id, client);
      this.log(`Control panel connected: ${client.id}`);
      
      this.setupClientHandlers(client);
      this.notifyConnectionHandlers(client);
    });

    // Cueball server
    this.cueballServer.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      const params = url.parse(request.url || '', true).query;
      const name = (params.name as string) || `cueball-${uuidv4()}`;
      
      const typedWs = ws as any as TypedWebSocket;
      typedWs.id = uuidv4();
      typedWs.type = 'cueball';
      typedWs.cueballName = name;
      typedWs.lastActivity = Date.now();

      const client: WebSocketClient = {
        id: typedWs.id,
        socket: typedWs,
        type: 'cueball',
        name
      };

      this.cueballClients.set(client.id, client);
      this.log(`Cueball connected: ${name} (${client.id})`);
      
      this.setupClientHandlers(client);
      this.notifyConnectionHandlers(client);
    });
  }

  private setupClientHandlers(client: WebSocketClient): void {
    const { socket } = client;

    // Message handler
    (socket as any).on('message', async (data: Buffer | ArrayBuffer | Buffer[]) => {
      try {
        // Parse and validate message
        const rawMessage = JSON.parse(data.toString());
        const validation = safeValidate(WebSocketMessageSchema, rawMessage);
        
        if (!validation.success) {
          this.sendError(client, `Invalid message format: ${validation.error}`);
          return;
        }

        const message = validation.data;
        message.timestamp = Date.now();
        message.source = client.type === 'control' ? 'control' : 'system';

        // Update activity
        socket.lastActivity = Date.now();

        // Route the message
        await this.routeMessage(message, client);
      } catch (error) {
        this.log(`Error processing message from ${client.id}: ${error}`, 'error');
        this.sendError(client, 'Message processing failed');
      }
    });

    // Pong handler for heartbeat
    (socket as any).on('pong', () => {
      socket.lastActivity = Date.now();
    });

    // Close handler
    (socket as any).on('close', () => {
      this.handleClientDisconnection(client);
    });

    // Error handler
    (socket as any).on('error', (error: Error) => {
      this.log(`WebSocket error for ${client.id}: ${error.message}`, 'error');
      this.handleClientDisconnection(client);
    });
  }

  private handleClientDisconnection(client: WebSocketClient): void {
    if (client.type === 'cuestation') {
      this.cuestationClients.delete(client.id);
      this.log(`Cuestation disconnected: ${client.name} (${client.id})`);
    } else if (client.type === 'control') {
      this.controlClients.delete(client.id);
      this.log(`Control panel disconnected: ${client.id}`);
    } else if (client.type === 'cueball') {
      this.cueballClients.delete(client.id);
      this.log(`Cueball disconnected: ${client.name} (${client.id})`);
    }
    
    this.notifyDisconnectionHandlers(client);
  }

  // ============================================
  // Message Routing
  // ============================================

  public addRoute(pattern: string | RegExp, handler: MessageHandler, namespace?: string): void {
    const route: MessageRoute = {
      pattern: typeof pattern === 'string' ? new RegExp(pattern) : pattern,
      handler,
      namespace
    };
    this.messageRoutes.push(route);
  }

  private async routeMessage(message: WebSocketMessage, client: WebSocketClient): Promise<void> {
    let handled = false;

    for (const route of this.messageRoutes) {
      if (route.pattern.test(message.address)) {
        try {
          await route.handler(message, client);
          handled = true;
          
          // Continue routing if not exclusive
          if (!route.namespace || route.namespace !== 'exclusive') {
            continue;
          }
          break;
        } catch (error) {
          this.log(`Route handler error: ${error}`, 'error');
        }
      }
    }

    if (!handled) {
      this.log(`No handler for message: ${message.address}`);
    }
  }

  private setupDefaultRoutes(): void {
    // Cuestation-specific mapping update route
    this.addRoute(/^\/cuepernova\/cuestation\/([^\/]+)\/mapping-update$/, (message, client) => {
      if (client.type === 'control') {
        // Extract cuestation name from address
        const match = message.address.match(/^\/cuepernova\/cuestation\/([^\/]+)\/mapping-update$/);
        if (match && match[1]) {
          const cuestationName = match[1];
          // Send mapping update to specific cuestation
          const targetCuestation = this.findCuestationByName(cuestationName);
          if (targetCuestation) {
            this.sendToClient(targetCuestation, message);
            this.log(`Sent mapping update to cuestation: ${cuestationName}`);
          } else {
            this.log(`Cuestation not found: ${cuestationName}`, 'warn');
          }
        }
      }
    });

    // Cueball-specific route
    this.addRoute(/^\/cuepernova\/cueball\//, (message, client) => {
      // Messages to cueballs can come from control or cuestations
      if (client.type === 'control' || client.type === 'cuestation') {
        // Check if targeting specific cueball
        const match = message.address.match(/^\/cuepernova\/cueball\/([^\/]+)\//); 
        if (match && match[1]) {
          const cueballName = match[1];
          const targetCueball = this.findCueballByName(cueballName);
          if (targetCueball) {
            this.sendToClient(targetCueball, message);
            this.log(`Sent message to cueball: ${cueballName}`);
          } else {
            this.log(`Cueball not found: ${cueballName}`, 'warn');
          }
        } else {
          // Broadcast to all cueballs
          this.broadcastToCueballs(message);
        }
      }
    });

    // Cuestation broadcast route (general)
    this.addRoute(/^\/cuepernova\/cuestation\//, (message, client) => {
      if (client.type === 'control') {
        this.broadcastToCuestations(message);
      }
    });

    // System message route
    this.addRoute(/^\/cuepernova\/system\//, async (message, client) => {
      if (isSystemMessage(message)) {
        await this.handleSystemMessage(message as SystemMessage);
      }
    });
  }

  private async handleSystemMessage(message: SystemMessage): Promise<void> {
    switch (message.command) {
      case 'clear-rtc':
        // Clear RTC signals (implement based on your RTC logic)
        this.log('Clearing RTC signals');
        break;
        
      case 'clearMappings':
        this.broadcastToCuestations({
          address: '/cuepernova/cuestation/clearMappings',
          args: []
        });
        break;
        
      case 'resetMapping':
        const targetName = message.args[0] as string;
        if (targetName) {
          const target = this.findCuestationByName(targetName);
          if (target) {
            this.sendToClient(target, {
              address: '/cuepernova/cuestation/clearMappings',
              args: []
            });
          }
        }
        break;
    }
  }

  // ============================================
  // Broadcasting
  // ============================================

  public broadcastToCuestations(message: WebSocketMessage): void {
    const serialized = JSON.stringify(message);
    let count = 0;
    
    this.cuestationClients.forEach(client => {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(serialized);
        count++;
      }
    });
    
    this.log(`Broadcast to ${count} cuestations: ${message.address}`);
  }

  public broadcastToControl(message: WebSocketMessage): void {
    const serialized = JSON.stringify(message);
    let count = 0;
    
    this.controlClients.forEach(client => {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(serialized);
        count++;
      }
    });
    
    this.log(`Broadcast to ${count} control panels: ${message.address}`);
  }

  public broadcastToCueballs(message: WebSocketMessage): void {
    const serialized = JSON.stringify(message);
    let count = 0;
    
    this.cueballClients.forEach(client => {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(serialized);
        count++;
      }
    });
    
    this.log(`Broadcast to ${count} cueballs: ${message.address}`);
  }

  public broadcastToAll(message: WebSocketMessage): void {
    this.broadcastToCuestations(message);
    this.broadcastToControl(message);
  }

  public sendToClient(client: WebSocketClient, message: WebSocketMessage): void {
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(JSON.stringify(message));
    }
  }

  public sendToCuestation(name: string, message: WebSocketMessage): boolean {
    const client = this.findCuestationByName(name);
    if (client) {
      this.sendToClient(client, message);
      return true;
    }
    return false;
  }

  public sendToCueball(name: string, message: WebSocketMessage): boolean {
    const client = this.findCueballByName(name);
    if (client) {
      this.sendToClient(client, message);
      return true;
    }
    return false;
  }

  private sendError(client: WebSocketClient, error: string): void {
    this.sendToClient(client, {
      address: '/error',
      args: [error]
    });
  }

  // ============================================
  // Client Management
  // ============================================

  public getCuestations(): WebSocketClient[] {
    return Array.from(this.cuestationClients.values());
  }

  public getControlPanels(): WebSocketClient[] {
    return Array.from(this.controlClients.values());
  }

  public getCueballs(): WebSocketClient[] {
    return Array.from(this.cueballClients.values());
  }

  public getAllClients(): WebSocketClient[] {
    return [...this.getCuestations(), ...this.getControlPanels(), ...this.getCueballs()];
  }

  public findCuestationByName(name: string): WebSocketClient | undefined {
    return Array.from(this.cuestationClients.values())
      .find(client => client.name === name);
  }

  public findCueballByName(name: string): WebSocketClient | undefined {
    return Array.from(this.cueballClients.values())
      .find(client => client.name === name);
  }

  public disconnectClient(clientId: string): boolean {
    const cuestation = this.cuestationClients.get(clientId);
    if (cuestation) {
      cuestation.socket.close();
      this.cuestationClients.delete(clientId);
      return true;
    }
    
    const control = this.controlClients.get(clientId);
    if (control) {
      control.socket.close();
      this.controlClients.delete(clientId);
      return true;
    }
    
    const cueball = this.cueballClients.get(clientId);
    if (cueball) {
      cueball.socket.close();
      this.cueballClients.delete(clientId);
      return true;
    }
    
    return false;
  }

  // ============================================
  // Heartbeat & Health
  // ============================================

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = this.options.heartbeatInterval * 2;
      
      // Check cuestations
      this.cuestationClients.forEach((client, id) => {
        if (now - client.socket.lastActivity > timeout) {
          this.log(`Cuestation timeout: ${client.name}`);
          this.disconnectClient(id);
        } else {
          (client.socket as any).ping();
        }
      });
      
      // Check control panels
      this.controlClients.forEach((client, id) => {
        if (now - client.socket.lastActivity > timeout) {
          this.log(`Control panel timeout: ${id}`);
          this.disconnectClient(id);
        } else {
          (client.socket as any).ping();
        }
      });
      
      // Check cueballs
      this.cueballClients.forEach((client, id) => {
        if (now - client.socket.lastActivity > timeout) {
          this.log(`Cueball timeout: ${client.name}`);
          this.disconnectClient(id);
        } else {
          (client.socket as any).ping();
        }
      });
    }, this.options.heartbeatInterval);
  }


  // ============================================
  // Event Handlers
  // ============================================

  public onConnection(handler: ConnectionHandler): void {
    this.connectionHandlers.add(handler);
  }

  public onDisconnection(handler: DisconnectionHandler): void {
    this.disconnectionHandlers.add(handler);
  }

  private notifyConnectionHandlers(client: WebSocketClient): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(client);
      } catch (error) {
        this.log(`Connection handler error: ${error}`, 'error');
      }
    });
  }

  private notifyDisconnectionHandlers(client: WebSocketClient): void {
    this.disconnectionHandlers.forEach(handler => {
      try {
        handler(client);
      } catch (error) {
        this.log(`Disconnection handler error: ${error}`, 'error');
      }
    });
  }

  // ============================================
  // HTTP Upgrade Handler
  // ============================================

  public handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): void {
    const pathname = url.parse(request.url || '').pathname;
    
    if (pathname === '/cuestation') {
      this.cuestationServer.handleUpgrade(request, socket, head, (ws) => {
        this.cuestationServer.emit('connection', ws, request);
      });
    } else if (pathname === '/control') {
      this.controlServer.handleUpgrade(request, socket, head, (ws) => {
        this.controlServer.emit('connection', ws, request);
      });
    } else if (pathname === '/cueball') {
      this.cueballServer.handleUpgrade(request, socket, head, (ws) => {
        this.cueballServer.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  }

  // ============================================
  // OSC Integration
  // ============================================

  public handleOSCMessage(oscMessage: OSCMessage): void {
    const wsMessage: WebSocketMessage = {
      address: oscMessage.address,
      args: oscMessage.args,
      timestamp: Date.now(),
      source: 'osc'
    };
    
    // Route based on OSC address
    const pathParts = oscMessage.address.split('/');
    const namespace = pathParts[1];
    const subNamespace = pathParts[2];
    
    if (namespace === 'cuepernova') {
      switch (subNamespace) {
        case 'cuestation':
          this.broadcastToCuestations(wsMessage);
          break;
        case 'cueball':
          this.broadcastToCueballs(wsMessage);
          break;
        case 'system':
          if (isSystemMessage(wsMessage)) {
            this.handleSystemMessage(wsMessage as SystemMessage);
          }
          break;
        default:
          this.log(`Unknown OSC sub-namespace: ${subNamespace}`);
      }
    }
  }

  // ============================================
  // Utilities
  // ============================================

  private log(message: string, level: 'info' | 'error' | 'warn' = 'info'): void {
    if (!this.options.enableLogging) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[WebSocketManager ${timestamp}]`;
    
    switch (level) {
      case 'error':
        console.error(`${prefix} ERROR: ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} WARN: ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  public getStatus(): {
    cuestations: number;
    controlPanels: number;
    cueballs: number;
    totalConnections: number;
    uptime: number;
  } {
    return {
      cuestations: this.cuestationClients.size,
      controlPanels: this.controlClients.size,
      cueballs: this.cueballClients.size,
      totalConnections: this.cuestationClients.size + this.controlClients.size + this.cueballClients.size,
      uptime: process.uptime()
    };
  }

  public shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Close all connections
    this.getAllClients().forEach(client => {
      client.socket.close();
    });
    
    this.cuestationClients.clear();
    this.controlClients.clear();
    this.cueballClients.clear();
    
    this.cuestationServer.close();
    this.controlServer.close();
    this.cueballServer.close();
    
    this.log('WebSocketManager shutdown complete');
  }
}