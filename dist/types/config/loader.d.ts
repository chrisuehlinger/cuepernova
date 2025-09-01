import { CommandOptions, ServerConfig } from '../types/index.js';
export declare function loadConfig(configPath?: string): Promise<ServerConfig>;
export declare function mergeWithCliOptions(config: ServerConfig, options: CommandOptions): ServerConfig;
