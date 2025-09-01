# Cuepernova NPM Package Implementation Plan

## Overview
Transform Cuepernova from a standalone application into an npm package with CLI that can be installed and used in any project.

## Architecture Changes

### Package Structure
```
cuepernova/
├── bin/
│   └── cuepernova.js          # CLI entry point
├── lib/
│   ├── server/
│   │   ├── app.js            # Express server (modified)
│   │   ├── sockets.js        # WebSocket & OSC handling
│   │   └── signalmaster.js   # WebRTC signaling
│   ├── commands/
│   │   ├── start.js          # Start server command
│   │   ├── init.js           # Initialize project
│   │   └── cueball.js        # Scaffold cueball
│   ├── config/
│   │   └── loader.js         # Config file loader
│   └── utils/
│       └── rtc-signals.js    # RTC signal storage
├── templates/
│   ├── init/                 # Templates for init command
│   │   ├── cueballs/
│   │   │   └── example.html
│   │   ├── media/
│   │   │   └── .gitkeep
│   │   └── cuepernova.config.ts
│   └── cueball/              # Templates for cueball scaffold
│       ├── cueball.html
│       ├── cueball.css
│       └── cueball.js
├── static/                   # Built-in static files
│   ├── orbital.html
│   ├── control.html
│   ├── mapping.html
│   ├── css/
│   │   ├── orbital.css
│   │   ├── control.css
│   │   └── mapping.css
│   └── js/
│       ├── orbital.js
│       ├── control.js
│       ├── mapping.js
│       └── shared/
└── package.json

Host Project Structure (after init):
project/
├── cueballs/
├── media/
├── node_modules/
└── cuepernova.config.ts
```

## Implementation Steps

### Phase 1: Restructure Project
- [x] Move server files to lib/server/
- [x] Move static files to static/
- [x] Create bin/ directory for CLI
- [x] Create templates/ directory

### Phase 2: CLI Implementation
- [x] Create CLI entry point with commander.js
- [x] Implement `start` command with flags:
  - --port, -p (default: 8080)
  - --osc-port, -o (default: 57121)
  - --cert (SSL certificate path)
  - --key (SSL key path)
  - --config, -c (config file path)
- [x] Implement `init` command
- [x] Implement `cueball` command

### Phase 3: Config System
- [x] Create TypeScript config interface
- [x] Config loader with TypeScript support (ts-node)
- [x] Merge CLI args with config file
- [x] Config priority: CLI args > config file > defaults

### Phase 4: Server Modifications
- [x] Update paths to serve from:
  - Package's static/ for built-in pages
  - Host's cueballs/ folder
  - Host's media/ folder
  - Host's node_modules/ folder
- [x] Make server exportable as module
- [x] Update WebSocket/OSC to use configurable ports

### Phase 5: Clean Up
- [x] Remove all built-in cueballs from public/cueballs/
- [x] Remove example media files
- [x] Remove startup scripts (replaced by CLI)
- [x] Remove old bin/www entry point

### Phase 6: Package Configuration
- [x] Update package.json:
  - name: "cuepernova"
  - version: "0.0.1"
  - bin: { "cuepernova": "bin/cuepernova.js" }
  - main: "lib/server/app.js"
  - dependencies: add commander, ts-node, etc.
- [x] Add .npmignore if needed

### Phase 7: Documentation
- [x] Update README.md with new usage
- [x] Update CLAUDE.md with new architecture
- [x] Create example config file

## Config File Format (TypeScript)

```typescript
import type { CuepernovaConfig } from 'cuepernova';

const config: CuepernovaConfig = {
  server: {
    httpPort: 8080,
    httpsPort: 8443,
    ssl: {
      cert: './certs/cert.pem',
      key: './certs/key.pem'
    }
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

export default config;
```

## CLI Usage Examples

```bash
# Install globally
npm install -g cuepernova

# Or use with npx
npx cuepernova [command]

# Initialize new project
cuepernova init

# Start server with defaults
cuepernova start

# Start with custom ports
cuepernova start --port 3000 --osc-port 9999

# Start with SSL
cuepernova start --cert ./cert.pem --key ./key.pem

# Start with config file
cuepernova start --config ./my-config.ts

# Create new cueball
cuepernova cueball my-effect
```

## Testing Plan
1. Test npm install locally with `npm link`
2. Test init command creates correct structure
3. Test server starts and serves files correctly
4. Test OSC/WebSocket functionality
5. Test cueball scaffolding
6. Test config file loading
7. Test SSL support