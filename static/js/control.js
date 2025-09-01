const state = {
    connection: null,
    isConnected: false,
    customCues: []
};
// Load cues from JSON file
async function loadCues() {
    try {
        const response = await fetch('/cues.json');
        if (response.ok) {
            const data = await response.json();
            state.customCues = data.cues || [];
            console.log('Loaded cues from cues.json:', state.customCues);
        }
        else {
            console.warn('Could not load cues.json, using empty cue list');
            state.customCues = [];
        }
    }
    catch (error) {
        console.error('Error loading cues.json:', error);
        state.customCues = [];
    }
    renderCueList();
}
// WebSocket connection
function connectWebSocket() {
    console.log('Connecting to control WebSocket...');
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    state.connection = new WebSocket(`${protocol}://${location.host}/control`);
    state.connection.onopen = function () {
        console.log('Control WebSocket connected!');
        state.isConnected = true;
        updateConnectionStatus(true);
    };
    state.connection.onmessage = function (e) {
        try {
            const message = JSON.parse(e.data);
            console.log('Received:', message);
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
        state.isConnected = false;
        updateConnectionStatus(false);
        setTimeout(connectWebSocket, 1000);
    };
}
// Send OSC message
function sendMessage(address, args = []) {
    if (!state.isConnected || !state.connection) {
        alert('Not connected to server!');
        return;
    }
    const message = {
        address: address,
        args: args
    };
    console.log('Sending:', message);
    state.connection.send(JSON.stringify(message));
}
// UI Event handlers
function bindEventHandlers() {
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
    $('#screen-white').on('click', () => {
        sendMessage('/cuepernova/cuestation/showScreen/white');
    });
    $('#screen-black').on('click', () => {
        sendMessage('/cuepernova/cuestation/showScreen/black');
    });
    $('#screen-freeze').on('click', () => {
        sendMessage('/cuepernova/cuestation/showScreen/freeze');
    });
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
        const text = $('#message-text').val();
        const subtitle = $('#message-subtitle').val();
        if (text) {
            sendMessage('/cuepernova/cuestation/showScreen/message', [text, subtitle || '']);
        }
    });
    // Video controls
    $('#send-video').on('click', () => {
        const path = $('#video-path').val();
        const loop = $('#video-loop').is(':checked');
        if (path) {
            sendMessage('/cuepernova/cuestation/showScreen/video', [path, loop.toString()]);
        }
    });
    // Image controls
    $('#send-image').on('click', () => {
        const path = $('#image-path').val();
        if (path) {
            sendMessage('/cuepernova/cuestation/showScreen/image', [path]);
        }
    });
    // Cueball controls
    $('#send-cueball').on('click', () => {
        const name = $('#cueball-name').val();
        const argsStr = $('#cueball-args').val();
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
    $('#cue-list').on('click', '.cue-item', function () {
        const index = $(this).data('index');
        const cue = state.customCues[index];
        if (cue) {
            sendMessage(cue.address, cue.args || []);
            highlightCue($(this));
        }
    });
}
// Render cue list
function renderCueList() {
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
function highlightCue($item) {
    $('.cue-item').removeClass('active');
    $item.addClass('active');
    setTimeout(() => $item.removeClass('active'), 500);
}
// Update connection status
function updateConnectionStatus(connected) {
    const $status = $('#connection-status');
    if (connected) {
        $status.removeClass('disconnected').addClass('connected').text('Connected');
    }
    else {
        $status.removeClass('connected').addClass('disconnected').text('Disconnected');
    }
}
// Initialize on document ready
$(async () => {
    await loadCues();
    bindEventHandlers();
    connectWebSocket();
});
export {};
