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
npm run build

# Run in development mode with hot reload
npm start

# Build distributable packages
npm run packate
```

### Application Features
- **Directory Picker**: Select or create a project directory on launch
- **Main Screen**: Manage cues and cuestations with full CRUD operations
- **Server Control**: ON/OFF toggle with visual feedback
- **Settings Modal**: Configure OSC, HTTP, and HTTPS ports
- **Cuestation Windows**: Open multiple display windows
- **Mapping Editor**: Interactive projection mapping editor with live preview
- **Automatic SSL**: CA certificate generation and management
- **CA Download**: Easily distribute certificates to other devices

## Architecture Overview

### Build System
- **Electron React Boilerplate (ERB)**: Webpack-based build configuration
- **Development Server**: Webpack dev server runs on port 1212 for hot reload
- **Production Build**: Optimized bundles for distribution

### Electron Architecture  
- **Main Process**: `src/main/main.ts` - Handles app lifecycle, windows, IPC
- **Preload Script**: `src/main/preload.ts` - Secure bridge between main and renderer
- **IPC Handlers**: `src/main/ipc/handlers.ts` - File operations and server control
- **Server Manager**: `src/main/server/index.ts` - Integrated Express server (ServerManager class)
- **Certificate Manager**: `src/main/server/certificate-manager.ts` - CA and SSL certificate generation

### Centralized Systems
- **Type System**: All types in `/src/shared/types/` with Zod validation
- **Data Layer**: `DataStore` class in `/src/shared/data/DataStore.ts` handles all database operations with caching
- **WebSocket Manager**: `src/main/server/WebSocketManager.ts` - Centralized WebSocket handling with rate limiting and client tracking
- **Performance**: React.memo on all components, TypeScript incremental builds

### React Frontend Architecture
- **Entry Point**: `src/renderer/index.tsx` - React app initialization
- **Main App**: `src/renderer/App.tsx` - Route and state management
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
- **WebRTC Signaling**: Via `/signalmaster` routes handled by `src/main/server/signalmaster.ts`

### Frontend Pages Architecture
- **Development**: TypeScript compiled to JavaScript via Webpack
- **Templates**: EJS templates in `src/renderer/` compiled to HTML during build
- **Core Pages** (built from templates):
  - `cuestation.html` - Display device interface with integrated projection mapping (from `cuestation.ejs`)
  - `control.html` - Central control panel (from `control.ejs`)
  - `mapping-editor.html` - Projection mapping editor (from `mapping-editor.ejs`)
- **Client Scripts**: TypeScript modules in `src/renderer/` (cuestation.ts, control.ts, mapping-editor.ts)
- **Custom Cueballs**: Located in user's `public/cueballs/` directory
- **Communication**: WebSocket connections for real-time updates

### Message Flow
1. **OSC Commands** (port 57121) → `src/main/server/sockets.ts` → WebSocketManager → Broadcast to cuestations
2. **Control Panel** → WebSocket → `src/main/server/sockets.ts` → WebSocketManager → Cuestation clients
3. **WebRTC Signaling** → `src/main/server/signalmaster.ts` → Peer connections via `src/main/utils/rtc-signals.ts`

### OSC Command Structure
- `/cuepernova/cuestation/showScreen/[screenType]` - Display content on cuestations
- `/cuepernova/cuestation/clearScreen` - Clear all displays
- `/cuepernova/cuestation/fadeScreen [duration]` - Fade out displays
- `/cuepernova/cuestation/refreshScreen` - Refresh cuestation pages
- `/cuepernova/cuestation/[name]/mapping-update` - Update mapping for specific cuestation (JSON in args[0])
- `/cuepernova/system/clear-rtc` - Clear RTC signals
- `/cuepernova/system/clearMappings` - Clear all projection mappings
- `/cuepernova/system/resetMapping [cuestationName]` - Reset mapping for specific cuestation

### Screen Types
Built-in screen types handled by `src/renderer/cuestation.ts`:
- `debug` - Connection status
- `message [text] [subtitle]` - Text display
- `video [path] [loop]` - Video playback
- `image [path]` - Image display
- `cueball [cueballname] [args...]` - Custom cueball from `/public/cueballs`
- `clear` - Clear the display

## Project Structure

### Application Source Structure
```
src/
├── main/                     # Electron main process
│   ├── main.ts              # App entry point and window management
│   ├── preload.ts           # Secure IPC bridge
│   ├── util.ts              # Utilities
│   ├── ipc/                 # IPC handlers
│   │   └── handlers.ts      # File operations and server control
│   ├── server/              # Integrated Express server
│   │   ├── index.ts         # ServerManager class
│   │   ├── sockets.ts       # WebSocket and OSC management
│   │   ├── signalmaster.ts  # WebRTC signaling
│   │   ├── WebSocketManager.ts # Centralized WebSocket handling
│   │   └── certificate-manager.ts # SSL certificate management
│   └── utils/               # Utilities
│       └── rtc-signals.ts   # RTC signal storage
├── renderer/                # Frontend (React + static pages)
│   ├── App.tsx              # Main React application
│   ├── index.tsx            # React entry point
│   ├── components/          # React UI components
│   ├── screens/             # Main app screens
│   ├── cuestation.ts        # Cuestation client logic
│   ├── control.ts           # Control panel logic
│   ├── mapping-editor.ts    # Projection mapping editor
│   ├── *.ejs                # HTML templates for static pages
│   └── types.ts             # Frontend type definitions
├── shared/                  # Shared code between main and renderer
│   ├── types/               # Centralized TypeScript types
│   │   ├── index.ts         # All type definitions
│   │   └── validation.ts    # Zod validation schemas
│   └── data/                # Data layer
│       └── DataStore.ts     # Centralized database operations
└── __tests__/               # Test files
```

### User Project Structure
```
user-project/
├── public/                # All public-facing content
│   ├── cueballs/         # Custom cueball pages
│   ├── media/            # Media assets  
│   ├── css/              # Cueball stylesheets
│   └── js/               # Cueball scripts
├── .cuepernova/           # Certificate storage (gitignored)
│   ├── ca-cert.pem       # CA certificate (shareable)
│   └── ca-key.pem        # CA private key (keep secure)
├── db.json                # Consolidated data file (cues, cuestations, config)
└── .gitignore            # Excludes .cuepernova/
```

### Data Files

#### db.json
Consolidated data file containing all project data:
```json
{
  "cues": [
    {
      "id": "unique-id",
      "number": "1",
      "name": "Opening",
      "type": "video",
      "args": ["intro.mp4", "false"],
      "notes": "Play once at show start"
    }
  ],
  "cuestations": [
    {
      "id": "unique-id",
      "name": "projector-1",
      "description": "Main stage projector",
      "showtimeResolution": {
        "width": 1920,
        "height": 1080
      },
      "mapping": {
        "layers": [{
          "targetPoints": [[0, 0], [1, 0], [1, 1], [0, 1]],
          "sourcePoints": [[0, 0], [1, 0], [1, 1], [0, 1]]
        }]
      }
    }
  ],
  "config": {
    "oscPort": 57121,
    "httpPort": 8080,
    "httpsPort": 8443,
    "defaultCuestation": "main"
  }
}
```

## Key Implementation Details

### Cuestation Architecture
Each cuestation consists of:
- **Name**: Unique identifier for the cuestation
- **Showtime Resolution**: Fixed width/height in pixels for content display (e.g., 1920x1080)
- **Mapping**: Maptastic configuration for projection mapping transforms (single layer only)

When a cuestation page loads:
1. Fetches configuration from `/api/cuestation/:name` endpoint
2. Sets the `#its-showtime` div to the specified resolution
3. Initializes Maptastic with saved mapping configuration (single layer)
4. Connects WebSocket for real-time content updates

