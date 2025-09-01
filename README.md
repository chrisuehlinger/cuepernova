# Cuepernova

Open source theater projection control system for managing multiple displays, real-time effects, and show cues.

## Features

- 🎭 **Multi-Display Control** - Manage multiple projectors and displays from a central control panel
- 🎛️ **OSC Integration** - Full integration with QLab and other OSC-compatible software
- 🔌 **WebSocket Communication** - Real-time updates across all connected devices
- 📹 **WebRTC Support** - Peer-to-peer video streaming between devices
- 🗺️ **Projection Mapping** - Built-in projection mapping interface
- 🎨 **Custom Effects** - Create custom "cueballs" for unique visual effects
- 📦 **NPM Package** - Easy installation and project setup via npm
- ⚡ **No Build Step** - Uses ES modules for rapid development

## Installation

### As an NPM Package (Recommended)

```bash
npm install -g cuepernova
```

Or use with npx without installing:

```bash
npx cuepernova [command]
```

### From Source

```bash
git clone [repository-url]
cd cuepernova
npm install
npm link  # Makes 'cuepernova' command available globally
```

## Quick Start

### 1. Initialize a new project

```bash
mkdir my-show
cd my-show
cuepernova init
```

This creates:
- `cueballs/` - Directory for your custom effects
- `media/` - Directory for media files
- `cues.json` - Your show's cue list
- `cuepernova.config.ts` - Configuration file

### 2. Start the server

```bash
cuepernova start
```

The server will run on:
- HTTP: http://localhost:8080
- OSC: UDP port 57121

### 3. Access the interfaces

- **Control Panel**: http://localhost:8080/control.html
- **Projection Mapping**: http://localhost:8080/mapping.html
- **Display/Orbital**: http://localhost:8080/orbital.html?name=display1

Each display device should access the orbital URL with a unique name parameter.

## CLI Commands

### `cuepernova start`

Start the Cuepernova server.

Options:
- `-p, --port <port>` - HTTP port (default: 8080)
- `-s, --https-port <port>` - HTTPS port (default: 8443)
- `-o, --osc-port <port>` - OSC UDP port (default: 57121)
- `--cert <path>` - SSL certificate path
- `--key <path>` - SSL key path
- `-c, --config <path>` - Path to config file

Example:
```bash
cuepernova start --port 3000 --osc-port 9999
```

### `cuepernova init`

Initialize a new Cuepernova project in the current directory.

Options:
- `-f, --force` - Overwrite existing files

### `cuepernova cueball <name>`

Create a new cueball (custom effect).

Example:
```bash
cuepernova cueball "Rainbow Wave"
```

This creates:
- `cueballs/rainbow-wave.html`
- `css/rainbow-wave.css`
- `js/rainbow-wave.js`

## Configuration

Create a `cuepernova.config.ts` file for project configuration:

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

## OSC Commands

All OSC commands are namespaced under `/cuepernova`:

### Display Control
- `/cuepernova/orbital/showScreen/[screenType] [args...]` - Show content on displays
- `/cuepernova/orbital/clearScreen` - Clear all displays
- `/cuepernova/orbital/fadeScreen [duration]` - Fade out displays
- `/cuepernova/orbital/refreshScreen` - Refresh display pages

### System Commands
- `/cuepernova/system/clear-rtc` - Clear WebRTC signals
- `/cuepernova/system/clearMappings` - Clear all projection mappings
- `/cuepernova/system/resetMapping [orbitalName]` - Reset specific display mapping

### Screen Types

Built-in screen types:
- `black`, `white` - Solid colors
- `freeze` - Flashing freeze message
- `debug` - Connection status
- `message [text] [subtitle]` - Text display
- `video [path] [loop]` - Video playback
- `image [path]` - Image display
- `cueball [name] [arg1] [arg2] [arg3]` - Custom cueball

