import $ from 'jquery';
// @ts-ignore - Maptastic doesn't have type definitions
import * as maptastic from 'maptastic';
const Maptastic = (maptastic as any).Maptastic;

interface MaptasticInstance {
  setLayout(layout: any[]): void;
  getLayout(): any[];
  setConfigEnabled(enabled: boolean): void;
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
    const resolutionWidth = state.config?.showtimeResolution.width || 1920;
    const resolutionHeight = state.config?.showtimeResolution.height || 1080;

    state.showtime.html(`<div class="message-wrapper">
      <h1>${text}</h1>
    </div>`);

    const h1 = state.showtime.find('h1');
    let fontSize = 100; // Start with a reasonable size
    h1.css('font-size', fontSize + 'px');

    // First, shrink if too large
    while (fontSize > 1) {
      const width = h1.outerWidth() || 0;
      const height = h1.outerHeight() || 0;

      if (width > resolutionWidth || height > resolutionHeight) {
        fontSize--;
        h1.css('font-size', fontSize + 'px');
      } else {
        break;
      }
    }

    // Then, grow if there's room (100px margin on both dimensions)
    while (fontSize < 1000) {
      const width = h1.outerWidth() || 0;
      const height = h1.outerHeight() || 0;

      if (width < resolutionWidth - 100 && height < resolutionHeight - 100) {
        fontSize++;
        h1.css('font-size', fontSize + 'px');
      } else {
        // Check if we went over, if so step back
        if (width > resolutionWidth || height > resolutionHeight) {
          fontSize--;
          h1.css('font-size', fontSize + 'px');
        }
        break;
      }
    }
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
          state.showtime.fadeOut(500, () => {
            state.showtime.html('');
          });
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
    console.log('Cueball message args:', message.args);
    const cueballName = message.args?.[0];
    console.log('Cueball name:', cueballName);
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
  const isHttps = location.protocol === 'https:';
  const protocol = isHttps ? 'wss' : 'ws';
  const port = isHttps ? 8443 : 8080;
  const wsUrl = `${protocol}://${location.hostname}:${port}/cuestation?name=${encodeURIComponent(CUESTATION_NAME)}`;
  console.log('Attempting to connect via WebSocket to:', wsUrl);

  state.connection = new WebSocket(wsUrl);

  state.connection.onopen = function () {
    console.log('WebSocket connected!');
    $('#connection-status').removeClass('disconnected').addClass('connected').text('Connected');
  };

