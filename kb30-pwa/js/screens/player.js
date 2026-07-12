// screens/player.js — alle in-sessie schermen, gestuurd door de Engine-state.

import { Engine, Screen } from '../engine.js';
import { mount, bindActions, fmtTime, escapeHtml } from '../ui.js';
import { illustration } from '../illustrations.js';
import { Store } from '../store.js';
import {
  PainLocation, TalkTest, StopSymptom, StopCriteria,
} from '../safety.js';

let selectedSymptoms = new Set();

export function renderPlayer(nav) {
  const e = Engine;
  let html = '';
  switch (e.screen) {
    case Screen.PLAYER: html = playerView(e); break;
    case Screen.SWINGS: html = swingsView(e); break;
    case Screen.POST_EXERCISE: html = postExerciseView(e); break;
    case Screen.PAIN_LOCATION: html = painLocationView(e); break;
    case Screen.RPE: html = rpeView(e); break;
    case Screen.TALK_TEST: html = talkTestView(e); break;
    case Screen.RECOVERY: html = recoveryView(e); break;
    case Screen.STOP: html = stopView(e); break;
    case Screen.SUMMARY: html = summaryView(e); break;
    default: html = playerView(e);
  }
  const root = mount(html);
  wire(root, nav);
}

function noodstop() {
  return `<button class="btn danger big noodstop" data-act="emergency">● NOODSTOP</button>`;
}

function playerView(e) {
  const ex = e.current;
  if (!ex) return '';
  const rest = e.segment === 'RUST';
  const paused = e.segment === 'PAUZE';
  const total = rest ? ex.restSec : ex.workSec;
  const frac = total > 0 ? e.remaining / total : 0;
  const colorClass = rest ? 'rust' : 'werk';
  return `
  <div class="player ${colorClass}">
    <div class="ring" style="--frac:${frac}">
      <div class="ring-inner">
        <div class="phase">${rest ? 'RUST' : 'WERK'}</div>
        <div class="time">${fmtTime(e.remaining)}</div>
      </div>
    </div>
    ${rest ? '' : `<div class="fig">${illustration(ex.illustration)}</div>`}
    <h2 class="ex-name">${escapeHtml(ex.naam)}</h2>
    <p class="cue">${escapeHtml(ex.cue1)}</p>
    <p class="cue">${escapeHtml(ex.cue2)}</p>
    ${e.next ? `<p class="next">Straks: ${escapeHtml(e.next.naam)}</p>` : ''}
    <div class="controls">
      ${paused
        ? `<button class="btn good" data-act="resume">Hervat</button>`
        : `<button class="btn" data-act="pause">Pauze</button>`}
      ${rest ? '' : `<button class="btn good" data-act="setDone">Set klaar</button>`}
      <button class="btn" data-act="skip">Overslaan</button>
      <button class="btn warn" data-act="reportPain">Pijn melden</button>
    </div>
    ${noodstop()}
  </div>`;
}

function swingsView(e) {
  return `
  <div class="swings">
    <div class="tap-area" data-act="tap">
      <div class="swing-label">SWINGS</div>
      <div class="swing-count">${e.swingCount}</div>
      <div class="swing-hint">tik = +1 &middot; ${fmtTime(e.remaining)}</div>
    </div>
    <div class="swing-controls">
      <button class="btn" data-act="undo">Terug</button>
      <button class="btn good" data-act="setDone">Set klaar</button>
      <button class="btn danger" data-act="emergency">STOP</button>
    </div>
  </div>`;
}

function postExerciseView(e) {
  return `
  <div class="feedback center">
    <h2>Hoe ging het?</h2>
    <div class="emoji-row">
      <button class="emoji good" data-act="rate-GOED">😊</button>
      <button class="emoji" data-act="rate-TWIJFEL">😐</button>
      <button class="emoji warn" data-act="rate-PIJN">😣</button>
    </div>
  </div>`;
}

function painLocationView() {
  const locs = [
    ['NEK', 'Nek'], ['SCHOUDER', 'Schouder'], ['RUG', 'Rug'],
    ['BORST', 'Borst'], ['ANDERS', 'Anders'],
  ];
  return `
  <div class="feedback center">
    <h2>Waar?</h2>
    <div class="stack">
      ${locs.map(([k, l]) =>
        `<button class="btn ${k === 'BORST' ? 'danger' : ''}" data-act="loc-${k}">${l}</button>`).join('')}
    </div>
  </div>`;
}

