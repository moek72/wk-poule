// screens/player.js — Fitify-achtige speler. Grote illustratie, tellers,
// strakke werk → rust → volgende flow. Veiligheid via de kleine noodstop en de
// "voelt niet goed"-knop.

import { Engine, Screen } from '../engine.js';
import { mount, bindActions, fmtTime, escapeHtml } from '../ui.js';
import { illustration } from '../illustrations.js';
import { StopCriteria } from '../safety.js';

let lastSig = null;

// To keep the timer screens smooth (no flicker, taps don't get lost), we only
// rebuild the DOM when the *screen structure* changes. Each timer tick just
// patches the dynamic numbers (countdown, ring, progress bar, swing count).
export function renderPlayer(nav) {
  const e = Engine;
  if (!e.active && e.screen !== Screen.SUMMARY && e.screen !== Screen.STOP) { lastSig = null; return; }
  const app = document.getElementById('app');
  const sig = `${e.screen}|${e.current && e.current.id}|${e.index}|${e.paused}`;
  if (lastSig === sig && app.querySelector('.screen')) { patch(app, e); return; }
  lastSig = sig;

  let html;
  switch (e.screen) {
    case Screen.GET_READY: html = getReadyView(e); break;
    case Screen.WORK: html = workView(e); break;
    case Screen.REST: html = restView(e); break;
    case Screen.FEELING: html = feelingView(e); break;
    case Screen.PAIN_LOCATION: html = painLocationView(e); break;
    case Screen.RECOVERY: html = recoveryView(e); break;
    case Screen.STOP: html = stopView(e); break;
    case Screen.SUMMARY: html = summaryView(e); break;
    default: html = workView(e);
  }
  const root = mount(`<div class="screen">${html}</div>`);
  wire(root, nav);
}

// Update only the live values, without rebuilding the DOM.
function patch(app, e) {
  const setText = (sel, txt) => { const n = app.querySelector(sel); if (n && n.textContent !== txt) n.textContent = txt; };
  const pf = app.querySelector('.pbar-fill');
  if (pf) pf.style.width = Math.round(e.progress * 100) + '%';
  if (e.screen === Screen.GET_READY) setText('.big-count', String(e.remaining));
  if (e.screen === Screen.REST) setText('.rest-count', fmtTime(e.remaining));
  if (e.screen === Screen.WORK) {
    const ex = e.current;
    if (ex && ex.mode !== 'reps' && ex.mode !== 'swings') {
      setText('.big-count', String(e.remaining));
      const ring = app.querySelector('.big-ring');
      if (ring) ring.style.setProperty('--frac', ex.workSec ? e.remaining / ex.workSec : 0);
    }
    if (ex && ex.mode === 'swings') setText('.swing-count', String(e.swingCount));
  }
}

function counterText(ex) {
  if (!ex) return '';
  if (ex._round) return `Ronde ${ex._round}/${ex._roundsTotal} · Oefening ${ex._pos}/${ex._circuitLen}`;
  return ex.phaseLabel || '';
}

function topBar(e) {
  const pct = Math.round(e.progress * 100);
  return `
  <div class="pbar-wrap">
    <div class="pbar"><div class="pbar-fill" style="width:${pct}%"></div></div>
    <button class="mini-stop" data-act="emergency" aria-label="Noodstop">✕ stop</button>
  </div>`;
}

function getReadyView(e) {
  const ex = e.next && e.index === 0 ? e.current : e.current; // eerste oefening
  return `
  ${topBar(e)}
  <div class="stage ready">
    <p class="counter">${escapeHtml(counterText(ex))}</p>
    <p class="ready-label">Maak je klaar…</p>
    <div class="big-count">${e.remaining}</div>
    <div class="upnext">
      <div class="upnext-fig">${illustration(ex ? ex.illu : 'generic')}</div>
      <div><b>${escapeHtml(ex ? ex.naam : '')}</b><small>${escapeHtml(ex ? ex.cue1 : '')}</small></div>
    </div>
    <button class="btn good big" data-act="skipRest">Start nu</button>
    <button class="feel-link" data-act="feel">Voelt niet goed?</button>
  </div>`;
}

function workView(e) {
  const ex = e.current;
  if (!ex) return '';
  let counterBlock;
  if (ex.mode === 'reps') {
    counterBlock = `
      <div class="reps"><span class="reps-x">×</span>${ex.reps}</div>
      <p class="reps-hint">Rustig, op je eigen tempo</p>
      <button class="btn good big" data-act="completeSet">Klaar ✓</button>`;
  } else if (ex.mode === 'swings') {
    counterBlock = `
      <div class="tap-area" data-act="tap">
        <div class="swing-count">${e.swingCount}</div>
        <div class="swing-hint">tik = +1 swing</div>
      </div>
      <div class="row">
        <button class="btn ghost" data-act="undo">Terug</button>
        <button class="btn good" data-act="completeSet">Klaar ✓</button>
      </div>`;
  } else {
    counterBlock = `
      <div class="ring big-ring" style="--frac:${ex.workSec ? e.remaining / ex.workSec : 0}">
        <div class="ring-inner"><div class="big-count">${e.remaining}</div></div>
      </div>`;
  }
  return `
  ${topBar(e)}
  <div class="stage work">
    <p class="counter">${escapeHtml(counterText(ex))}</p>
    <div class="fig-lg">${illustration(ex.illu)}</div>
    <h2 class="ex-name">${escapeHtml(ex.naam)}</h2>
    <p class="cue">${escapeHtml(ex.cue1)}</p>
    ${counterBlock}
    <div class="row bottom">
      <button class="btn ghost" data-act="pause">${e.paused ? 'Hervat' : 'Pauze'}</button>
      <button class="btn ghost" data-act="skipEx">Sla over</button>
    </div>
    <button class="feel-link" data-act="feel">Voelt niet goed?</button>
  </div>`;
}

