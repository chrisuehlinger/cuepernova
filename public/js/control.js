$(async () => {
  let connection = null;
  let isConnected = false;
  
  // Example cues - in a real production, these would be show-specific
  const customCues = [
    { name: "Show Video", address: "/orbital/showScreen/video", args: ["/media/example.mp4"] },
    { name: "Loop Background", address: "/orbital/showScreen/video", args: ["/media/background.mp4", "loop"] },
    { name: "Show Image", address: "/orbital/showScreen/image", args: ["/media/poster.jpg"] },
    { name: "Message: Places", address: "/orbital/showScreen/message", args: ["PLACES", "5 minutes to curtain"] },
    { name: "Load App", address: "/orbital/showScreen/app", args: ["example-app"] }
  ];
  
  // Initialize UI
  renderCueList();
  bindEventHandlers();
  
  // WebSocket connection
  function connectWebSocket() {
    console.log('Connecting to control WebSocket...');
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    connection = new WebSocket(`${protocol}://${location.host}/control`);
    
    connection.onopen = function () {
      console.log('Control WebSocket connected!');
      isConnected = true;
      updateConnectionStatus(true);
    };
    
    connection.onmessage = function(e) {
      try {
        const message = JSON.parse(e.data);
        console.log('Received:', message);
      } catch(err) {
        console.error('Error parsing message:', err);
      }
    };
    
    connection.onerror = function (e) {
      console.error('WebSocket error:', e);
    };
    
    connection.onclose = function () {
      console.log('WebSocket closed, reconnecting...');
      isConnected = false;
      updateConnectionStatus(false);
      setTimeout(connectWebSocket, 1000);
    };
  }
  
  // Send OSC message
  function sendMessage(address, args = []) {
    if (!isConnected) {
      alert('Not connected to server!');
      return;
    }
    
    const message = {
      address: address,
      args: args
    };
    
    console.log('Sending:', message);
    connection.send(JSON.stringify(message));
  }
  
  // UI Event handlers
  function bindEventHandlers() {
    // Emergency controls
    $('#bail').on('click', () => {
      if (confirm('Clear all screens?')) {
        sendMessage('/orbital/clearScreen');
      }
    });
    
    $('#refresh').on('click', () => {
      if (confirm('Refresh all orbital pages?')) {
        sendMessage('/orbital/refreshScreen');
      }
    });
    
    $('#debug').on('click', () => {
      sendMessage('/orbital/showScreen/debug');
    });
    
    // Basic screen controls
    $('.btn-cue').on('click', function() {
      const cue = $(this).data('cue');
      const args = $(this).data('args');
      
      if (args) {
        // Parse args - could be comma separated or single value
        const argArray = String(args).includes(',') ? 
          args.split(',').map(a => a.trim()) : 
          [args];
        sendMessage(cue, argArray);
      } else {
        sendMessage(cue);
      }
    });
    
    // Manual cue input
    $('#callmanual').on('click', sendManualCue);
    $('#manualcue').on('keypress', (e) => {
      if (e.which === 13) { // Enter key
        sendManualCue();
      }
    });
    
    // Custom cue buttons
    $(document).on('click', '.btn-go', function() {
      const index = $(this).data('index');
      const cue = customCues[index];
      if (cue) {
        sendMessage(cue.address, cue.args);
      }
    });
  }
  
  function sendManualCue() {
    const cueText = $('#manualcue').val().trim();
    if (!cueText) return;
    
    // Parse the cue text
    const parts = cueText.split(' ');
    const address = parts[0];
    const args = parts.slice(1);
    
    sendMessage(address, args);
  }
  
  // Render custom cue list
  function renderCueList() {
    const $list = $('#cue-list');
    $list.empty();
    
    customCues.forEach((cue, index) => {
      const $item = $(`
        <div class="cue-item">
          <span class="cue-name">${cue.name}</span>
          <span class="cue-address">${cue.address} ${cue.args.join(' ')}</span>
          <button class="btn-go" data-index="${index}">GO</button>
        </div>
      `);
      $list.append($item);
    });
  }
  
  // Update connection status UI
  function updateConnectionStatus(connected) {
    const $status = $('#connection-status');
    if (connected) {
      $status.addClass('connected');
      $status.html('<i class="material-icons">wifi</i><span>Connected</span>');
    } else {
      $status.removeClass('connected');
      $status.html('<i class="material-icons">wifi_off</i><span>Disconnected</span>');
    }
  }
  
  // Start connection
  connectWebSocket();
});