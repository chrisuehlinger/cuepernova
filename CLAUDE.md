# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Cuepernova is an open source theater projection control system for managing multiple displays, real-time effects, and show cues. It provides multi-display control, OSC integration for QLab, WebSocket communication for real-time updates, WebRTC support for peer-to-peer streaming, and projection mapping capabilities.

## Common Development Commands

### Start the application
```bash
# Start with automatic dependency installation
./startup.sh         # Production mode (ports 8080/8443)
./startup.sh dev     # Development mode with Node.js --watch (auto-restart)

# Manual start
npm install          # Install dependencies (if needed)
npm start           # Production mode
npm run dev         # Development with --watch
npm run start:env   # Production with --env-file=.env
npm run dev:env     # Development with --env-file=.env and --watch
```

### Create a new app/effect
```bash
./scaffold-app.sh "My Effect Name"
# Creates: public/apps/my-effect-name.html
#          public/css/my-effect-name.css
#          public/js/my-effect-name.js
```

### SSL Certificate Setup (for WebRTC/HTTPS)
```bash
# Install mkcert first: https://github.com/FiloSottile/mkcert#installation
mkcert -install
mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost $(hostname) $(hostname).local
```

## Architecture Overview

### Server Architecture
- **Module System**: ES Modules (ESM) with `node:` prefix for built-ins
- **Entry Point**: `bin/www.js` → `app.js`
- **Express Server**: Serves on ports 8080 (HTTP) and 8443 (HTTPS) in development
- **WebSocket Endpoints**:
  - `/orbital` - Display/projection devices
  - `/control` - Control panel interfaces
- **OSC Server**: UDP port 57121 for QLab integration
- **WebRTC Signaling**: Via `/signalmaster` routes

### Frontend Architecture
- **No Build System**: Uses vanilla JavaScript with ES modules
- **Core Pages**:
  - `orbital.html` - Display device interface (projectors/monitors)
  - `control.html` - Central control panel
  - `mapping.html` - Projection mapping interface
- **Custom Apps**: Located in `public/apps/` directory
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
- `app [appname] [args...]` - Custom app from `/apps`

## Project Structure

```
cuepernova/
├── bin/www                 # Node.js entry point
├── app.js                  # Express server configuration
├── sockets.js              # WebSocket & OSC handling
├── routes/
│   ├── index.js           # Main routes
│   └── signalmaster.js    # WebRTC signaling
├── util/
│   └── rtc-signals.js     # RTC signal storage
├── public/
│   ├── orbital.html       # Display interface
│   ├── control.html       # Control panel
│   ├── mapping.html       # Projection mapping
│   ├── apps/              # Custom app pages
│   ├── css/               # Stylesheets
│   ├── js/                # Frontend scripts
│   └── media/             # Media assets
└── views/                 # Pug templates (error pages)
```

## Key Implementation Details

### Adding New Screen Types
Edit `public/js/orbital.js` and add handler to `cueHandlers` object:
```javascript
cueHandlers['mytype'] = function(args) {
  // args[0], args[1], etc. from OSC message
}
```

### Adding New OSC Commands
Edit `sockets.js` `handleSystemMessage()` function:
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
- Apps receive arguments as `?arg1=value&arg2=value&arg3=value`

## Development Tips

- Development mode uses ports 8080/8443, production uses 80/443
- WebRTC features require HTTPS (self-signed certs work locally)
- Each orbital needs a unique name parameter
- Media files go in `public/media/`
- The mapping interface saves to browser localStorage
- Console logs OSC messages for debugging