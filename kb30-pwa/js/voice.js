// voice.js — stem (Web Speech nl-NL), piepjes (Web Audio fallback) en trillen.
// Audio wordt pas ná de eerste tap geïnitialiseerd (iOS-eis).

import { Store } from './store.js';

let audioCtx = null;

export function initAudioOnGesture() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch { audioCtx = null; }
}

function beep(freq = 880, ms = 120, type = 'sine', gain = 0.15) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g).connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  osc.start(now);
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000);
  osc.stop(now + ms / 1000);
}

export function say(text) {
  if (!Store.settings.stem) return;
  try {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'nl-NL';
      u.rate = 1.0;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
      return;
    }
  } catch { /* val terug op piep */ }
  beep(660, 100);
}

export function vibrate(pattern) {
  if (!Store.settings.trillen) return;
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch { /* niet ondersteund */ }
}

// Cues met eigen geluid + trilling.
export const Cue = {
  workStart() { beep(880, 150, 'square'); vibrate(200); say('Start'); },
  restStart() { beep(440, 180, 'sine'); vibrate([120, 100, 120]); say('Rust'); },
  tick(n) { beep(1000, 60, 'square', 0.1); vibrate(60); if (n) say(String(n)); },
  setEnd() { beep(660, 120); beep(990, 200); vibrate([150, 80, 250]); },
  swingTick() { beep(1200, 30, 'square', 0.08); vibrate(35); },
  safety() { beep(300, 400, 'sawtooth', 0.2); vibrate([400, 150, 400, 150, 400]); },
};
