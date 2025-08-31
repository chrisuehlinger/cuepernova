$(async () => {
  // Get orbital name from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const ORBITAL_NAME = urlParams.get('name') || 'unnamed';
  
  console.log(`Orbital starting with name: ${ORBITAL_NAME}`);
  
  let $showtime = $('#showtime-area');
  let connection = null;
  
  // Cue handlers for different screen types
  const cueHandlers = {
    // Built-in screens
    debug: (message) => {
      $showtime.html(`<div class="debug-wrapper">
        <h1>ORBITAL NAME: <strong>${ORBITAL_NAME}</strong></h1>
        <h1>TIME: <strong>${new Date().toLocaleTimeString()}</strong></h1>
        <h1>STATUS: <strong>CONNECTED</strong></h1>
      </div>`);
    },
    
    freeze: (message) => {
      $showtime.html('<div class="freeze-wrapper"><h1>FREEZE!</h1></div>');
    },
    
    black: (message) => {
      $showtime.html('');
    },
    
    white: (message) => {
      $showtime.html('<div style="width:100vw;height:100vh;background:white;"></div>');
    },
    
    message: (message) => {
      const text = message.args[0] || 'No message';
      const subtitle = message.args[1] || '';
      $showtime.html(`<div class="message-wrapper">
        <h1>${text}</h1>
        ${subtitle ? `<p>${subtitle}</p>` : ''}
      </div>`);
    },
    
    video: (message) => {
      const videoPath = message.args[0];
      const loop = message.args[1] === 'loop';
      if (videoPath) {
        $showtime.html(`<div class="full-area">
          <video class="fullwidth" src="${videoPath}" autoplay ${loop ? 'loop' : ''} muted></video>
        </div>`);
        if (!loop) {
          $('video').on('ended', () => {
            $showtime.removeClass('its-showtime');
            $showtime.html('');
          });
        }
      }
    },
    
    image: (message) => {
      const imagePath = message.args[0];
      if (imagePath) {
        $showtime.html(`<div class="full-area">
          <img class="fullwidth" src="${imagePath}" />
        </div>`);
      }
    },
    
    iframe: (message) => {
      const url = message.args[0];
      if (url) {
        $showtime.html(`<iframe class="fullscreen-frame" src="${url}"></iframe>`);
      }
    },
    
    app: (message) => {
      const appName = message.args[0];
      if (appName) {
        // Pass any additional args as query parameters
        const params = new URLSearchParams();
        if (message.args.length > 1) {
          for (let i = 1; i < message.args.length; i++) {
            params.append(`arg${i}`, message.args[i]);
          }
        }
        const queryString = params.toString() ? `?${params.toString()}` : '';
        $showtime.html(`<iframe class="fullscreen-frame" src="/apps/${appName}.html${queryString}"></iframe>`);
      }
    }
  };
  
  // WebSocket connection management
  function connectWebSocket() {
    console.log('Attempting to connect...');
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${location.host}/orbital?name=${encodeURIComponent(ORBITAL_NAME)}`;
    
    connection = new WebSocket(wsUrl);
    
    connection.onopen = function () {
      console.log('WebSocket connected!');
    };
    
    connection.onmessage = onMessage;
    
    connection.onerror = function (e) {
      console.error('WebSocket error:', e);
    };
    
    connection.onclose = function () {
      console.log('WebSocket closed, reconnecting in 1 second...');
      setTimeout(connectWebSocket, 1000);
    };
  }
  
  // Message handling
  function onMessage(e) {
    try {
      const message = JSON.parse(e.data);
      console.log('Received message:', message);
      
      // Check if this message is for us
      if (message.address.includes(`/${ORBITAL_NAME}/`) || !message.address.includes('/')) {
        handleMessage(message);
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  }
  
  function handleMessage(message) {
    const parts = message.address.split('/');
    // Handle both /cuepernova/orbital/messageType and legacy /orbital/messageType
    const isNamespaced = parts[1] === 'cuepernova';
    const messageType = isNamespaced ? parts[3] : parts[2];
    
    switch (messageType) {
      case 'showScreen':
        const screenType = isNamespaced ? parts[4] : parts[3];
        $showtime.addClass('its-showtime');
        
        if (cueHandlers[screenType]) {
          cueHandlers[screenType](message);
        } else {
          console.warn(`No handler for screen type: ${screenType}`);
          // Try to load it as an app
          cueHandlers.app({ ...message, args: [screenType, ...(message.args || [])] });
        }
        break;
        
      case 'clearScreen':
        $showtime.removeClass('its-showtime');
        $showtime.html('');
        break;
        
      case 'fadeScreen':
        const duration = message.args[0] || 500;
        $showtime.fadeOut(duration, () => {
          $showtime.removeClass('its-showtime');
          $showtime.html('');
          $showtime.show();
        });
        break;
        
      case 'refreshScreen':
        location.reload();
        break;
        
      case 'clearMappings':
        // Post message to parent frame if we're in an iframe (mapping.html)
        if (window.parent !== window) {
          window.parent.postMessage({ type: 'clearMappings' }, '*');
        }
        break;
        
      default:
        console.log(`No handler for message type: ${messageType}`);
    }
  }
  
  // Start connection
  connectWebSocket();
});