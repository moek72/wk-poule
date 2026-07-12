// app.js — router, opstart en tweerichtingssync met het horloge.

import { Store } from './store.js';
import { Engine } from './engine.js';
import { Bridge, Paths } from './bridge.js';
import { SwingLedger } from './swingLedger.js';
import { blockFromObj } from './safety.js';
import { DB } from './db.js';
import { initAudioOnGesture } from './voice.js';
import { Coach } from './coach.js';
import { Listen } from './listen.js';
import { renderOnboarding } from './screens/onboarding.js';
import { renderDashboard, renderCheckin } from './screens/main.js';
import { renderPlayer } from './screens/player.js';
import { renderProgress, renderLibrary, renderSettings, applyTheme } from './screens/more.js';
import { mount, bindActions, tabbar } from './ui.js';

let route = 'dashboard';
let routeArg = null;

export function nav(to, arg = null) {
  if (to !== route) Coach.stopSpeech(); // spraak niet laten stapelen
  route = to;
  routeArg = arg;
  render();
}

function render() {
  switch (route) {
    case 'onboarding':
    case 'disclaimer': return renderOnboarding(nav, routeArg);
    case 'disclaimer-view': return renderDisclaimerView();
    case 'dashboard': return renderDashboard(nav);
    case 'checkin': return renderCheckin(nav, routeArg);
    case 'player': return renderPlayer(nav);
    case 'progress': return renderProgress(nav);
    case 'library': return renderLibrary(nav, routeArg);
    case 'settings': return renderSettings(nav);
    default: return renderDashboard(nav);
  }
}

function renderDisclaimerView() {
  const root = mount(`
  <div class="screen has-nav disclaimer">
    <p class="kick o" style="margin-top:8px">Veiligheid</p>
    <h1 class="d title-xl">Arts-advies</h1>
    <p class="bodytext">Bespreek dit programma eerst met je huisarts of cardioloog — vooral de swings.</p>
    <p class="bodytext mut">Bij pijn of druk op de borst, uitstraling naar arm, kaak of rug, duizeligheid, abnormale kortademigheid of hartkloppingen: stop direct en bel 112.</p>
    <p class="bodytext mut">Deze app vervangt geen arts.</p>
    <div class="spacer"></div>
    <button class="btn ghost block" style="margin-bottom:18px" data-act="back">Terug</button>
    ${tabbar('settings')}
  </div>`);
  bindActions(root, (a) => { if (a === 'back' || a === 'nav-settings') nav('settings'); else if (a.startsWith('nav-')) nav(a.slice(4)); });
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

// Debug handle (handig in de console; ongevaarlijk). Bijv. window.KB30.Engine.
window.KB30 = { Engine, Store, Bridge, Coach, Listen, nav };

// Boot.
export function boot() {
  applyTheme();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  nav(Store.profile.onboarded || Store.profile.disclaimerAccepted ? 'dashboard' : 'onboarding');
  // Meld initiële blokkadestatus aan het horloge als er een brug is.
  if (Bridge.available) Bridge.putState(Paths.BLOCK, JSON.stringify(Store.block));
}

boot();