The showtime resolution defines the content canvas size, while Maptastic handles transforming it to fit the actual display/projector output.

### Mapping Editor
The mapping editor allows users to interactively adjust projection mapping:
1. Click the mapping button (map icon) next to any cuestation in the Main Screen
2. A modal opens with a Maptastic editor showing a grid pattern
3. Drag the corner handles to adjust the mapping transformation
4. Changes are sent live to the cuestation display via WebSocket
5. Click Save to persist the mapping to db.json, or Cancel to revert

### Adding New Screen Types
Edit `src/renderer/cuestation.ts` and add handler to `cueHandlers` object:
```javascript
cueHandlers['mytype'] = function(args) {
  // args[0], args[1], etc. from OSC message
}
```

### Adding New OSC Commands
Edit `src/main/server/sockets.ts` `handleSystemMessage()` function:
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

- Development mode runs webpack dev server on port 1212 with hot reload
- Express server uses ports 8080/8443 (development), 80/443 (production)
- WebRTC features require HTTPS (self-signed certs work locally)
- Each cuestation needs a unique name parameter
- Media files go in user project's `public/media/`
- Custom cueballs go in user project's `public/cueballs/`
- All project data is stored in `db.json`
- Mapping data is saved to db.json (not localStorage)
- Live mapping updates are sent via WebSocket without throttling
- Console logs OSC messages for debugging
- Two concurrent processes in development: Electron main and webpack dev server
- TypeScript strict mode is enabled - ensure proper type definitions
- React 19 with Material-UI v5 for UI components

