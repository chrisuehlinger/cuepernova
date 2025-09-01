import { existsSync, readFileSync } from 'fs';
import { CuepernovaConfig, CommandOptions, ServerConfig } from '../types/index.js';

export async function loadConfig(configPath?: string): Promise<ServerConfig> {
  const defaults: ServerConfig = {
    httpPort: 8080,
    httpsPort: 8443,
    oscPort: 57121,
    paths: {
      cueballs: './cueballs',
      media: './media',
      nodeModules: './node_modules'
    }
  };

  if (!configPath) {
    // Look for default config files
    const possibleConfigs = [
      'cuepernova.config.json',
      'cuepernova.json'
    ];
    
    for (const file of possibleConfigs) {
      if (existsSync(file)) {
        configPath = file;
        break;
      }
    }
  }

  if (!configPath || !existsSync(configPath)) {
    return defaults;
  }

  try {
    const configContent = readFileSync(configPath, 'utf8');
    const config: CuepernovaConfig = JSON.parse(configContent);

    // Merge with defaults and convert to ServerConfig format
    const merged: ServerConfig = {
      httpPort: config.server?.httpPort || defaults.httpPort,
      httpsPort: config.server?.httpsPort || defaults.httpsPort,
      oscPort: config.osc?.port || defaults.oscPort,
      paths: {
        cueballs: config.paths?.cueballs || defaults.paths.cueballs,
        media: config.paths?.media || defaults.paths.media,
        nodeModules: config.paths?.nodeModules || defaults.paths.nodeModules
      }
    };

    if (config.server?.ssl?.cert && config.server?.ssl?.key) {
      merged.sslCert = config.server.ssl.cert;
      merged.sslKey = config.server.ssl.key;
    }

    return merged;
  } catch (error: any) {
    console.error(`Error loading config from ${configPath}:`, error.message);
    return defaults;
  }
}

export function mergeWithCliOptions(config: ServerConfig, options: CommandOptions): ServerConfig {
  const merged = { ...config };

  if (options.port) {
    merged.httpPort = parseInt(options.port);
  }
  
  if (options.oscPort) {
    merged.oscPort = parseInt(options.oscPort);
  }

  if (options.cert && options.key) {
    merged.sslCert = options.cert;
    merged.sslKey = options.key;
  }

  return merged;
}