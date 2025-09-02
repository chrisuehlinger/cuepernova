# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Cuepernova is an open source theater projection control system, now distributed as an Electron desktop application. It provides multi-display control, OSC integration for QLab, WebSocket communication for real-time updates, WebRTC support for peer-to-peer streaming, and projection mapping capabilities.

**The codebase is written in TypeScript** with:
- Electron main process for desktop integration
- React frontend with Material-UI for the control interface  
- Express server integrated directly in the Electron app
- Automatic SSL certificate generation for secure connections

## Application Architecture

Cuepernova is now a cross-platform Electron application that runs on Windows, macOS, and Linux.

## Common Development Commands

### Development
```bash
# Build Electron and React for production
npm run start

# Run in development mode with hot reload
npm run dev

# Build Electron main process
npm run build:electron

# Build React app
npm run build:react

# Clean all build artifacts
npm run clean

# Build distributable packages
npm run dist
```

### Application Features
- **Directory Picker**: Select or create a project directory on launch
- **Main Screen**: Manage cues and cuestations with full CRUD operations
- **Server Control**: ON/OFF toggle with visual feedback
- **Settings Modal**: Configure OSC, HTTP, and HTTPS ports
- **Cuestation Windows**: Open multiple display windows
- **Automatic SSL**: CA certificate generation and management
- **CA Download**: Easily distribute certificates to other devices

## Architecture Overview

### Electron Architecture  
- **Main Process**: `electron/main.ts` - Handles app lifecycle, windows, IPC
- **Preload Script**: `electron/preload.ts` - Secure bridge between main and renderer
- **IPC Handlers**: `electron/ipc/handlers.ts` - File operations and server control
- **Server Manager**: `electron/server-manager.ts` - Integrated Express server
- **Certificate Manager**: `electron/certificate-manager.ts` - CA and SSL certificate generation

### React Frontend Architecture
- **Entry Point**: `src-react/index.tsx` - React app initialization
- **Main App**: `src-react/App.tsx` - Route and state management
- **Screens**: Directory picker and main control screen
- **Components**: Modular UI components for cues, settings, and cuestations
- **Material-UI**: Dark theme with responsive layout
- **Type Safety**: Full TypeScript support with strict typing

### Server Architecture
- **Express Server**: Default ports 8080 (HTTP) and 8443 (HTTPS)
- **WebSocket Endpoints**:
  - `/cuestation` - Display/projection devices
  - `/control` - Control panel interfaces
- **OSC Server**: UDP port 57121 for QLab integration (configurable)
- **WebRTC Signaling**: Via `/signalmaster` routes

### Frontend Architecture
- **Development**: TypeScript compiled to JavaScript
- **User Projects**: Plain JavaScript with ES modules (no build required)
- **Core Pages** (served from package):
  - `cuestation.html` - Display device interface (projectors/monitors)
  - `control.html` - Central control panel
  - `mapping.html` - Projection mapping interface
- **Custom Cueballs**: Located in user's `cueballs/` directory
- **Communication**: WebSocket connections for real-time updates

### Message Flow
1. **OSC Commands** (port 57121) → `sockets.js` → WebSocket broadcast to cuestations
2. **Control Panel** → WebSocket → `sockets.js` → Cuestation clients
3. **WebRTC Signaling** → `signalmaster.js` → Peer connections

### OSC Command Structure
- `/cuepernova/cuestation/showScreen/[screenType]` - Display content on cuestations
- `/cuepernova/cuestation/clearScreen` - Clear all displays
- `/cuepernova/cuestation/fadeScreen [duration]` - Fade out displays
- `/cuepernova/cuestation/refreshScreen` - Refresh cuestation pages
- `/cuepernova/system/clear-rtc` - Clear RTC signals
- `/cuepernova/system/clearMappings` - Clear all projection mappings
- `/cuepernova/system/resetMapping [cuestationName]` - Reset mapping for specific cuestation

### Screen Types
Built-in screen types handled by `cuestation.js`:
- `black`, `white` - Solid colors
- `freeze` - Flashing message
- `debug` - Connection status
- `message [text] [subtitle]` - Text display
- `video [path] [loop]` - Video playback
- `image [path]` - Image display
- `cueball [cueballname] [args...]` - Custom cueball from `/cueballs`

## Project Structure

### Source Structure
```
cuepernova/
├── electron/              # Electron main process
│   ├── main.ts           # Main entry point
│   ├── preload.ts        # Preload script
│   ├── server-manager.ts # Express server integration
│   ├── certificate-manager.ts # SSL certificate handling
│   └── ipc/
│       └── handlers.ts   # IPC communication handlers
├── src-react/            # React application
│   ├── index.tsx         # React entry point
│   ├── App.tsx           # Main app component
│   ├── screens/
│   │   ├── DirectoryPicker.tsx
│   │   └── MainScreen.tsx
│   ├── components/
│   │   ├── CueList.tsx
│   │   ├── CuestationManager.tsx
│   │   ├── ServerToggle.tsx
│   │   └── SettingsModal.tsx
│   └── types.ts          # TypeScript interfaces
├── src/                  # Server code
│   ├── server/
│   │   ├── sockets.ts    # WebSocket & OSC handling
│   │   └── signalmaster.ts # WebRTC signaling
│   └── types/            # Shared type definitions
├── static/               # Static HTML/CSS/JS files
│   ├── cuestation.html   # Display interface
│   └── mapping.html      # Projection mapping
├── dist-electron/        # Compiled Electron code
├── dist-react/           # Compiled React app
└── release/              # Packaged applications
```

### User Project Structure
```
user-project/
├── cueballs/              # Custom cueball pages
├── media/                 # Media assets  
├── css/                   # Cueball stylesheets
├── js/                    # Cueball scripts
├── .cuepernova/           # Certificate storage (gitignored)
│   ├── ca-cert.pem       # CA certificate (shareable)
│   └── ca-key.pem        # CA private key (keep secure)
├── cues.json              # Show cue list
├── cuestations.json       # Cuestation configurations
├── cuepernova.config.json # App configuration
└── .gitignore            # Excludes .cuepernova/
```

### Data Files

#### cues.json
Stores the show's cue list with structure:
```json
{
  "id": "unique-id",
  "number": "1",
  "name": "Opening",
  "type": "video",
  "args": ["intro.mp4", "false"],
  "notes": "Play once at show start"
}
```

#### cuestations.json
Stores cuestation configurations:
```json
{
  "id": "unique-id",
  "name": "projector-1",
  "description": "Main stage projector",
  "mappings": {} // Optional projection mapping data
}
```

#### cuepernova.config.json
Application configuration:
```json
{
  "oscPort": 57121,
  "httpPort": 8080,
  "httpsPort": 8443,
  "defaultCuestation": "main"
}
```

## Key Implementation Details

### Adding New Screen Types
Edit `static-src/js/cuestation.ts` and add handler to `cueHandlers` object:
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
  "address": "/cuepernova/cuestation/showScreen/video",
  "args": ["path/to/video.mp4", "true"]
}
```

### URL Parameters for Cuestations
- `?name=projector1` - Unique identifier for each cuestation
- Cueballs receive arguments as `?arg1=value&arg2=value&arg3=value`

## Development Tips

- Development mode uses ports 8080/8443, production uses 80/443
- WebRTC features require HTTPS (self-signed certs work locally)
- Each cuestation needs a unique name parameter
- Media files go in `public/media/`
- The mapping interface saves to browser localStorage
- Console logs OSC messages for debugging