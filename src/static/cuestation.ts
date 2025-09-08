import $ from 'jquery';
// @ts-ignore - Maptastic doesn't have type definitions
import Maptastic from 'maptastic';

interface MaptasticInstance {
  setConfigData(data: any): void;
  getConfigData(): any;
  clearMappings(): void;
}

interface WebSocketMessage {
  address: string;
  args?: (string | number | boolean)[];
}

interface CuestationConfig {
  id: string;
  name: string;
  description?: string;
  showtimeResolution: {
    width: number;
    height: number;
  };
  mapping?: {
    layers?: Array<{
      targetPoints: number[][];
      sourcePoints: number[][];
    }>;
  };
}

interface CuestationState {
  cuestationName: string;
  config: CuestationConfig | null;
  showtime: JQuery<HTMLElement>;
  connection: WebSocket | null;
  maptastic: MaptasticInstance | null;
}

// Get cuestation name from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const CUESTATION_NAME = urlParams.get('name') || 'unnamed';

console.log(`Cuestation starting with name: ${CUESTATION_NAME}`);

const state: CuestationState = {
  cuestationName: CUESTATION_NAME,
  config: null,
  showtime: $('#its-showtime'),
  connection: null,
  maptastic: null
};

// Cue handler type
type CueHandler = (message: WebSocketMessage) => void;

// Cue handlers for different screen types
const cueHandlers: Record<string, CueHandler> = {
  // Built-in screens
  debug: (message: WebSocketMessage) => {
    state.showtime.html(`<div class="debug-wrapper">
      <h1>CUESTATION NAME: <strong>${CUESTATION_NAME}</strong></h1>
      <h1>TIME: <strong>${new Date().toLocaleTimeString()}</strong></h1>
      <h1>STATUS: <strong>CONNECTED</strong></h1>
      <h1>RESOLUTION: <strong>${state.config?.showtimeResolution.width || '?'} x ${state.config?.showtimeResolution.height || '?'}</strong></h1>
    </div>`);
  },
  
  message: (message: WebSocketMessage) => {
    const text = message.args?.[0] || 'No message';
    const subtitle = message.args?.[1] || '';
    state.showtime.html(`<div class="message-wrapper">
      <h1>${text}</h1>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
    </div>`);
  },
  
  video: (message: WebSocketMessage) => {
    const videoPath = message.args?.[0];
    const loop = message.args?.[1] === 'loop';
    if (videoPath) {
      state.showtime.html(`<div class="full-area">
        <video class="fullwidth" src="${videoPath}" autoplay ${loop ? 'loop' : ''} muted></video>
      </div>`);
      if (!loop) {
        $('video').on('ended', () => {
          state.showtime.removeClass('show');
          state.showtime.html('');
        });
      }
    }
  },
  
  image: (message: WebSocketMessage) => {
    const imagePath = message.args?.[0];
    if (imagePath) {
      state.showtime.html(`<div class="full-area">
        <img class="fullwidth" src="${imagePath}" />
      </div>`);
    }
  },
  
  iframe: (message: WebSocketMessage) => {
    const url = message.args?.[0];
    if (url) {
      state.showtime.html(`<iframe class="fullscreen-frame" src="${url}"></iframe>`);
    }
  },
  
  cueball: (message: WebSocketMessage) => {
    const cueballName = message.args?.[0];
    if (cueballName) {
      // Pass any additional args as query parameters
      const params = new URLSearchParams();
      if (message.args && message.args.length > 1) {
        for (let i = 1; i < message.args.length; i++) {
          params.append(`arg${i}`, String(message.args[i]));
        }
      }
      const queryString = params.toString() ? `?${params.toString()}` : '';
      state.showtime.html(`<iframe class="fullscreen-frame" src="/cueballs/${cueballName}.html${queryString}"></iframe>`);
    }
  }
};

// WebSocket connection management
function connectWebSocket(): void {
  console.log('Attempting to connect...');
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  const wsUrl = `${protocol}://${location.host}/cuestation?name=${encodeURIComponent(CUESTATION_NAME)}`;
  
  state.connection = new WebSocket(wsUrl);
  
  state.connection.onopen = function () {
    console.log('WebSocket connected!');
    $('#connection-status').removeClass('disconnected').addClass('connected').text('Connected');
  };
  
  state.connection.onmessage = function(e: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(e.data);
      console.log('Received:', message);
      handleOscMessage(message);
    } catch(err) {
      console.error('Error parsing message:', err);
    }
  };
  
  state.connection.onerror = function (e: Event) {
    console.error('WebSocket error:', e);
  };
  
  state.connection.onclose = function () {
    console.log('WebSocket closed, reconnecting...');
    $('#connection-status').removeClass('connected').addClass('disconnected').text('Disconnected');
    setTimeout(connectWebSocket, 1000);
  };
}

