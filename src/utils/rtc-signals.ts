// Simple in-memory storage for WebRTC signaling
// In production, you might want to use Redis or another persistent store

import { RTCSignals } from '../types/index.js';

const rtcSignals: RTCSignals = {
  offer: {},
  answer: {}
};

export default rtcSignals;