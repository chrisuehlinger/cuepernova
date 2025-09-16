// Simple in-memory storage for WebRTC signaling
// In production, you might want to use Redis or another persistent store

export interface RTCSignals {
  offer: { [key: string]: any };
  answer: { [key: string]: any };
}

const rtcSignals: RTCSignals = {
  offer: {},
  answer: {}
};

export default rtcSignals;