Example OSC messages:
```
/cuepernova/orbital/showScreen/black
/cuepernova/orbital/showScreen/message "Scene 1" "The Garden"
/cuepernova/orbital/showScreen/video /media/intro.mp4 true
/cuepernova/orbital/showScreen/cueball rainbow-wave fast blue
```

## Managing Cues

### Cues.json File

Your show's cues are stored in `cues.json` in your project root. This file is automatically created when you run `cuepernova init` and can be edited to customize your show's cue list.

#### Format

```json
{
  "cues": [
    {
      "name": "Show Video",
      "address": "/cuepernova/orbital/showScreen/video",
      "args": ["/media/intro.mp4", "loop"]
    },
    {
      "name": "Scene 1 Title",
      "address": "/cuepernova/orbital/showScreen/message",
      "args": ["ACT 1", "The Garden"]
    },
    {
      "name": "Custom Effect",
      "address": "/cuepernova/orbital/showScreen/cueball",
      "args": ["rainbow-wave", "fast", "blue"]
    }
  ]
}
```

#### Live Reloading

The control panel includes a reload button (↻) next to "Custom Cues" that allows you to reload the cue list without restarting the server. This is useful during tech rehearsals when you need to quickly update cues.

#### Fields

- `name` - Display name shown in the control panel
- `address` - OSC address for the command
- `args` - Array of arguments to pass with the command

## Creating Custom Cueballs

### Using the CLI

The easiest way to create a new cueball:

```bash
cuepernova cueball "My Effect"
```

### Cueball Structure

Cueballs are HTML pages that can receive arguments via URL parameters:

```javascript
// In your cueball's JS file
const params = new URLSearchParams(window.location.search);
const arg1 = params.get('arg1');
const arg2 = params.get('arg2');
const arg3 = params.get('arg3');

// Use the arguments to customize behavior
if (arg1 === 'fast') {
  document.body.style.animationDuration = '1s';
}
```

### Using from QLab

Create an OSC cue in QLab:
- **Message**: `/cuepernova/orbital/showScreen/cueball my-effect value1 value2 value3`
- **Destination**: Your computer's IP
- **Port**: 57121

## Projection Mapping

Use the mapping interface to align projections:

1. Open: http://localhost:8080/mapping.html?name=projector1
2. Click "Toggle Mapping Mode"
3. Drag corners to align projection
4. Click "Toggle Mapping Mode" again to save

The mapping is saved in the browser's localStorage and persists across sessions.

## SSL/HTTPS Setup

For WebRTC features, you'll need SSL certificates:

```bash
# Install mkcert
brew install mkcert  # macOS
# or see https://github.com/FiloSottile/mkcert#installation

# Generate certificates
mkcert -install
mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost

# Configure in cuepernova.config.ts
# Then start normally - HTTPS will be enabled automatically
cuepernova start
```

## Development

### Project Structure

After initialization, your project will have:

```
your-project/
├── cueballs/             # Custom effect pages
├── media/                # Media files (videos, images, audio)
├── css/                  # Cueball stylesheets
├── js/                   # Cueball scripts
├── node_modules/         # Your project's dependencies
├── cues.json             # Your show's cue list
├── cuepernova.config.ts  # Configuration file
└── package.json          # Your project's package.json
```

### WebSocket Events

The control panel and orbital displays communicate via WebSocket. You can extend functionality by listening to WebSocket messages in your custom cueballs:

```javascript
const ws = new WebSocket(`ws://${window.location.host}/orbital`);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.address === '/cuepernova/orbital/customCommand') {
    // Handle custom command
  }
};
```

### Adding New Screen Types

To add a new built-in screen type, contribute to the project by modifying `orbital.js`:

```javascript
cueHandlers['mytype'] = function(args) {
  // Implementation
};
```

## Tips

- Keep the control panel on a separate device from projections
- Use meaningful orbital names for easy identification
- Test WebRTC features over HTTPS for camera/microphone access
- Store media files in your project's `media/` folder
- Use ES modules and import maps for loading dependencies

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.