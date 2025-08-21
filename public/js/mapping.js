$(async () => {
  // Get parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const orbitalName = urlParams.get('name') || 'unnamed';
  const isControl = urlParams.get('control') === 'true';
  
  // Update status
  $('#status').text(`Mapping: ${orbitalName}`);
  
  // Create iframe for the content
  const src = isControl ? '/control.html' : `/orbital.html?name=${orbitalName}`;
  const $mappingFrame = $(`<iframe id="mapping-frame" src="${src}" frameborder="0" width="${window.innerWidth}" height="${window.innerHeight}"></iframe>`);
  $('body').append($mappingFrame);
  
  // Initialize Maptastic
  const maptastic = Maptastic({
    layers: ['mapping-frame'],
    localStorageKey: `cuepernova-mapping-${orbitalName}`
  });
  
  // Control buttons
  $('#toggle-mapping').on('click', () => {
    maptastic.toggle();
  });
  
  $('#clear-mapping').on('click', () => {
    if (confirm('Clear all mapping data for this display?')) {
      maptastic.clearAll();
    }
  });
  
  $('#refresh-frame').on('click', () => {
    document.getElementById('mapping-frame').contentWindow.location.reload();
  });
  
  // Listen for messages from parent frame
  window.addEventListener('message', (e) => {
    const message = e.data;
    console.log('Mapping received message:', message);
    
    switch (message.type) {
      case 'clearMappings':
        maptastic.clearAll();
        break;
        
      case 'refreshScreen':
        location.reload();
        break;
        
      default:
        // Pass through to iframe
        document.getElementById('mapping-frame').contentWindow.postMessage(message, '*');
    }
  });
});