function rpeView() {
  return `
  <div class="feedback center rpe">
    <h2>Hoe zwaar? (0–10)</h2>
    <div class="rpe-value" id="rpeVal">5</div>
    <input type="range" min="0" max="10" value="5" id="rpeSlider" class="slider">
    <p class="hint">Doel 4–6: praten moet kunnen.</p>
    <button class="btn good big" data-act="rpe-confirm">Bevestig</button>
  </div>`;
}

function talkTestView() {
  return `
  <div class="feedback center">
    <h2>Kun je nog een hele zin zeggen?</h2>
    <div class="stack">
      <button class="btn good" data-act="talk-JA">Ja</button>
      <button class="btn warn" data-act="talk-MOEILIJK">Moeilijk</button>
      <button class="btn danger" data-act="talk-NEE">Nee</button>
    </div>
  </div>`;
}

function recoveryView(e) {
  return `
  <div class="feedback center recovery">
    <h2>Even rustig</h2>
    <p>${escapeHtml(e.recoveryReason ? e.recoveryReason + ' ' : '')}We nemen gas terug. Rust uit en ga pas door als het weer goed voelt.</p>
    <button class="btn rust big" data-act="rec-continue">Rust &amp; ga door</button>
    <button class="btn" data-act="rec-stop">Sessie stoppen</button>
  </div>`;
}

function stopView() {
  const syms = Object.entries(StopSymptom);
  return `
  <div class="stopscreen">
    <h1>${StopCriteria.titel}</h1>
    <p class="big-text">${StopCriteria.tekst}</p>
    <a class="btn danger big" href="tel:112">Bel 112</a>
    <p class="na">${StopCriteria.naMelding}</p>
    <details class="sym">
      <summary>Klachten aangeven</summary>
      ${syms.map(([k, label]) => `<label><input type="checkbox" data-sym="${k}"> ${escapeHtml(label)}</label>`).join('')}
    </details>
    <button class="btn" data-act="stop-ack">Begrepen</button>
  </div>`;
}

function summaryView(e) {
  const s = e.summary || {};
  const row = (l, v) => `<div class="srow"><span>${l}</span><b>${v}</b></div>`;
  return `
  <div class="summary center">
    <h2>Sessie klaar 🎉</h2>
    ${row('Duur', fmtTime(s.durationSec || 0))}
    ${row('Oefeningen', (s.exerciseNames || []).length)}
    ${row('Swings', s.totalSwings || 0)}
    ${row('Gem. RPE', s.averageRpe != null ? s.averageRpe.toFixed(1) : '—')}
    ${(s.painReports || []).length ? row('Pijnmeldingen', s.painReports.length) : ''}
    <button class="btn good big" data-act="summary-done">Klaar</button>
  </div>`;
}

function wire(root, nav) {
  // RPE slider live-waarde
  const slider = root.querySelector('#rpeSlider');
  if (slider) {
    const val = root.querySelector('#rpeVal');
    slider.addEventListener('input', () => { val.textContent = slider.value; });
  }
  root.querySelectorAll('[data-sym]').forEach((cb) => {
    cb.addEventListener('change', () => {
      if (cb.checked) selectedSymptoms.add(cb.dataset.sym);
      else selectedSymptoms.delete(cb.dataset.sym);
      if (selectedSymptoms.size > 0) Engine.reportSymptoms([...selectedSymptoms], null);
    });
  });

  bindActions(root, (act) => {
    if (act === 'tap') return Engine.addSwing();
    if (act === 'undo') return Engine.undoSwing();
    if (act === 'pause') return Engine.pause();
    if (act === 'resume') return Engine.resume();
    if (act === 'skip') return Engine.skip();
    if (act === 'setDone') return Engine.setDone();
    if (act === 'reportPain') return Engine.reportPainNow();
    if (act === 'emergency') return Engine.emergencyStop();
    if (act.startsWith('rate-')) return Engine.submitRating(act.slice(5));
    if (act.startsWith('loc-')) return Engine.submitPainLocation(act.slice(4));
    if (act === 'rpe-confirm') {
      const v = parseInt(root.querySelector('#rpeSlider').value, 10);
      return Engine.submitRpe(v);
    }
    if (act.startsWith('talk-')) return Engine.submitTalkTest(act.slice(5));
    if (act === 'rec-continue') return Engine.recoveryContinue();
    if (act === 'rec-stop') return Engine.recoveryStop();
    if (act === 'stop-ack') { selectedSymptoms = new Set(); Engine.acknowledgeStop(); nav('dashboard'); }
    if (act === 'summary-done') { Engine.dismissSummary(); nav('dashboard'); }
  });
}
