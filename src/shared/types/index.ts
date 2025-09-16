/**
 * Consolidated type definitions for Cuepernova
 * Single source of truth for all TypeScript types
 */

// ============================================
// Core Domain Types
// ============================================

export type CueType = 'osc' | 'cueball' | 'video' | 'image' | 'message' | 'clear';

export type CueArgument = string | number | boolean;

export interface Cue {
  id: string;
  number: string;
  name: string;
  type: CueType;
  args: CueArgument[];
  notes?: string;
  // OSC compatibility fields
  address?: string;
  group?: string;
}

export interface Cuestation {
  id: string;
  name: string;
  description?: string;
  showtimeResolution: {
    width: number;
    height: number;
  };
  mapping?: MaptasticMapping;
  // Runtime state (not persisted)
  connected?: boolean;
  currentScreen?: string;
  lastUpdate?: number;
}

export interface MaptasticMapping {
  layers?: Array<{
    targetPoints: number[][];
    sourcePoints: number[][];
  }>;
}

// ============================================
// Configuration Types
// ============================================

export interface Config {
  oscPort: number;
  httpPort: number;
  httpsPort: number;
  defaultCuestation?: string;
}

export interface ServerConfig extends Config {
  sslCert?: string;
  sslKey?: string;
  paths: {
    cueballs: string;
    media: string;
    nodeModules: string;
  };
}

// ============================================
// Database Schema
// ============================================

export interface DatabaseSchema {
  cues: Cue[];
  cuestations: Cuestation[];
  config: Config;
}

// ============================================
// Message Types
// ============================================

export interface WebSocketMessage {
  address: string;
  args: CueArgument[];
  timestamp?: number;
  source?: 'osc' | 'control' | 'system';
}

export interface OSCMessage {
  address: string;
  args: any[];
}

export interface SystemMessage extends WebSocketMessage {
  command: 'clear-rtc' | 'clearMappings' | 'resetMapping';
}

// ============================================
// WebSocket Types
// ============================================

import { WebSocket } from 'ws';

export interface TypedWebSocket extends WebSocket {
  id: string;
  type: 'cuestation' | 'control' | 'cueball';
  cuestationName?: string;
  cueballName?: string;
  lastActivity: number;
}

export interface WebSocketClient {
  id: string;
  socket: TypedWebSocket;
  type: 'cuestation' | 'control' | 'cueball';
  name?: string;
}

// ============================================
// IPC Types (Electron)
// ============================================

export interface ElectronAPI {
  // Directory operations
  selectDirectory: () => Promise<string | null>;
  initializeProject: (directory: string) => Promise<void>;
  
  // File operations
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  
  // Data operations
  getCues: () => Promise<Cue[]>;
  saveCues: (cues: Cue[]) => Promise<void>;
  getCuestations: () => Promise<Cuestation[]>;
  saveCuestations: (cuestations: Cuestation[]) => Promise<void>;
  getConfig: () => Promise<Config>;
  saveConfig: (config: Config) => Promise<void>;
  
  // Server operations
  startServer: () => Promise<void>;
  stopServer: () => Promise<void>;
  getServerStatus: () => Promise<boolean>;
  onServerStatusChanged: (callback: (status: boolean) => void) => void;
  
  // Window operations
  openCuestationWindow: (name: string) => Promise<void>;
  
  // Certificate operations
  downloadCACert: () => Promise<void>;
  
  // Cueball operations
  createCueball: (name: string, template: string) => Promise<void>;
  getCueballTemplates: () => Promise<string[]>;
}

// ============================================
// Command Line Types
// ============================================

export interface CommandOptions {
  port?: string;
  oscPort?: string;
  cert?: string;
  key?: string;
  config?: string;
}

// ============================================
// Validation Schemas (for use with Zod)
// ============================================

export const CUE_TYPES = [
  'osc', 'cueball', 'video', 'image', 'message', 'clear'
] as const;

export const SYSTEM_COMMANDS = [
  'clear-rtc', 'clearMappings', 'resetMapping'
] as const;

// ============================================
// Utility Types
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncResult<T> = Promise<{ success: true; data: T } | { success: false; error: string }>;

// ============================================
// Event Types
// ============================================

export interface CuepernovaEvent {
  type: 'cue' | 'cuestation' | 'system' | 'error';
  payload: any;
  timestamp: number;
}

export interface ErrorEvent extends CuepernovaEvent {
  type: 'error';
  payload: {
    message: string;
    stack?: string;
    code?: string;
  };
}