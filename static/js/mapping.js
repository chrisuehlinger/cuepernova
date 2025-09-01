$(async () => {
    // Get orbital name from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const orbitalName = urlParams.get("name") || "unnamed";
    // Determine which page to embed based on orbital name
    let embedUrl;
    if (orbitalName === 'control') {
        // Load control panel for control orbital
        embedUrl = `${location.protocol}//${location.host}/control.html`;
    }
    else {
        // Load orbital page with same URL parameters
        embedUrl = `${location.protocol}//${location.host}/orbital.html${location.search}`;
    }
    // Create iframe with the appropriate content
    const $mappingFrame = $(`<iframe src="${embedUrl}" id="mapping-frame" frameborder="0" width="${window.innerWidth}" height="${window.innerHeight}"></iframe>`);
    $("body").append($mappingFrame);
    // Initialize Maptastic with orbital-specific storage key
    Maptastic({
        layers: ["mapping-frame"],
        localStorageKey: `maptastic.${orbitalName}`,
    });
    // Listen for messages from the iframe or WebSocket
    window.addEventListener("message", (e) => {
        const message = e.data;
        console.log("mapping received message", message);
        switch (message.type) {
            case "clearMappings":
                localStorage.removeItem(`maptastic.${orbitalName}`);
                location.reload();
                break;
            case "refreshScreen":
                location.reload();
                break;
            default:
                console.log(`No message handler for message of type: ${message.type}`);
        }
    }, false);
});
export {};
