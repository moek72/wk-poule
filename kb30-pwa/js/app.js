// app.js — router, opstart en tweerichtingssync met het horloge.

import { Store } from './store.js';
import { Engine } from './engine.js';
import { Bridge, Paths } from './bridge.js';
import { SwingLedger } from './swingLedger.js';
import { blockFromObj } from './safety.js';
import { DB } from './db.js';
import { initAudioOnGesture } from './voice.js';
import { renderDisclaimer, renderDashboard, renderCheckin } from './screens/main.js';
import { renderPlayer } from './screens/player.js';
import { renderProgress, renderLibrary, renderSettings, applyTheme } from './screens/more.js';
import { mount, bindActions } from './ui.js';

let route = 'dashboard';
let routeArg = null;

export function nav(to, arg = null) {
  route = to;
  routeArg = arg;
  render();
}

function render() {
  switch (route) {
    case 'disclaimer': return renderDisclaimer(nav);
    case 'disclaimer-view': return renderDisclaimerView();
    case 'dashboard': return renderDashboard(nav);
    case 'checkin': return renderCheckin(nav);
    case 'player': return renderPlayer(nav);
    case 'progress': return renderProgress(nav);
    case 'library': return renderLibrary(nav, routeArg);
    case 'settings': return renderSettings(nav);
    default: return renderDashboard(nav);
  }
}

function renderDisclaimerView() {
  const root = mount(`
  <div class="card center disclaimer">
    <h1>Arts-advies</h1>
    <p>Bespreek dit programma eerst met je huisarts of cardioloog — vooral de swings.</p>
    <p class="muted">Bij pijn/druk op de borst, uitstraling, duizeligheid, abnormale kortademigheid of hartkloppingen: stop direct en bel 112.</p>
    <button class="btn" data-act="back">Terug</button>
  </div>`);
  bindActions(root, (a) => { if (a === 'back') nav('settings'); });
}

// Re-render the player live whenever the engine changes state.
Engine.on(() => { if (route === 'player') renderPlayer(nav); });

// Centrale sync met het horloge (SWINGS/BLOCK/SESSION/SUMMARY).
Bridge.onMessage((path, payload) => {
  switch (path) {
    case Paths.SWINGS:
      Store.mergeLedger(SwingLedger.fromJSON(payload));
      if (route === 'player') renderPlayer(nav);
      break;
    case Paths.BLOCK:
      Store.mergeBlock(blockFromObj(payload));
      break;
    case Paths.SESSION:
      if (payload && payload.origin === 'watch') {
        Engine.adoptWatchSession(payload);
        if (route !== 'player') nav('player');
      }
      break;
    case Paths.SUMMARY:
      // Het horloge bewaart geen historie; de telefoon slaat de sessie op.
      if (payload && payload.sessionId) {
        DB.putSession({
          id: payload.sessionId, datum: new Date().toISOString().slice(0, 10),
          type: payload.type, oefeningen: [], voltooid: true, duurSec: payload.durationSec || 0,
          totaalSwings: payload.totalSwings, gemRpe: payload.averageRpe,
        }).catch(() => {});
      }
      break;
    default: break;
  }
});
Bridge.onConnection(() => { if (route === 'dashboard') renderDashboard(nav); });

// Init audio pas na de eerste tap (iOS).
window.addEventListener('pointerdown', function once() {
  initAudioOnGesture();
  window.removeEventListener('pointerdown', once);
}, { once: true });

// Boot.
export function boot() {
  applyTheme();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  nav(Store.profile.disclaimerAccepted ? 'dashboard' : 'disclaimer');
  // Meld initiële blokkadestatus aan het horloge als er een brug is.
  if (Bridge.available) Bridge.putState(Paths.BLOCK, JSON.stringify(Store.block));
}

boot();