function restView(e) {
  const nx = e.next;
  return `
  ${topBar(e)}
  <div class="stage rest">
    <p class="rest-label">RUST</p>
    <div class="big-count rest-count">${fmtTime(e.remaining)}</div>
    <div class="row">
      <button class="btn ghost" data-act="addRest">+20s</button>
      <button class="btn good" data-act="skipRest">Sla over</button>
    </div>
    ${nx ? `
    <div class="upnext-wrap">
      <span class="upnext-label">Volgende</span>
      <div class="upnext">
        <div class="upnext-fig">${illustration(nx.illu)}</div>
        <div><b>${escapeHtml(nx.naam)}</b><small>${nx.mode === 'reps' ? '× ' + nx.reps : nx.mode === 'swings' ? 'swings' : fmtTime(nx.workSec)}</small></div>
      </div>
    </div>` : `<p class="muted">Laatste — bijna klaar!</p>`}
    <button class="feel-link" data-act="feel">Voelt niet goed?</button>
  </div>`;
}

function feelingView() {
  return `
  <div class="stage sheet">
    <h2>Hoe voel je je?</h2>
    <button class="btn danger big" data-act="feel-chest">Pijn/druk op de borst</button>
    <button class="btn warn" data-act="feel-pain">Pijn (nek/schouder/rug)</button>
    <button class="btn" data-act="feel-heavy">Te zwaar — ik wil rusten</button>
    <button class="btn ghost" data-act="feel-back">Terug naar de training</button>
    <p class="muted small">Bij pijn op de borst: stop en bel 112.</p>
  </div>`;
}

function painLocationView() {
  const locs = [['NEK', 'Nek'], ['SCHOUDER', 'Schouder'], ['RUG', 'Rug'], ['BORST', 'Borst'], ['ANDERS', 'Anders']];
  return `
  <div class="stage sheet">
    <h2>Waar?</h2>
    ${locs.map(([k, l]) => `<button class="btn ${k === 'BORST' ? 'danger' : ''}" data-act="loc-${k}">${l}</button>`).join('')}
  </div>`;
}

function recoveryView(e) {
  return `
  <div class="stage sheet recovery">
    <h2>Even rustig</h2>
    <p>${escapeHtml(e.recoveryReason || '')} We nemen gas terug. Ga pas door als het weer goed voelt.</p>
    <button class="btn rust big" data-act="rec-continue">Rust &amp; ga door</button>
    <button class="btn ghost" data-act="rec-stop">Sessie stoppen</button>
  </div>`;
}

function stopView() {
  return `
  <div class="stage stopscreen">
    <h1>${StopCriteria.titel}</h1>
    <p class="big-text">${StopCriteria.tekst}</p>
    <a class="btn danger big" href="tel:112">Bel 112</a>
    <p class="na">${StopCriteria.naMelding}</p>
    <button class="btn ghost" data-act="stop-ack">Begrepen</button>
  </div>`;
}

function summaryView(e) {
  const s = e.summary || {};
  const row = (l, v) => `<div class="srow"><span>${l}</span><b>${v}</b></div>`;
  const emoji = (k, em) => `<button class="emoji-sm ${e.wellbeing === k ? 'sel' : ''}" data-act="wb-${k}">${em}</button>`;
  return `
  <div class="stage summary">
    <div class="trophy">🏅</div>
    <h2>Sessie klaar!</h2>
    <div class="sum-card">
      ${row('Duur', fmtTime(s.durationSec || 0))}
      ${row('Oefeningen', s.exerciseCount || 0)}
      ${row('Swings', s.totalSwings || 0)}
      ${(s.painReports || []).length ? row('Pijnmeldingen', s.painReports.length) : ''}
    </div>
    <p class="wb-q">Hoe voelde het? <small>(optioneel)</small></p>
    <div class="emoji-row">${emoji('GOED', '😊')}${emoji('TWIJFEL', '😐')}${emoji('PIJN', '😣')}</div>
    <button class="btn good big" data-act="summary-done">Klaar</button>
  </div>`;
}

function wire(root, nav) {
  bindActions(root, (act) => {
    switch (act) {
      case 'emergency': return Engine.emergencyStop();
      case 'pause': return Engine.togglePause();
      case 'skipRest': return Engine.skipRest();
      case 'addRest': return Engine.addRest(20);
      case 'skipEx': return Engine.skipExercise();
      case 'completeSet': return Engine.completeSet();
      case 'tap': return Engine.addSwing();
      case 'undo': return Engine.undoSwing();
      case 'feel': return Engine.openFeeling();
      case 'feel-back': return Engine.closeFeeling();
      case 'feel-chest': return Engine.emergencyStop();
      case 'feel-heavy': return Engine.feelingTooHeavy();
      case 'feel-pain': return Engine.feelingPain();
      case 'rec-continue': return Engine.recoveryContinue();
      case 'rec-stop': return Engine.recoveryStop();
      case 'stop-ack': Engine.acknowledgeStop(); return nav('dashboard');
      case 'wb-GOED': return Engine.setWellbeing('GOED');
      case 'wb-TWIJFEL': return Engine.setWellbeing('TWIJFEL');
      case 'wb-PIJN': return Engine.setWellbeing('PIJN');
      case 'summary-done': Engine.saveWellbeing(); return nav('dashboard');
      default:
        if (act.startsWith('loc-')) return Engine.submitPainLocation(act.slice(4));
    }
  });
}
