import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';
import { register } from 'ts-node';

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
      'cuepernova.config.ts',
      'cuepernova.config.js',
      'cuepernova.config.mjs'
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
    let config;
    
    if (configPath.endsWith('.ts')) {
      // Register ts-node for TypeScript support
      register({
        transpileOnly: true,
        compilerOptions: {
          module: 'esnext',
          target: 'es2020',
          allowSyntheticDefaultImports: true,
          esModuleInterop: true
        }
      });
    }

    const configUrl = pathToFileURL(resolve(configPath)).href;
    const module = await import(configUrl);
    config = module.default || module;

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