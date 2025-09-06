declare const $: JQueryStatic;

interface Cue {
  name: string;
  address: string;
  args?: (string | number | boolean)[];
  group?: string;
}

interface CueList {
  cues: Cue[];
}

interface WebSocketMessage {
  address: string;
  args?: (string | number | boolean)[];
}

interface ControlState {
  connection: WebSocket | null;
  isConnected: boolean;
  customCues: Cue[];
}

const state: ControlState = {
  connection: null,
  isConnected: false,
  customCues: []
};

// Load cues from JSON file
async function loadCues(): Promise<void> {
  try {
    const response = await fetch('/cues.json');
    if (response.ok) {
      const data: CueList = await response.json();
      state.customCues = data.cues || [];
      console.log('Loaded cues from cues.json:', state.customCues);
    } else {
      console.warn('Could not load cues.json, using empty cue list');
      state.customCues = [];
    }
  } catch (error) {
    console.error('Error loading cues.json:', error);
    state.customCues = [];
  }
  renderCueList();
}

// WebSocket connection
function connectWebSocket(): void {
  console.log('Connecting to control WebSocket...');
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  state.connection = new WebSocket(`${protocol}://${location.host}/control`);
  
  state.connection.onopen = function () {
    console.log('Control WebSocket connected!');
    state.isConnected = true;
    updateConnectionStatus(true);
  };
  
  state.connection.onmessage = function(e: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(e.data);
      console.log('Received:', message);
    } catch(err) {
      console.error('Error parsing message:', err);
    }
  };
  
  state.connection.onerror = function (e: Event) {
    console.error('WebSocket error:', e);
  };
  
  state.connection.onclose = function () {
    console.log('WebSocket closed, reconnecting...');
    state.isConnected = false;
    updateConnectionStatus(false);
    setTimeout(connectWebSocket, 1000);
  };
}

// Send OSC message
function sendMessage(address: string, args: (string | number | boolean)[] = []): void {
  if (!state.isConnected || !state.connection) {
    alert('Not connected to server!');
    return;
  }
  
  const message: WebSocketMessage = {
    address: address,
    args: args
  };
  
  console.log('Sending:', message);
  state.connection.send(JSON.stringify(message));
}

// UI Event handlers
function bindEventHandlers(): void {
  // Emergency controls
  $('#bail').on('click', () => {
    if (confirm('Clear all screens?')) {
      sendMessage('/cuepernova/cuestation/clearScreen');
    }
  });
  
  $('#refresh').on('click', () => {
    if (confirm('Refresh all cuestation pages?')) {
      sendMessage('/cuepernova/cuestation/refreshScreen');
    }
  });
  
  $('#debug').on('click', () => {
    sendMessage('/cuepernova/cuestation/showScreen/debug');
  });
  
  // Reload cues button
  $('#reload-cues').on('click', async () => {
    console.log('Reloading cues...');
    await loadCues();
    alert('Cues reloaded!');
  });
  
  // Quick controls
  $('#clear-screen').on('click', () => {
    sendMessage('/cuepernova/cuestation/clearScreen');
  });
  
  $('#fade-screen').on('click', () => {
    const duration = prompt('Fade duration in ms:', '1000');
    if (duration) {
      sendMessage('/cuepernova/cuestation/fadeScreen', [duration]);
    }
  });
  
  // Message controls
  $('#send-message').on('click', () => {
    const text = $('#message-text').val() as string;
    const subtitle = $('#message-subtitle').val() as string;
    if (text) {
      sendMessage('/cuepernova/cuestation/showScreen/message', [text, subtitle || '']);
    }
  });
  
  // Video controls
  $('#send-video').on('click', () => {
    const path = $('#video-path').val() as string;
    const loop = $('#video-loop').is(':checked');
    if (path) {
      sendMessage('/cuepernova/cuestation/showScreen/video', [path, loop.toString()]);
    }
  });
  
  // Image controls
  $('#send-image').on('click', () => {
    const path = $('#image-path').val() as string;
    if (path) {
      sendMessage('/cuepernova/cuestation/showScreen/image', [path]);
    }
  });
  
  // Cueball controls
  $('#send-cueball').on('click', () => {
    const name = $('#cueball-name').val() as string;
    const argsStr = $('#cueball-args').val() as string;
    if (name) {
      const args = argsStr ? argsStr.split(',').map(s => s.trim()) : [];
      sendMessage('/cuepernova/cuestation/showScreen/cueball', [name, ...args]);
    }
  });
  
  // System controls
  $('#clear-rtc').on('click', () => {
    if (confirm('Clear all RTC signals?')) {
      sendMessage('/cuepernova/system/clear-rtc');
    }
  });
  
  $('#clear-mappings').on('click', () => {
    if (confirm('Clear all projection mappings?')) {
      sendMessage('/cuepernova/system/clearMappings');
    }
  });
  
  // Cue list handlers
  $('#cue-list').on('click', '.cue-item', function() {
    const index = $(this).data('index') as number;
    const cue = state.customCues[index];
    if (cue) {
      sendMessage(cue.address, cue.args || []);
      highlightCue($(this));
    }
  });
}

// Render cue list
function renderCueList(): void {
  const $list = $('#cue-list');
  $list.empty();
  
  if (state.customCues.length === 0) {
    $list.append('<div class="cue-empty">No cues loaded. Create a cues.json file in your project root.</div>');
    return;
  }
  
  let currentGroup = '';
  state.customCues.forEach((cue, index) => {
    if (cue.group && cue.group !== currentGroup) {
      currentGroup = cue.group;
      $list.append(`<div class="cue-group">${currentGroup}</div>`);
    }
    
    const $item = $('<div class="cue-item">')
      .data('index', index)
      .html(`
        <span class="cue-name">${cue.name}</span>
        <span class="cue-address">${cue.address}</span>
      `);
    
    $list.append($item);
  });
}

// Highlight executed cue
function highlightCue($item: JQuery): void {
  $('.cue-item').removeClass('active');
  $item.addClass('active');
  setTimeout(() => $item.removeClass('active'), 500);
}

// Update connection status
function updateConnectionStatus(connected: boolean): void {
  const $status = $('#connection-status');
  if (connected) {
    $status.removeClass('disconnected').addClass('connected').text('Connected');
  } else {
    $status.removeClass('connected').addClass('disconnected').text('Disconnected');
  }
}

// Initialize on document ready
$(async () => {
  await loadCues();
  bindEventHandlers();
  connectWebSocket();
});

export {}; // Make this a module