// Handle incoming OSC messages
function handleOscMessage(message: WebSocketMessage): void {
  const pathParts = message.address.split('/');
  
  // Check for cuestation-specific mapping update
  if (message.address === `/cuepernova/cuestation/${CUESTATION_NAME}/mapping-update`) {
    if (state.maptastic && message.args?.[0]) {
      try {
        const mappingData = JSON.parse(String(message.args[0]));
        console.log('Updating mapping:', mappingData);
        state.maptastic.setConfigData(mappingData);
      } catch (err) {
        console.error('Error parsing mapping data:', err);
      }
    }
    return;
  }
  
  const action = pathParts[3];
  
  if (pathParts[1] === 'cuepernova' && pathParts[2] === 'cuestation') {
    switch(action) {
      case 'showScreen':
        const screenType = pathParts[4];
        if (screenType && cueHandlers[screenType]) {
          state.showtime.addClass('show');
          cueHandlers[screenType](message);
        } else {
          console.warn(`Unknown screen type: ${screenType}`);
        }
        break;
        
      case 'clearScreen':
        state.showtime.removeClass('show');
        state.showtime.html('');
        break;
        
      case 'fadeScreen':
        const duration = parseInt(String(message.args?.[0])) || 1000;
        state.showtime.fadeOut(duration, () => {
          state.showtime.removeClass('show');
          state.showtime.html('');
          state.showtime.show();
        });
        break;
        
      case 'refreshScreen':
        window.location.reload();
        break;
        
      case 'clearMappings':
        if (state.maptastic) {
          state.maptastic.clearMappings();
          console.log('Mappings cleared');
        }
        break;
        
      default:
        console.log(`No handler for action: ${action}`);
    }
  }
}

// Fetch cuestation configuration from server
async function fetchCuestationConfig(): Promise<CuestationConfig | null> {
  try {
    const response = await fetch(`/api/cuestation/${encodeURIComponent(CUESTATION_NAME)}`);
    if (response.ok) {
      const config = await response.json();
      console.log('Loaded cuestation configuration:', config);
      return config;
    } else {
      console.error('Failed to fetch cuestation config:', response.status);
      // Use default configuration
      return {
        id: 'default',
        name: CUESTATION_NAME,
        showtimeResolution: {
          width: 1920,
          height: 1080
        }
      };
    }
  } catch (error) {
    console.error('Error fetching cuestation config:', error);
    // Use default configuration
    return {
      id: 'default',
      name: CUESTATION_NAME,
      showtimeResolution: {
        width: 1920,
        height: 1080
      }
    };
  }
}

// Initialize projection mapping with cuestation config
function initProjectionMapping(): void {
  if (!state.config) return;
  
  // Set the showtime div dimensions based on config
  state.showtime.css({
    width: `${state.config.showtimeResolution.width}px`,
    height: `${state.config.showtimeResolution.height}px`
  });
  
  // Initialize Maptastic if available
  if (typeof Maptastic !== 'undefined') {
    console.log('Initializing Maptastic...');
    state.maptastic = Maptastic('its-showtime');
    
    // Apply saved mapping if available (single layer only)
    if (state.config.mapping && state.config.mapping.layers && state.config.mapping.layers.length > 0 && state.maptastic) {
      console.log('Applying saved mapping configuration');
      // Only use the first layer
      const singleLayerMapping = {
        layers: [state.config.mapping.layers[0]]
      };
      state.maptastic.setConfigData(singleLayerMapping);
    } else {
      console.log('Using default Maptastic mapping');
      // Set default identity mapping explicitly
      const defaultMapping = {
        layers: [{
          targetPoints: [[0, 0], [1, 0], [1, 1], [0, 1]],
          sourcePoints: [[0, 0], [1, 0], [1, 1], [0, 1]]
        }]
      };
      if (state.maptastic) {
        state.maptastic.setConfigData(defaultMapping);
      }
    }
  } else {
    console.warn('Maptastic library not loaded');
  }
}

// Initialize
$(async () => {
  state.showtime = $('#its-showtime');
  
  // Fetch configuration from server
  state.config = await fetchCuestationConfig();
  
  // Initialize projection mapping with the fetched config
  initProjectionMapping();
  
  // Connect WebSocket
  connectWebSocket();
});

export {}; // Make this a module