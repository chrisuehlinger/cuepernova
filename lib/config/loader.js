import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

export async function loadConfig(configPath) {
  const defaults = {
    server: {
      httpPort: 8080,
      httpsPort: 8443,
      ssl: null
    },
    osc: {
      port: 57121
    },
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
    const config = JSON.parse(configContent);

    // Merge with defaults
    return {
      server: {
        ...defaults.server,
        ...config.server,
        ssl: config.server?.ssl || defaults.server.ssl
      },
      osc: {
        ...defaults.osc,
        ...config.osc
      },
      paths: {
        ...defaults.paths,
        ...config.paths
      }
    };
  } catch (error) {
    console.error(`Error loading config from ${configPath}:`, error.message);
    return defaults;
  }
}

export function mergeWithCliOptions(config, options) {
  const merged = { ...config };

  if (options.port) {
    merged.server.httpPort = parseInt(options.port);
  }
  
  if (options.httpsPort) {
    merged.server.httpsPort = parseInt(options.httpsPort);
  }
  
  if (options.oscPort) {
    merged.osc.port = parseInt(options.oscPort);
  }

  if (options.cert && options.key) {
    merged.server.ssl = {
      cert: options.cert,
      key: options.key
    };
  }

  return merged;
}