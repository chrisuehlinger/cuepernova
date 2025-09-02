// Simple in-memory storage for WebRTC signaling
// In production, you might want to use Redis or another persistent store
const rtcSignals = {
    offer: {},
    answer: {}
};
export default rtcSignals;
