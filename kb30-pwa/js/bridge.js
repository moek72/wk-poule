// bridge.js — koppeling telefoon(PWA) ↔ horloge via de native Data Layer.
//
// In een gewone browser bestaat er geen brug: dan werkt de PWA volledig
// standalone (Bridge.available === false) en gebeurt er simpelweg geen sync.
// In de native KB30-telefoon-app injecteert de WebView `window.KB30Bridge`
// (@JavascriptInterface) en levert inkomende berichten via `window.onKb30*`.

export const Paths = Object.freeze({
  SESSION: '/kb30/session',
  BLOCK: '/kb30/block',
  SWINGS: '/kb30/swings',
  CTRL_START: '/kb30/ctrl/start',
  CTRL_PAUSE: '/kb30/ctrl/pause',
  CTRL_RESUME: '/kb30/ctrl/resume',
  CTRL_SKIP: '/kb30/ctrl/skip',
  CTRL_SET_DONE: '/kb30/ctrl/set_done',
  CTRL_EMERGENCY: '/kb30/ctrl/emergency',
  PAIN_REPORT: '/kb30/pain',
  RPE: '/kb30/rpe',
  TALK_TEST: '/kb30/talktest',
  SUMMARY: '/kb30/summary',
});

const handlers = new Set();       // (path, payloadObj) => void
const connHandlers = new Set();   // (connected:boolean) => void

export const Bridge = {
  get available() {
    return typeof window !== 'undefined' && !!window.KB30Bridge;
  },
  connected: false,

  putState(path, jsonString) {
    if (!this.available) return;
    try { window.KB30Bridge.putData(path, jsonString); } catch (e) { console.warn('putData', e); }
  },
  sendControl(path, payloadObj = {}) {
    if (!this.available) return;
    try { window.KB30Bridge.sendMessage(path, JSON.stringify(payloadObj)); } catch (e) { console.warn('sendMessage', e); }
  },

  onMessage(cb) { handlers.add(cb); return () => handlers.delete(cb); },
  onConnection(cb) { connHandlers.add(cb); return () => connHandlers.delete(cb); },
};

// Native → PWA entry points (aangeroepen door de Android WebView).
if (typeof window !== 'undefined') {
  window.onKb30Message = (path, jsonString) => {
    let payload = {};
    try { payload = jsonString ? JSON.parse(jsonString) : {}; } catch { payload = {}; }
    handlers.forEach((cb) => {
      try { cb(path, payload); } catch (e) { console.warn('bridge handler', e); }
    });
  };
  window.onKb30Connected = (connected) => {
    Bridge.connected = !!connected;
    connHandlers.forEach((cb) => cb(Bridge.connected));
  };
}
