/**
 * Type definitions for Cuepernova configuration
 * 
 * These types are provided for reference and IDE support.
 * The actual configuration file should be JSON (cuepernova.config.json).
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