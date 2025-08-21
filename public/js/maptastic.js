/*!
 * Maptastic v1.0
 * Simple projection mapping utility
 * Based on https://github.com/glowbox/maptasticjs
 * Simplified for Cuepernova
 */

(function() {
  window.Maptastic = function(config) {
    const layers = config.layers || [];
    const localStorageKey = config.localStorageKey || 'maptastic';
    let isActive = false;
    let activeLayer = null;
    
    // Default corner positions
    const defaultCorners = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1]
    ];
    
    // Initialize layers
    layers.forEach(layerId => {
      const element = document.getElementById(layerId);
      if (!element) return;
      
      // Load saved position or use defaults
      const saved = loadPosition(layerId);
      const corners = saved || defaultCorners.map(c => [c[0] * window.innerWidth, c[1] * window.innerHeight]);
      
      // Apply transform
      applyTransform(element, corners);
      
      // Store layer data
      element._maptastic = {
        corners: corners,
        id: layerId
      };
    });
    
    // Apply CSS transform based on corner positions
    function applyTransform(element, corners) {
      // Calculate transform matrix for perspective transform
      // This is a simplified version - for production use a proper perspective transform library
      const width = element.offsetWidth || window.innerWidth;
      const height = element.offsetHeight || window.innerHeight;
      
      // For now, just position and scale
      const minX = Math.min(...corners.map(c => c[0]));
      const maxX = Math.max(...corners.map(c => c[0]));
      const minY = Math.min(...corners.map(c => c[1]));
      const maxY = Math.max(...corners.map(c => c[1]));
      
      const scaleX = (maxX - minX) / width;
      const scaleY = (maxY - minY) / height;
      
      element.style.position = 'absolute';
      element.style.transformOrigin = '0 0';
      element.style.transform = `translate(${minX}px, ${minY}px) scale(${scaleX}, ${scaleY})`;
    }
    
    // Save position to localStorage
    function savePosition(layerId, corners) {
      const data = JSON.parse(localStorage.getItem(localStorageKey) || '{}');
      data[layerId] = corners;
      localStorage.setItem(localStorageKey, JSON.stringify(data));
    }
    
    // Load position from localStorage
    function loadPosition(layerId) {
      const data = JSON.parse(localStorage.getItem(localStorageKey) || '{}');
      return data[layerId];
    }
    
    // Public API
    return {
      toggle: function() {
        isActive = !isActive;
        document.body.classList.toggle('maptastic-active', isActive);
        
        if (isActive) {
          // Add edit UI
          layers.forEach(layerId => {
            const element = document.getElementById(layerId);
            if (!element) return;
            
            // Add control points
            const controls = document.createElement('div');
            controls.className = 'maptastic-controls';
            controls.innerHTML = `
              <div class="maptastic-control-point" data-corner="0" style="position:absolute;left:-8px;top:-8px;"></div>
              <div class="maptastic-control-point" data-corner="1" style="position:absolute;right:-8px;top:-8px;"></div>
              <div class="maptastic-control-point" data-corner="2" style="position:absolute;right:-8px;bottom:-8px;"></div>
              <div class="maptastic-control-point" data-corner="3" style="position:absolute;left:-8px;bottom:-8px;"></div>
              <svg class="maptastic-outline" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;">
                <polygon points="0,0 100%,0 100%,100% 0,100%" fill="none" stroke="#4caf50" stroke-width="2"/>
              </svg>
            `;
            element.appendChild(controls);
            
            // Make draggable (simplified)
            element.addEventListener('mousedown', startDrag);
          });
        } else {
          // Remove edit UI
          document.querySelectorAll('.maptastic-controls').forEach(el => el.remove());
          document.removeEventListener('mousemove', drag);
          document.removeEventListener('mouseup', stopDrag);
        }
      },
      
      clearAll: function() {
        localStorage.removeItem(localStorageKey);
        location.reload();
      }
    };
    
    // Drag handling (simplified)
    let dragTarget = null;
    let dragStart = null;
    
    function startDrag(e) {
      if (!isActive) return;
      if (e.target.classList.contains('maptastic-control-point')) {
        dragTarget = e.target;
        dragStart = { x: e.clientX, y: e.clientY };
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
        e.preventDefault();
      }
    }
    
    function drag(e) {
      if (!dragTarget) return;
      
      const element = dragTarget.closest('[id]');
      const cornerIndex = parseInt(dragTarget.dataset.corner);
      const data = element._maptastic;
      
      // Update corner position
      data.corners[cornerIndex] = [e.clientX, e.clientY];
      
      // Apply transform
      applyTransform(element, data.corners);
      
      // Update control positions
      updateControlPositions(element, data.corners);
    }
    
    function stopDrag() {
      if (dragTarget) {
        const element = dragTarget.closest('[id]');
        const data = element._maptastic;
        savePosition(data.id, data.corners);
      }
      dragTarget = null;
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDrag);
    }
    
    function updateControlPositions(element, corners) {
      const controls = element.querySelectorAll('.maptastic-control-point');
      corners.forEach((corner, i) => {
        if (controls[i]) {
          const rect = element.getBoundingClientRect();
          controls[i].style.left = (corner[0] - rect.left - 8) + 'px';
          controls[i].style.top = (corner[1] - rect.top - 8) + 'px';
        }
      });
    }
  };
})();