  state.connection.onmessage = function (e: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(e.data);
      console.log('Received:', message);
      handleOscMessage(message);
    } catch (err) {
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

  // Messages come in format: /cuepernova/cuestation/[name|all]/[command]
  // We need to check if this message is for us or for 'all'

  if (pathParts[1] !== 'cuepernova' || pathParts[2] !== 'cuestation') {
    console.log('Not a cuestation message:', message.address);
    return;
  }

  const target = pathParts[3];

  // Check if message is for this cuestation or for all
  if (target !== CUESTATION_NAME && target !== 'all') {
    console.log(`Message not for this cuestation (${CUESTATION_NAME}):`, message.address);
    return;
  }

  // Get the action from the correct position (after the target)
  const action = pathParts[4];

  // Special case for mapping update
  if (action === 'mapping-update' && target === CUESTATION_NAME) {
    if (state.maptastic && message.args?.[0]) {
      try {
        const mappingData = JSON.parse(String(message.args[0]));
        console.log('Updating mapping:', mappingData);
        // Format for setLayout: array of layer objects with id and points
        if (mappingData.layers && mappingData.layers.length > 0) {
          // Get current window dimensions
          const width = window.innerWidth;
          const height = window.innerHeight;

          // Denormalize target points from 0-1 to window pixels
          const denormalizedTargetPoints = mappingData.layers[0].targetPoints.map((point: number[]) => [
            point[0] * width,
            point[1] * height
          ]);

          // Source points stay in resolution coordinates
          const sourcePoints = mappingData.layers[0].sourcePoints;

          state.maptastic.setLayout([{
            id: 'its-showtime',
            targetPoints: denormalizedTargetPoints,
            sourcePoints: sourcePoints
          }]);
        }
      } catch (err) {
        console.error('Error parsing mapping data:', err);
      }
    }
    return;
  }

  switch (action) {
    case 'showScreen':
      const screenType = pathParts[5];
      if (screenType && cueHandlers[screenType]) {
        cueHandlers[screenType](message);
        state.showtime.show();
      } else {
        console.warn(`Unknown screen type: ${screenType}`);
      }
      break;

    case 'clearScreen':
      state.showtime.hide();
      state.showtime.html('');
      break;

    case 'fadeScreen':
      const screenTypeForFade = pathParts[5];
      const fadeDuration = parseInt(String(message.args?.[0])) || 500;
      
      if (screenTypeForFade && cueHandlers[screenTypeForFade]) {
        state.showtime.hide();
        cueHandlers[screenTypeForFade](message);
        state.showtime.fadeIn(fadeDuration);
      } else {
        console.warn(`Unknown screen type for fadeScreen: ${screenTypeForFade}`);
      }
      break;

    case 'fadeOut':
      const fadeOutDuration = parseInt(String(message.args?.[0])) || 500;
      state.showtime.fadeOut(fadeOutDuration, () => {
        state.showtime.html('');
      });
      break;

    case 'refreshScreen':
      window.location.reload();
      break;

    case 'clearMappings':
      if (state.maptastic) {
        // Reset to default mapping - normalized target points denormalized to window pixels
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const sourceWidth = state.config?.showtimeResolution?.width || 1920;
        const sourceHeight = state.config?.showtimeResolution?.height || 1080;

        state.maptastic.setLayout([{
          id: 'its-showtime',
          targetPoints: [[0, 0], [windowWidth, 0], [windowWidth, windowHeight], [0, windowHeight]],
          sourcePoints: [[0, 0], [sourceWidth, 0], [sourceWidth, sourceHeight], [0, sourceHeight]]
        }]);
        console.log('Mappings reset to default');
      }
      break;

    default:
      console.log(`No handler for action: ${action}`);
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

  // Initialize Maptastic
  try {
    console.log('Initializing Maptastic...');
    state.maptastic = new Maptastic('its-showtime');

    // Apply saved mapping if available (single layer only)
    if (state.config.mapping && state.config.mapping.layers && state.config.mapping.layers.length > 0 && state.maptastic) {
      console.log('Applying saved mapping configuration:', state.config.mapping);

      // Get current window dimensions
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      console.log('Window dimensions:', windowWidth, windowHeight);
      console.log('Original target points:', state.config.mapping.layers[0].targetPoints);

      // Denormalize target points from normalized (0-1) to window pixels
      const denormalizedTargetPoints = state.config.mapping.layers[0].targetPoints.map((point: number[]) => [
        point[0] * windowWidth,
        point[1] * windowHeight
      ]);

      console.log('Denormalized target points:', denormalizedTargetPoints);

      document.getElementById('its-showtime')!.style.width = state.config.showtimeResolution.width + 'px';
      document.getElementById('its-showtime')!.style.height = state.config.showtimeResolution.height + 'px';

      // Format for setLayout: array of layer objects with id and points
      state.maptastic.setLayout([{
        id: 'its-showtime',
        targetPoints: denormalizedTargetPoints,
        sourcePoints: state.config.mapping.layers[0].sourcePoints
      }]);
    } else {
      console.log('Using default Maptastic mapping');
      // Set default mapping - full window for target, full resolution for source
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const sourceWidth = state.config.showtimeResolution?.width || 1920;
      const sourceHeight = state.config.showtimeResolution?.height || 1080;

      if (state.maptastic) {
        state.maptastic.setLayout([{
          id: 'its-showtime',
          targetPoints: [[0, 0], [windowWidth, 0], [windowWidth, windowHeight], [0, windowHeight]],
          sourcePoints: [[0, 0], [sourceWidth, 0], [sourceWidth, sourceHeight], [0, sourceHeight]]
        }]);
      }
    }
  } catch (error) {
    console.error('Failed to initialize Maptastic:', error);
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

export { }; // Make this a module