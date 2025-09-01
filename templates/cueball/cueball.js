// {{NAME}} Script

// Get URL parameters
const params = new URLSearchParams(window.location.search);
const arg1 = params.get('arg1');
const arg2 = params.get('arg2');
const arg3 = params.get('arg3');

// Initialize your cueball
function init() {
    console.log('{{NAME}} initialized');
    console.log('Arguments:', { arg1, arg2, arg3 });
    
    // Your initialization code here
}

// Run when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}