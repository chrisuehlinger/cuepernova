#!/bin/bash

# Cuepernova Cueball Scaffolding Script
# Usage: ./scaffold-cueball.sh <cueball-name>

# Check if cueball name is provided
if [ -z "$1" ]; then
  echo "Error: Please provide a cueball name"
  echo "Usage: ./scaffold-cueball.sh <cueball-name>"
  exit 1
fi

CUEBALL_NAME="$1"
CUEBALL_DIR="public/cueballs"
CSS_DIR="public/css"
JS_DIR="public/js"

# Convert cueball name to lowercase for file names
CUEBALL_NAME_LOWER=$(echo "$CUEBALL_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

# Check if cueball already exists
if [ -f "$CUEBALL_DIR/$CUEBALL_NAME_LOWER.html" ]; then
  echo "Error: Cueball '$CUEBALL_NAME_LOWER' already exists!"
  exit 1
fi

echo "Creating new Cuepernova cueball: $CUEBALL_NAME"

# Create HTML file
cat > "$CUEBALL_DIR/$CUEBALL_NAME_LOWER.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>$CUEBALL_NAME</title>
  <link rel="stylesheet" href="../css/$CUEBALL_NAME_LOWER.css" />
</head>
<body>
  <div id="container">
    <div id="content">
      <!-- Your content here -->
      <h1>$CUEBALL_NAME</h1>
    </div>
  </div>
  
  <script src="../js/jquery.js"></script>
  <script type="module" src="../js/$CUEBALL_NAME_LOWER.js"></script>
</body>
</html>
EOF

# Create CSS file with common theater cueball styles
cat > "$CSS_DIR/$CUEBALL_NAME_LOWER.css" << 'EOF'
/* Common styles for Cuepernova cueballs */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #000;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
  width: 100vw;
  height: 100vh;
}

#container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

#content {
  text-align: center;
  padding: 20px;
}

h1 {
  font-size: 5em;
  font-weight: 300;
  margin-bottom: 0.5em;
}

/* Common animation classes */
.fade-in {
  animation: fadeIn 1s ease-in-out;
}

.fade-out {
  animation: fadeOut 1s ease-in-out;
}

.slide-in-left {
  animation: slideInLeft 1s ease-out;
}

.slide-in-right {
  animation: slideInRight 1s ease-out;
}

.slide-in-top {
  animation: slideInTop 1s ease-out;
}

.slide-in-bottom {
  animation: slideInBottom 1s ease-out;
}

.scale-in {
  animation: scaleIn 0.5s ease-out;
}

/* Keyframes */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slideInLeft {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes slideInTop {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}

@keyframes slideInBottom {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes scaleIn {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

/* Utility classes */
.fullscreen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.hidden {
  display: none !important;
}

.invisible {
  opacity: 0;
}

/* Media element defaults */
video, img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

video.cover, img.cover {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

/* Custom styles for this cueball */
EOF

# Create JavaScript file with common utilities
cat > "$JS_DIR/$CUEBALL_NAME_LOWER.js" << 'EOF'
// Get URL parameters passed from the cue
const urlParams = new URLSearchParams(window.location.search);
const arg1 = urlParams.get('arg1');
const arg2 = urlParams.get('arg2');
const arg3 = urlParams.get('arg3');

// Common utilities for Cuepernova cueballs
const utils = {
  // Parse numeric arguments
  getNumber: (param, defaultValue = 0) => {
    const value = urlParams.get(param);
    return value ? parseFloat(value) : defaultValue;
  },
  
  // Parse boolean arguments
  getBoolean: (param, defaultValue = false) => {
    const value = urlParams.get(param);
    return value === 'true' || value === '1';
  },
  
  // Fade in element
  fadeIn: (element, duration = 1000) => {
    $(element).css('opacity', 0).animate({ opacity: 1 }, duration);
  },
  
  // Fade out element
  fadeOut: (element, duration = 1000) => {
    $(element).animate({ opacity: 0 }, duration);
  },
  
  // Load and play video
  playVideo: (src, loop = false) => {
    const video = $('<video>')
      .attr('src', src)
      .attr('autoplay', true)
      .attr('muted', true)
      .prop('loop', loop)
      .addClass('fullscreen cover');
    
    $('#container').append(video);
    return video[0];
  },
  
  // Load image
  showImage: (src) => {
    const img = $('<img>')
      .attr('src', src)
      .addClass('fullscreen cover fade-in');
    
    $('#container').append(img);
    return img[0];
  },
  
  // WebSocket connection for real-time updates
  connectWebSocket: (handlers = {}) => {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${location.host}/orbital`);
    
    ws.onmessage = (e) => {
      try {
        const message = JSON.parse(e.data);
        if (handlers[message.type]) {
          handlers[message.type](message);
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };
    
    ws.onerror = (e) => console.error('WebSocket error:', e);
    ws.onclose = () => {
      console.log('WebSocket closed, reconnecting...');
      setTimeout(() => connectWebSocket(handlers), 1000);
    };
    
    return ws;
  }
};

// Initialize your cueball
$(document).ready(() => {
  console.log('Cueball initialized with args:', { arg1, arg2, arg3 });
  
  // Your cueball code here
  
  // Example: Update content based on arguments
  if (arg1) {
    $('#content h1').text(arg1);
  }
  
  // Example: Add animation class
  $('#content').addClass('fade-in');
  
  // Example: Connect WebSocket for real-time updates (optional)
  // const ws = utils.connectWebSocket({
  //   update: (message) => {
  //     console.log('Received update:', message);
  //   }
  // });
});
EOF

echo "✅ Created $CUEBALL_DIR/$CUEBALL_NAME_LOWER.html"
echo "✅ Created $CSS_DIR/$CUEBALL_NAME_LOWER.css"
echo "✅ Created $JS_DIR/$CUEBALL_NAME_LOWER.js"
echo ""
echo "Cueball scaffolding complete! To use your new cueball:"
echo ""
echo "1. Edit the files to add your custom functionality"
echo "2. Call from OSC: /cuepernova/orbital/showScreen/cueball $CUEBALL_NAME_LOWER arg1 arg2 arg3"
echo "3. Or test directly: http://localhost:8080/cueballs/$CUEBALL_NAME_LOWER.html?arg1=test"
echo ""
echo "The cueball receives arguments as URL parameters (arg1, arg2, arg3, etc.)"