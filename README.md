# Cuepernova

Open source theater projection control system for managing multiple displays, real-time effects, and show cues.

## Features

- **Multi-display Control**: Manage multiple projection surfaces (orbitals) from a central control panel
- **OSC Integration**: Control via QLab or other OSC-capable software (port 57121)
- **WebSocket Communication**: Real-time updates across all connected devices
- **WebRTC Support**: Peer-to-peer video/audio streaming over local networks
- **Projection Mapping**: Built-in projection mapping interface for display alignment
- **Flexible Cue System**: Show videos, images, web apps, or custom HTML content
- **HTTP/HTTPS Support**: Works with or without SSL certificates
- **No Build Step**: Frontend uses ES modules and import maps for rapid development

## Quick Start

1. Clone the repository:
```bash
git clone [repository-url]
cd cuepernova
```

2. Run the startup script:
```bash
# Production mode
./startup.sh

# Development mode with Node.js --watch (auto-restart on file changes)
./startup.sh dev
```

3. Open your browser:
   - Control Panel: http://localhost:8080/control.html
   - Orbital Display: http://localhost:8080/orbital.html?name=main
   - Projection Mapping: http://localhost:8080/mapping.html?name=main

## Modern Development Features

### ES Modules (ESM)
The project now uses modern ES modules throughout the codebase with `node:` prefix for built-in modules.

### Native Node.js --watch Mode
Use the built-in `--watch` flag for automatic restarts during development:
```bash
npm run dev
# or with environment file
npm run dev:env
```

### Environment Configuration
Use Node.js native `--env-file` support for configuration:
```bash
# Copy the example environment file
cp .env.example .env

# Run with environment variables
npm run start:env     # Production with .env
npm run dev:env       # Development with .env and --watch
```

### No External Dependencies for Common Tasks
- **Body parsing**: Uses Express built-in `express.json()` and `express.urlencoded()`
- **Development**: Uses Node.js native `--watch` for auto-restart (no nodemon needed)
- **Configuration**: Uses Node.js native `--env-file` (no dotenv needed)

## Basic Usage

### Setting Up Orbitals

Each display device (projector, monitor, etc.) runs an "orbital" page. Give each orbital a unique name:

```
http://yourserver:8080/orbital.html?name=projector1
http://yourserver:8080/orbital.html?name=projector2
http://yourserver:8080/orbital.html?name=monitor1
```

### OSC Commands

Send OSC messages to port 57121:

- `/cuepernova/orbital/showScreen/[screenType]` - Show a specific screen type
- `/cuepernova/orbital/clearScreen` - Clear all screens (emergency bail)
- `/cuepernova/orbital/fadeScreen [duration]` - Fade out over duration (ms)
- `/cuepernova/orbital/refreshScreen` - Refresh all orbital pages
- `/cuepernova/system/clear-rtc` - Clear RTC signals
- `/cuepernova/system/clearMappings` - Clear all projection mappings
- `/cuepernova/system/resetMapping [orbitalName]` - Reset mapping for specific orbital

### Built-in Screen Types

- `black` - Black screen
- `white` - White screen
- `freeze` - Flashing "FREEZE!" message
- `debug` - Shows orbital name and connection status
- `message [text] [subtitle]` - Display text message
- `video [path] [loop]` - Play video file
- `image [path]` - Display image
- `app [appname] [args...]` - Load app from /apps directory

### Creating Custom Apps

#### Quick Scaffold

Use the scaffold script to quickly create a new app with all the boilerplate:

```bash
./scaffold-app.sh "My Cool Effect"
```

This creates:
- `public/apps/my-cool-effect.html` - HTML structure
- `public/css/my-cool-effect.css` - CSS with common theater styles and animations
- `public/js/my-cool-effect.js` - JavaScript with utility functions

#### Manual Creation

1. Create an HTML file in `public/apps/`
2. Access URL parameters for dynamic content
3. Call from OSC: `/cuepernova/orbital/showScreen/app yourappname arg1 arg2`

#### Common Utilities

The scaffold includes these helpful utilities:

```javascript
// Get URL arguments
const arg1 = urlParams.get('arg1');
const duration = utils.getNumber('duration', 1000);
const shouldLoop = utils.getBoolean('loop', false);

// Animation helpers
utils.fadeIn('#content', 2000);
utils.fadeOut('#content', 500);

// Media helpers
const video = utils.playVideo('/media/background.mp4', true);
const image = utils.showImage('/media/poster.jpg');

// WebSocket for real-time updates
const ws = utils.connectWebSocket({
  update: (message) => {
    // Handle real-time updates
  }
});
```

#### CSS Animation Classes

- `.fade-in` / `.fade-out` - Opacity transitions
- `.slide-in-left` / `.slide-in-right` - Horizontal slides
- `.slide-in-top` / `.slide-in-bottom` - Vertical slides
- `.scale-in` - Scale from 0 to 1
- `.fullscreen` - Full viewport coverage
- `.hidden` / `.invisible` - Visibility utilities

## SSL Setup (for WebRTC and HTTPS)

1. Install mkcert: https://github.com/FiloSottile/mkcert#installation

2. Create certificates:
```bash
mkcert -install
mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost $(hostname) $(hostname).local
```

3. Restart the server - it will now serve on both HTTP and HTTPS

## Projection Mapping

Use the mapping interface to align projections:

1. Open: http://localhost:8080/mapping.html?name=projector1
2. Click "Toggle Mapping Mode"
3. Drag corners to align projection
4. Click "Toggle Mapping Mode" again to save

## Architecture

- **Server**: Express.js with WebSocket support
- **OSC**: UDP port 57121 for external control
- **WebSocket Endpoints**:
  - `/orbital` - Display devices
  - `/control` - Control panels
- **No Build System**: Uses ES modules and import maps
- **Storage**: In-memory for signals, localStorage for mapping

## Development

### File Structure
```
cuepernova/
├── app.js              # Express server setup
├── sockets.js          # WebSocket and OSC handling
├── public/
│   ├── orbital.html    # Display page
│   ├── control.html    # Control panel
│   ├── mapping.html    # Projection mapping
│   ├── apps/           # Custom app pages
│   ├── css/            # Stylesheets
│   ├── js/             # Frontend scripts
│   └── media/          # Media files
├── routes/             # Express routes
├── util/               # Utility modules
└── views/              # Pug templates
```

### Adding Features

1. **New Screen Types**: Add handlers to `cueHandlers` in `orbital.js`
2. **New OSC Commands**: Add cases to `handleSystemMessage()` in `sockets.js`
3. **New Apps**: Create HTML files in `public/apps/`

## Tips

- Keep the control panel on a separate device from projections
- Use meaningful orbital names for easy identification
- Test WebRTC features over HTTPS for camera/microphone access
- Store media files in `public/media/` for easy access
- Use the mapping interface's "Clear Mapping" carefully - it resets alignment

## License

MIT