/**
 * Shared type definitions for Cuepernova
 * These types are used by both frontend and backend
 */

export interface CuepernovaConfig {
  server?: {
    httpPort?: number;
    httpsPort?: number;
    ssl?: {
      cert?: string;
      key?: string;
    } | null;
  };
  osc?: {
    port?: number;
  };
  paths?: {
    cueballs?: string;
    media?: string;
    nodeModules?: string;
  };
}

export interface Cue {
  name: string;
  address: string;
  args?: (string | number | boolean)[];
  group?: string;
}

export interface CueList {
  cues: Cue[];
}

export interface WebSocketMessage {
  address: string;
  args?: (string | number | boolean)[];
}

export interface OSCMessage {
  address: string;
  args: any[];
}

export interface CuestationState {
  name: string;
  connected: boolean;
  currentScreen?: string;
  lastUpdate?: number;
}

export interface ProjectionMapping {
  id: string;
  cuestationName: string;
  corners: Array<{ x: number; y: number }>;
  transform: string;
}

export type ScreenType = 
  | 'black' 
  | 'white' 
  | 'freeze' 
  | 'debug' 
  | 'message' 
  | 'video' 
  | 'image' 
  | 'cueball'
  | 'clear';

export interface CommandOptions {
  port?: string;
  oscPort?: string;
  cert?: string;
  key?: string;
  config?: string;
}

export interface ServerConfig {
  httpPort: number;
  httpsPort: number;
  oscPort: number;
  sslCert?: string;
  sslKey?: string;
  paths: {
    cueballs: string;
    media: string;
    nodeModules: string;
  };
}