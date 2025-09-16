# Cuepernova

Open source theater projection control system as a cross-platform Electron desktop application.

## Features

- 🎭 **Multi-Display Control** - Manage multiple projection surfaces and monitors
- 🎵 **QLab Integration** - Full OSC support for seamless QLab integration  
- 🌐 **WebSocket Communication** - Real-time updates across all connected devices
- 📹 **WebRTC Support** - Peer-to-peer video streaming between devices
- 🗺️ **Projection Mapping** - Interactive mapping editor with live preview
- 🔒 **Automatic SSL** - Self-signed certificate generation for secure connections
- 💻 **Cross-Platform** - Runs on Windows, macOS, and Linux

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/yourusername/cuepernova.git
cd cuepernova

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run start

# Create distributable packages
npm run dist
```

### Pre-built Releases

Download the latest release for your platform from the [Releases](https://github.com/yourusername/cuepernova/releases) page.

## Usage

### Getting Started

1. **Launch Cuepernova** - Open the application
2. **Select a Project Directory** - Choose or create a folder for your project
3. **Start the Server** - Click the power button to start the integrated server
4. **Create Cuestations** - Add display devices (projectors, monitors, etc.)
5. **Build Your Cue List** - Add cues for your show

### Managing Cuestations

1. Click "Add Cuestation" to create a new display device
2. Give it a unique name (no spaces)
3. Set the showtime resolution (content canvas size)
4. Click the window icon to open the cuestation display
5. Click the map icon to configure projection mapping

### Projection Mapping

1. Click the map icon next to any cuestation
2. A modal window opens with the mapping editor
3. Drag the corner handles to adjust the projection transformation
4. The grid pattern helps visualize the mapping distortion
5. Changes are sent live to the cuestation display
6. Click "Save" to persist the mapping or "Cancel" to revert

### Creating Cues

1. Click "Add Cue" to create a new cue
2. Set the cue number and name
3. Choose the cue type:
   - **black/white** - Solid color screens
   - **message** - Display text messages
   - **video** - Play video files
   - **image** - Display images
   - **cueball** - Custom HTML/CSS/JS effects
4. Add any required arguments (file paths, text, etc.)
5. Click the play button to test the cue

### OSC Commands from QLab

Cuepernova listens for OSC commands on port 57121 (configurable):

```
/cuepernova/cuestation/[cuestation-name]/showScreen/video "path/to/video.mp4" "true"
/cuepernova/cuestation/[cuestation-name]/showScreen/message "Hello World" "Subtitle"
/cuepernova/cuestation/[cuestation-name]/clearScreen
/cuepernova/cuestation/[cuestation-name]/fadeScreen 2000
```

If you pass `all` as the cuestation-name, the message will be broadcast to all cuestations.

### SSL Certificates for Remote Devices

1. Open Settings (gear icon)
2. Click "Download CA Certificate"
3. Install the certificate on remote devices:
   - **macOS**: Double-click and add to Keychain
   - **Windows**: Double-click and install to Trusted Root
   - **iOS/Android**: Email the certificate and open to install
4. Remote devices can now connect securely to `https://[your-ip]:8443`

## Development

### Architecture

- **Electron Main Process** - Desktop app lifecycle and window management (`src/main/`)
- **React Frontend** - Material-UI based control interface (`src/renderer/`)
- **TypeScript** - Strict typing throughout with Zod validation
- **Express Server** - Integrated HTTP/HTTPS server for cuestations
- **WebSocket Manager** - Centralized real-time communication with rate limiting
- **OSC Server** - UDP listener for QLab integration
- **Data Store** - Centralized database operations with caching
- **Webpack Build** - ERB (Electron React Boilerplate) configuration

### Building from Source

```bash
# Install dependencies
npm install

# Development mode (with hot reload on port 1212)
npm run dev

# Production build and start
npm run start

# Build Electron main process only
npm run build:main

# Build React frontend only
npm run build:renderer

# Clean all build artifacts
npm run clean

# Package for distribution
npm run dist
```

### Project Structure

```
cuepernova/
├── src/
│   ├── main/          # Electron main process
│   │   ├── main.ts    # App entry point
│   │   ├── preload.ts # IPC bridge
│   │   ├── ipc/       # IPC handlers
│   │   ├── server/    # Express server, WebSocket, OSC
│   │   └── utils/     # Utilities
│   ├── renderer/      # React app + static pages
│   │   ├── App.tsx    # Main React app
│   │   ├── components/ # UI components
│   │   ├── screens/   # App screens
│   │   ├── *.ejs      # HTML templates
│   │   └── *.ts       # Client scripts
│   └── shared/        # Shared types and data layer
│       ├── types/     # TypeScript definitions
│       └── data/      # DataStore class
├── __tests__/         # Test files
├── .erb/              # Webpack configuration
└── release/           # Built distributions
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

### Development Tips

- Development runs two concurrent processes: Electron main and webpack dev server
- Webpack dev server provides hot reload on port 1212
- Express server runs on ports 8080 (HTTP) and 8443 (HTTPS)
- TypeScript strict mode is enabled - ensure proper type definitions
- All project data stored in user's `db.json` file
- SSL certificates auto-generated in user's `.cuepernova/` directory

### Tech Stack

- **Frontend**: React 19, Material-UI v5, TypeScript
- **Backend**: Electron, Express, WebSockets, OSC
- **Build**: Webpack (ERB configuration), TypeScript compiler
- **Validation**: Zod for runtime type checking
- **Mapping**: Maptastic for projection mapping
- **Communication**: Socket.io for WebSockets, node-osc for OSC

## Acknowledgments

- Built with Electron React Boilerplate (ERB)
- React 19 and Material-UI v5 for modern UI
- OSC support via node-osc
- WebRTC signaling for peer-to-peer connections
- Maptastic for projection mapping capabilities