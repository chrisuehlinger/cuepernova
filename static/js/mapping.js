$(async () => {
    // Get cuestation name from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const cuestationName = urlParams.get("name") || "unnamed";
    // Determine which page to embed based on cuestation name
    let embedUrl;
    if (cuestationName === 'control') {
        // Load control panel for control cuestation
        embedUrl = `${location.protocol}//${location.host}/control.html`;
    }
    else {
        // Load cuestation page with same URL parameters
        embedUrl = `${location.protocol}//${location.host}/cuestation.html${location.search}`;
    }
    // Create iframe with the appropriate content
    const $mappingFrame = $(`<iframe src="${embedUrl}" id="mapping-frame" frameborder="0" width="${window.innerWidth}" height="${window.innerHeight}"></iframe>`);
    $("body").append($mappingFrame);
    // Initialize Maptastic with cuestation-specific storage key
    Maptastic({
        layers: ["mapping-frame"],
        localStorageKey: `maptastic.${cuestationName}`,
    });
    // Listen for messages from the iframe or WebSocket
    window.addEventListener("message", (e) => {
        const message = e.data;
        console.log("mapping received message", message);
        switch (message.type) {
            case "clearMappings":
                localStorage.removeItem(`maptastic.${cuestationName}`);
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
