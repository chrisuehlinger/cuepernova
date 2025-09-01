// Get orbital name from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const ORBITAL_NAME = urlParams.get('name') || 'unnamed';
console.log(`Orbital starting with name: ${ORBITAL_NAME}`);
const state = {
    orbitalName: ORBITAL_NAME,
    showtime: $('#showtime-area'),
    connection: null,
    mapping: undefined
};
// Cue handlers for different screen types
const cueHandlers = {
    // Built-in screens
    debug: (message) => {
        state.showtime.html(`<div class="debug-wrapper">
      <h1>ORBITAL NAME: <strong>${ORBITAL_NAME}</strong></h1>
      <h1>TIME: <strong>${new Date().toLocaleTimeString()}</strong></h1>
      <h1>STATUS: <strong>CONNECTED</strong></h1>
    </div>`);
    },
    freeze: (message) => {
        state.showtime.html('<div class="freeze-wrapper"><h1>FREEZE!</h1></div>');
    },
    black: (message) => {
        state.showtime.html('');
    },
    white: (message) => {
        state.showtime.html('<div style="width:100vw;height:100vh;background:white;"></div>');
    },
    message: (message) => {
        const text = message.args?.[0] || 'No message';
        const subtitle = message.args?.[1] || '';
        state.showtime.html(`<div class="message-wrapper">
      <h1>${text}</h1>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
    </div>`);
    },
    video: (message) => {
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
    image: (message) => {
        const imagePath = message.args?.[0];
        if (imagePath) {
            state.showtime.html(`<div class="full-area">
        <img class="fullwidth" src="${imagePath}" />
      </div>`);
        }
    },
    iframe: (message) => {
        const url = message.args?.[0];
        if (url) {
            state.showtime.html(`<iframe class="fullscreen-frame" src="${url}"></iframe>`);
        }
    },
    cueball: (message) => {
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
function connectWebSocket() {
    console.log('Attempting to connect...');
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${location.host}/orbital?name=${encodeURIComponent(ORBITAL_NAME)}`;
    state.connection = new WebSocket(wsUrl);
    state.connection.onopen = function () {
        console.log('WebSocket connected!');
        $('#connection-status').removeClass('disconnected').addClass('connected').text('Connected');
    };
    state.connection.onmessage = function (e) {
        try {
            const message = JSON.parse(e.data);
            console.log('Received:', message);
            handleOscMessage(message);
        }
        catch (err) {
            console.error('Error parsing message:', err);
        }
    };
    state.connection.onerror = function (e) {
        console.error('WebSocket error:', e);
    };
    state.connection.onclose = function () {
        console.log('WebSocket closed, reconnecting...');
        $('#connection-status').removeClass('connected').addClass('disconnected').text('Disconnected');
        setTimeout(connectWebSocket, 1000);
    };
}
// Handle incoming OSC messages
function handleOscMessage(message) {
    const pathParts = message.address.split('/');
    const action = pathParts[3];
    if (pathParts[1] === 'cuepernova' && pathParts[2] === 'orbital') {
        switch (action) {
            case 'showScreen':
                const screenType = pathParts[4];
                if (screenType && cueHandlers[screenType]) {
                    state.showtime.addClass('its-showtime');
                    cueHandlers[screenType](message);
                }
                else {
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
function initProjectionMapping() {
    const enableMapping = urlParams.get('mapping') === 'true';
    if (enableMapping && Maptastic) {
        state.mapping = Maptastic(ORBITAL_NAME);
        console.log('Projection mapping enabled');
        // Load saved mappings from localStorage
        const savedMappings = localStorage.getItem(`maptastic-${ORBITAL_NAME}`);
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
export {};
