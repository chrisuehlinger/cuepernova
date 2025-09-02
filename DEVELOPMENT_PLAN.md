# Cuepernova Electron App Development Plan

## Architecture Overview
- Electron app with integrated Express server
- React/TypeScript frontend with Material-UI
- Main process handles server, file operations, and window management
- Renderer process runs React app for control interface
- Additional windows for cuestations (using existing HTML)

## Implementation Steps

### 1. Project Setup
- [x] Research CA certificate libraries (choosing node-forge for maturity and features)
- [ ] Install Electron, React, and Material-UI dependencies
- [ ] Configure TypeScript for both main and renderer processes
- [ ] Set up Webpack/Vite for React bundling
- [ ] Configure Electron Builder

### 2. Main Process
- [ ] Create Electron main entry point
- [ ] Integrate Express server directly
- [ ] Implement IPC handlers for:
  - Directory selection
  - Project initialization
  - Server start/stop
  - File operations (cues.json, cuestations.json, config)
  - Window management
  - CA certificate generation

### 3. Renderer Process (React App)
- [ ] Create React app structure
- [ ] Implement directory picker screen
- [ ] Build MainScreen component:
  - Cue list display
  - Cue CRUD operations
  - Server ON/OFF toggle
  - Settings modal
  - Cuestation management
- [ ] Create settings modal for config editing
- [ ] Implement cuestation management UI

### 4. Certificate Management
- [ ] Generate CA certificate on first run
- [ ] Create SSL certificates for local IPs
- [ ] Serve CA root certificate at /CAROOT.pem

### 5. File Structure Changes
```
cuepernova/
├── electron/
│   ├── main.ts           # Electron main process
│   ├── preload.ts        # Preload script for IPC
│   └── ipc/              # IPC handlers
├── src-react/            # React app source
│   ├── App.tsx
│   ├── screens/
│   │   ├── DirectoryPicker.tsx
│   │   └── MainScreen.tsx
│   ├── components/
│   │   ├── CueList.tsx
│   │   ├── CueEditor.tsx
│   │   ├── ServerToggle.tsx
│   │   ├── SettingsModal.tsx
│   │   └── CuestationManager.tsx
│   └── services/         # IPC communication
├── src/                  # Existing server code (to be integrated)
└── static/               # Existing static files
```

## Key Libraries
- Electron: Desktop app framework
- React: UI framework
- Material-UI (@mui/material): Component library
- node-forge: CA certificate generation
- electron-builder: App packaging

## Data Files
- cues.json: Show cue list
- cuestations.json: Cuestation names and mappings
- cuepernova.config.json: App configuration
- .cuepernova/: CA certificate storage (gitignored)