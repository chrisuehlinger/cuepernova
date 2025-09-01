# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Cuepernova is an open source theater projection control system, now distributed as an npm package. It provides multi-display control, OSC integration for QLab, WebSocket communication for real-time updates, WebRTC support for peer-to-peer streaming, and projection mapping capabilities.

**The codebase is written in TypeScript** with a build process that compiles to JavaScript for distribution. User projects use plain JavaScript without requiring a build step.

## Package Architecture

Cuepernova is now an npm package that can be installed and used in any project:

```bash
npm install -g cuepernova
npx cuepernova [command]
```

## Common Development Commands

### For Package Development
```bash
# Build TypeScript to JavaScript
npm run build

# Clean build artifacts
npm run clean

# Build and run in development
npm run dev

# Link package locally for testing
npm link

# Test commands after building
cuepernova init          # Initialize a new project
cuepernova start         # Start the server
cuepernova cueball "Name" # Create a new cueball
```

### For End Users
```bash
# Initialize a new project
npx cuepernova init

# Start the server
npx cuepernova start

# Create a new cueball/effect
npx cuepernova cueball "My Effect Name"
# Creates: cueballs/my-effect-name.html
#          css/my-effect-name.css
#          js/my-effect-name.js
```

### SSL Certificate Setup (for WebRTC/HTTPS)
```bash
# Install mkcert first: https://github.com/FiloSottile/mkcert#installation
mkcert -install
mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost $(hostname) $(hostname).local
```

## Architecture Overview

### Package Architecture
- **Language**: TypeScript (compiled to JavaScript for distribution)
- **Module System**: ES Modules (ESM) with `node:` prefix for built-ins
- **CLI Entry Point**: `src/cli.ts` → `dist/cli.js` - Commander-based CLI
- **Server Entry**: `src/server/app.ts` → `dist/server/app.js` - Express server
- **Configuration**: JSON config file (cuepernova.config.json)
- **Static Files**: Package serves built-in pages from `static/`, user content from project directories
- **Type Definitions**: Shared types in `src/types/index.ts` for frontend/backend consistency

### Server Architecture
- **Express Server**: Default ports 8080 (HTTP) and 8443 (HTTPS)
- **WebSocket Endpoints**:
  - `/orbital` - Display/projection devices
  - `/control` - Control panel interfaces
- **OSC Server**: UDP port 57121 for QLab integration (configurable)
- **WebRTC Signaling**: Via `/signalmaster` routes

### Frontend Architecture
- **Development**: TypeScript compiled to JavaScript
- **User Projects**: Plain JavaScript with ES modules (no build required)
- **Core Pages** (served from package):
  - `orbital.html` - Display device interface (projectors/monitors)
  - `control.html` - Central control panel
  - `mapping.html` - Projection mapping interface
- **Custom Cueballs**: Located in user's `cueballs/` directory
- **Communication**: WebSocket connections for real-time updates

### Message Flow
1. **OSC Commands** (port 57121) → `sockets.js` → WebSocket broadcast to orbitals
2. **Control Panel** → WebSocket → `sockets.js` → Orbital clients
3. **WebRTC Signaling** → `signalmaster.js` → Peer connections

### OSC Command Structure
- `/cuepernova/orbital/showScreen/[screenType]` - Display content on orbitals
- `/cuepernova/orbital/clearScreen` - Clear all displays
- `/cuepernova/orbital/fadeScreen [duration]` - Fade out displays
- `/cuepernova/orbital/refreshScreen` - Refresh orbital pages
- `/cuepernova/system/clear-rtc` - Clear RTC signals
- `/cuepernova/system/clearMappings` - Clear all projection mappings
- `/cuepernova/system/resetMapping [orbitalName]` - Reset mapping for specific orbital

### Screen Types
Built-in screen types handled by `orbital.js`:
- `black`, `white` - Solid colors
- `freeze` - Flashing message
- `debug` - Connection status
- `message [text] [subtitle]` - Text display
- `video [path] [loop]` - Video playback
- `image [path]` - Image display
- `cueball [cueballname] [args...]` - Custom cueball from `/cueballs`

## Project Structure

### Source Structure (TypeScript)
```
cuepernova/
├── src/                   # TypeScript source files
│   ├── cli.ts            # CLI entry point
│   ├── server/
│   │   ├── app.ts        # Express server
│   │   ├── sockets.ts    # WebSocket & OSC handling
│   │   └── signalmaster.ts # WebRTC signaling
│   ├── commands/
│   │   ├── start.ts      # Start server command
│   │   ├── init.ts       # Initialize project
│   │   └── cueball.ts    # Scaffold cueball
│   ├── config/
│   │   └── loader.ts     # Config file loader
│   ├── routes/
│   │   └── index.ts      # Main routes
│   ├── utils/
│   │   └── rtc-signals.ts # RTC signal storage
│   └── types/
│       └── index.ts      # Shared TypeScript definitions
├── static-src/           # TypeScript source for frontend
│   └── js/
│       ├── control.ts    # Control panel script
│       ├── orbital.ts    # Orbital display script
│       └── mapping.ts    # Mapping interface script
├── dist/                 # Compiled JavaScript (generated)
├── static/               # Static files including compiled JS
│   ├── orbital.html      # Display interface
│   ├── control.html      # Control panel
│   ├── mapping.html      # Projection mapping
│   ├── css/              # Core stylesheets
│   └── js/               # Compiled + vendor scripts
├── templates/            # Templates for scaffolding
├── views/                # Pug templates (error pages)
└── build.js              # Build script
```

### User Project Structure (after `cuepernova init`)
```
user-project/
├── cueballs/              # Custom cueball pages
├── media/                 # Media assets
├── css/                   # Cueball stylesheets
├── js/                    # Cueball scripts
├── node_modules/          # Project dependencies
├── cues.json              # Show cue list
└── cuepernova.config.json # Configuration file
```

### Cues.json

The `cues.json` file stores the show's cue list and is loaded by the control panel. It's served statically from the project root at `/cues.json`. The control panel fetches this file on load and includes a reload button for live updates during tech rehearsals.

## Key Implementation Details

### Adding New Screen Types
Edit `static-src/js/orbital.ts` and add handler to `cueHandlers` object:
```javascript
cueHandlers['mytype'] = function(args) {
  // args[0], args[1], etc. from OSC message
}
```

### Adding New OSC Commands
Edit `src/server/sockets.ts` `handleSystemMessage()` function:
```javascript
case 'mycommand':
  // Handle /cuepernova/system/mycommand
  break;
```

### WebSocket Message Format
```javascript
{
  "address": "/cuepernova/orbital/showScreen/video",
  "args": ["path/to/video.mp4", "true"]
}
```

### URL Parameters for Orbitals
- `?name=projector1` - Unique identifier for each orbital
- Cueballs receive arguments as `?arg1=value&arg2=value&arg3=value`

## Development Tips

- Development mode uses ports 8080/8443, production uses 80/443
- WebRTC features require HTTPS (self-signed certs work locally)
- Each orbital needs a unique name parameter
- Media files go in `public/media/`
- The mapping interface saves to browser localStorage
- Console logs OSC messages for debugging