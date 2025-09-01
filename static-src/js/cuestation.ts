declare const $: JQueryStatic;
declare const Maptastic: any; // External library without types

interface MappingObject {
  clearMappings(): void;
}

interface WebSocketMessage {
  address: string;
  args?: (string | number | boolean)[];
}

interface CuestationState {
  cuestationName: string;
  showtime: JQuery<HTMLElement>;
  connection: WebSocket | null;
  mapping?: MappingObject;
}

// Get cuestation name from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const CUESTATION_NAME = urlParams.get('name') || 'unnamed';

console.log(`Cuestation starting with name: ${CUESTATION_NAME}`);

const state: CuestationState = {
  cuestationName: CUESTATION_NAME,
  showtime: $('#showtime-area'),
  connection: null,
  mapping: undefined
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
    </div>`);
  },
  
  freeze: (message: WebSocketMessage) => {
    state.showtime.html('<div class="freeze-wrapper"><h1>FREEZE!</h1></div>');
  },
  
  black: (message: WebSocketMessage) => {
    state.showtime.html('');
  },
  
  white: (message: WebSocketMessage) => {
    state.showtime.html('<div style="width:100vw;height:100vh;background:white;"></div>');
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
          state.showtime.removeClass('its-showtime');
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
  const action = pathParts[3];
  
  if (pathParts[1] === 'cuepernova' && pathParts[2] === 'cuestation') {
    switch(action) {
      case 'showScreen':
        const screenType = pathParts[4];
        if (screenType && cueHandlers[screenType]) {
          state.showtime.addClass('its-showtime');
          cueHandlers[screenType](message);
        } else {
          console.warn(`Unknown screen type: ${screenType}`);
        }
        break;
        
      case 'clearScreen':
        state.showtime.removeClass('its-showtime');
        state.showtime.html('');
        break;
        
      case 'fadeScreen':
        const duration = parseInt(String(message.args?.[0])) || 1000;
        state.showtime.fadeOut(duration, () => {
          state.showtime.removeClass('its-showtime');
          state.showtime.html('');
          state.showtime.show();
        });
        break;
        
      case 'refreshScreen':
        window.location.reload();
        break;
        
      case 'clearMappings':
        if (state.mapping) {
          state.mapping.clearMappings();
          console.log('Mappings cleared');
        }
        break;
        
      default:
        console.log(`No handler for action: ${action}`);
    }
  }
}

// Initialize projection mapping if requested
function initProjectionMapping(): void {
  const enableMapping = urlParams.get('mapping') === 'true';
  
  if (enableMapping && Maptastic) {
    state.mapping = Maptastic(CUESTATION_NAME);
    console.log('Projection mapping enabled');
    
    // Load saved mappings from localStorage
    const savedMappings = localStorage.getItem(`maptastic-${CUESTATION_NAME}`);
    if (savedMappings) {
      console.log('Loading saved projection mappings');
    }
  }
}

// Initialize
$(async () => {
  state.showtime = $('#showtime-area');
  connectWebSocket();
  initProjectionMapping();
});

export {}; // Make this a module