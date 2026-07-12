// screens/player.js — de trainingsspeler in het donkere designsysteem.
// Grote Anton-cijfers, één primaire actie per scherm, korte uppercase cues,
// noodstop altijd bereikbaar. De flow en alle Engine-aanroepen zijn ongewijzigd.
//
// Belangrijk voor performance: de DOM wordt alléén herbouwd bij een scherm-
// wissel; elke seconde-tick patcht alleen de getallen (geen flikkeren, geen
// verloren taps).

import { Engine, Screen } from '../engine.js';
import { mount, bindActions, fmtTime, escapeHtml } from '../ui.js';
import { illustration, icon } from '../illustrations.js';
import { StopCriteria } from '../safety.js';
import { Coach } from '../coach.js';
import { Listen, parseCommand } from '../listen.js';
import { Store } from '../store.js';
import { DB } from '../db.js';
import { weekOverview, DayKind } from '../program.js';

let lastSig = null;

export function renderPlayer(nav) {
  const e = Engine;
  if (!e.active && e.screen !== Screen.SUMMARY && e.screen !== Screen.STOP) {
    lastSig = null; syncListening(false, nav); return;
  }
  syncListening(true, nav);
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
  const root = mount(`<div class="screen player${e.screen === Screen.STOP ? ' stop' : ''}">${html}</div>`);
  wire(root, nav);
}

// Update alleen de live-waarden, zonder de DOM te herbouwen.
function patch(app, e) {
  const setText = (sel, txt) => { const n = app.querySelector(sel); if (n && n.textContent !== txt) n.textContent = txt; };
  const pf = app.querySelector('.playbar .bar > i');
  if (pf) pf.style.width = Math.round(e.progress * 100) + '%';
  if (e.screen === Screen.GET_READY) setText('.gr-count', String(e.remaining));
  if (e.screen === Screen.REST) setText('.rest-count', fmtTime(e.remaining));
  if (e.screen === Screen.WORK) {
    const ex = e.current;
    if (ex && ex.mode !== 'reps' && ex.mode !== 'swings') setText('.wk-count', fmtTime(e.remaining));
    if (ex && ex.mode === 'swings') setText('.swing-count', String(e.swingCount));
  }
}

// --- spraakbesturing (optioneel, degradeert netjes) -------------------------

let listenNav = null;
function syncListening(wantActive, nav) {
  listenNav = nav;
  const enabled = wantActive && Listen.supported && Store.settings.terugpraten;
  if (enabled && !Listen.active) Listen.start(onVoiceCommand);
  if (!enabled && (Listen.active || Listen._wanted)) Listen.stop();
}
function onVoiceCommand(text) {
  const cmd = parseCommand(text);
  if (!cmd) return;
  const e = Engine;
  if (cmd === 'stop') return e.emergencyStop();
  if (cmd === 'pauze' && !e.paused && (e.screen === Screen.WORK || e.screen === Screen.REST)) return e.togglePause();
  if (cmd === 'hervat' && e.paused) return e.togglePause();
  if (cmd === 'volgende') {
    if (e.screen === Screen.WORK) return e.completeSet();
    if (e.screen === Screen.REST || e.screen === Screen.GET_READY) return e.skipRest();
  }
  if (e.screen === Screen.SUMMARY) {
    if (cmd === 'goed') e.setWellbeing('GOED');
    if (cmd === 'twijfel') e.setWellbeing('TWIJFEL');
    if (cmd === 'pijn') e.setWellbeing('PIJN');
  }
}

// --- bouwstenen ---------------------------------------------------------------

/** "Ronde 2 van 3 · Oefening 1" (uppercase via CSS), of het faselabel. */
function counterText(ex) {
  if (!ex) return '';
  if (ex._round) return `Ronde ${ex._round} van ${ex._roundsTotal} · Oefening ${ex._pos}`;
  return ex.phaseLabel || '';
}

function bar(e) {
  const pct = Math.round(e.progress * 100);
  const mic = Listen.supported && Store.settings.terugpraten && Listen.active
    ? `<span style="color:var(--orange);display:flex" title="Luistert mee">${icon('mic')}</span>` : '';
  return `
  <div class="playbar" style="display:flex;align-items:center;gap:10px">
    <div class="bar" style="flex:1"><i style="width:${pct}%"></i></div>
    ${mic}
  </div>`;
}

/** Max twee korte uppercase cues op het werkscherm. */
function cues(ex) {
  const list = [ex.cue1, ex.cue2].filter(Boolean).slice(0, 2);
  if (!list.length) return '';
  return `<div class="cues">${list.map((c) => `<span class="cue">${escapeHtml(c)}</span>`).join('')}</div>`;
}

function safetyFoot(extra = '') {
  return `
  <div class="playfoot">
    ${extra}
    <button class="feelbtn" data-act="feel">Voelt niet goed</button>
    <button class="emergency" data-act="emergency">Noodstop</button>
  </div>`;
}

// --- views ---------------------------------------------------------------------

function getReadyView(e) {
  const ex = e.current;
  return `
  ${bar(e)}
  <div class="stage ready">
    <p class="roundlabel">${escapeHtml(counterText(ex))}</p>
    <p class="kick" style="margin-top:16px">Maak je klaar</p>
    <div class="timer xl d gr-count">${e.remaining}</div>
    <div style="margin-top:20px">
      <div class="illowrap mid">${illustration(ex ? ex.illu : 'generic', 'mid')}</div>
      <div class="exname md d">${escapeHtml(ex ? ex.naam : '')}</div>
    </div>
  </div>
  ${safetyFoot('<button class="btn primary block" data-act="skipRest">Start nu</button>')}`;
}

function workView(e) {
  const ex = e.current;
  if (!ex) return '';
  if (ex.mode === 'swings') return swingView(e, ex);

  const counter = ex.mode === 'reps'
    ? `<div class="reps d" style="margin-top:6px"><span class="x">×</span>${ex.reps}</div>`
    : `<div class="timer d wk-count" style="margin-top:6px">${fmtTime(e.remaining)}</div>`;
  const primary = ex.mode === 'reps'
    ? '<button class="btn primary block" data-act="completeSet">Klaar</button>'
    : `<div class="ctlrow">
        <button class="btn ghost" data-act="pause">${e.paused ? 'Hervat' : 'Pauze'}</button>
        <button class="btn ghost" data-act="skipEx">Sla over</button>
      </div>`;
  return `
  ${bar(e)}
  <div class="stage work">
    <p class="roundlabel">${escapeHtml(counterText(ex))}</p>
    <div class="illowrap">${illustration(ex.illu)}</div>
    <div class="exname d">${escapeHtml(ex.naam)}</div>
    ${counter}
    ${cues(ex)}
  </div>
  ${safetyFoot(primary)}`;
}

function swingView(e, ex) {
  return `
  ${bar(e)}
  <div class="tapzone" data-act="tap" role="button" aria-label="Tik om een swing te tellen">
    <p class="roundlabel" style="margin-bottom:10px">${escapeHtml(counterText(ex))}</p>
    <p class="kick o" style="font-size:15px;letter-spacing:.2em">Swings</p>
    <div class="mega swing-count">${e.swingCount}</div>
    <p class="cue">Tik om te tellen</p>
  </div>
  <div class="ctlrow" style="margin:14px 0 10px">
    <button class="btn ghost" style="font-size:14px" data-act="undo">Ongedaan maken</button>
    <button class="btn danger" style="font-size:14px;flex:0 0 130px" data-act="completeSet">Klaar</button>
  </div>
  <button class="emergency" style="margin-bottom:20px" data-act="emergency">Noodstop</button>`;
}

function restView(e) {
  const nx = e.next;
  // Praattest bij het begin van elke nieuwe ronde.
  const talk = nx && nx._pos === 1 && nx._round > 1 ? `
    <div class="talkcheck" id="talkCheck">
      <p class="qlabel" style="text-align:center">Kun je nog rustig praten?</p>
      <div class="seg txt">
        <button data-act="talk-ja">Ja</button>
        <button data-act="talk-moeilijk">Net</button>
        <button data-act="talk-nee">Nee, ik hijg</button>
      </div>
    </div>` : '';
  return `
  ${bar(e)}
  <div class="stage rest">
    <p class="roundlabel mut">Rust</p>
    <div class="timer xl d rest-count">${fmtTime(e.remaining)}</div>
    ${nx ? `
    <div style="margin-top:22px;text-align:center">
      <p class="kick o" style="margin-bottom:6px">Volgende</p>
      <div class="illowrap mid">${illustration(nx.illu, 'mid')}</div>
      <div class="exname md d">${escapeHtml(nx.naam)}</div>
      <p class="cue" style="margin-top:8px">${escapeHtml(Coach.restTip(e.index))}</p>
    </div>` : ''}
    ${talk}
  </div>
  ${safetyFoot(`
    <div class="ctlrow">
      <button class="btn ghost" data-act="addRest">+20 sec</button>
      <button class="btn ghost" data-act="skipRest">Sla rust over</button>
    </div>`)}`;
}

function feelingView() {
  return `
  <div class="stage" style="justify-content:center">
    <h1 class="d title-lg">Hoe voel<br>je je?</h1>
  </div>
  <div class="playfoot" style="padding-bottom:24px">
    <button class="btn danger block" data-act="feel-chest">Pijn of druk op de borst</button>
    <button class="btn ghost" data-act="feel-pain">Pijn — nek, schouder of rug</button>
    <button class="btn ghost" data-act="feel-heavy">Te zwaar</button>
    <button class="btn" data-act="feel-back">Terug naar de training</button>
    <p class="cue" style="text-align:center;font-size:12px">Pijn op de borst? Stop en bel 112.</p>
  </div>`;
}

function painLocationView() {
  const locs = [['NEK', 'Nek'], ['SCHOUDER', 'Schouder'], ['RUG', 'Rug'], ['BORST', 'Borst'], ['ANDERS', 'Anders']];
  return `
  <div class="stage" style="justify-content:center">
    <h1 class="d title-lg">Waar zit<br>de pijn?</h1>
  </div>
  <div class="playfoot" style="padding-bottom:24px">
    ${locs.map(([k, l]) => `<button class="btn ${k === 'BORST' ? 'danger block' : 'ghost'}" data-act="loc-${k}">${l}</button>`).join('')}
  </div>`;
}

function recoveryView(e) {
  return `
  <div class="stage" style="text-align:left;align-items:flex-start">
    <p class="kick o">Even gas terug</p>
    <h1 class="d title-xl">Rust nu.</h1>
    <p class="bodytext">${escapeHtml(e.recoveryReason || '')} Ga pas door als het weer goed voelt.</p>
  </div>
  <div class="playfoot">
    <button class="btn primary block" data-act="rec-continue">Rust en ga door</button>
    <button class="btn ghost" data-act="rec-stop">Stop de sessie</button>
  </div>`;
}

function stopView() {
  return `
  <div class="stage stopscreen" style="gap:0">
    <span style="color:var(--danger)"><svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" style="margin-bottom:18px"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg></span>
    <h1 class="d stop-title">${StopCriteria.titel.replace('. ', '.<br>')}</h1>
    <p class="bodytext" style="max-width:300px;text-align:center">${StopCriteria.tekst}</p>
  </div>
  <a class="btn danger block" style="margin-bottom:12px" href="tel:112">Bel 112</a>
  <p class="cue" style="text-align:center;font-size:12px;margin-bottom:12px">${StopCriteria.naMelding}</p>
  <button class="btn ghost" style="margin-bottom:20px" data-act="stop-ack">Begrepen</button>`;
}

function summaryView(e) {
  const s = e.summary || {};
  const label = e.plan && e.plan.variant ? `Training ${e.plan.variant}`
    : (e.type === 'ALLEEN_MOBILITEIT' ? 'Mobiliteit' : 'Training');
  const rounds = (e.plan && e.plan.rounds)
    || ((e.steps || []).find((st) => st._roundsTotal) || {})._roundsTotal || null;
  const row = (l, v, cls = '') => `<div class="rowline"><span class="lbl">${l}</span><span class="val ${cls}">${v}</span></div>`;
  const wb = (k, l) => `<button class="wbopt ${e.wellbeing === k ? 'on' : ''}" data-act="wb-${k}">${l}</button>`;
  return `
  <div class="stage" style="justify-content:flex-start;padding-top:24px;gap:0;align-items:stretch;text-align:left">
    <p class="kick o" style="text-align:center">${escapeHtml(label)} · voltooid</p>
    <h1 class="d" style="font-size:clamp(48px,16vw,64px);line-height:.95;margin-top:8px;text-align:center">Training<br>klaar</h1>

    <div class="rows" style="margin-top:30px">
      ${row('Duur', fmtTime(s.durationSec || 0))}
      ${row('Oefeningen', s.exerciseCount || 0)}
      ${rounds ? row('Rondes', rounds) : ''}
      ${row('Swings', s.totalSwings ? s.totalSwings : '—', 'o')}
      ${(s.painReports || []).length ? row('Pijnmeldingen', s.painReports.length) : ''}
    </div>

    <div style="margin-top:26px;text-align:center">
      <p class="kick">Deze week</p>
      <div class="segs" id="weekSegs" style="max-width:280px;margin:8px auto 0">${'<i></i>'.repeat(5)}</div>
      <p class="cue" id="weekSegsNote" style="margin-top:8px;font-size:13px"></p>
    </div>

    <p class="qlabel" style="margin-top:26px">Hoe voelde het?</p>
    <div class="seg txt">${wb('GOED', 'Goed')}${wb('TWIJFEL', 'Matig')}${wb('PIJN', 'Pijn')}</div>

    <p class="qlabel">Hoe zwaar? <span id="rpeOut" style="color:var(--orange)">${e.rpe != null ? e.rpe : '—'}</span> / 10</p>
    <input type="range" id="rpeSlider" class="slider" min="0" max="10" step="1" value="${e.rpe != null ? e.rpe : 5}" aria-label="Zwaarte 0 tot 10">
  </div>
  <button class="btn primary block" style="margin:18px 0 22px" data-act="summary-done">Klaar</button>`;
}

/** Vul de week-segmenten op de samenvatting async in (geen re-render nodig). */
function fillWeekSegs(root) {
  DB.allSessions().then((sessions) => {
    const days = weekOverview(Store.profile, sessions, new Date());
    const done = days.filter((d) => d.kind !== DayKind.RUST && d.done).length;
    const segs = root.querySelector('#weekSegs');
    const note = root.querySelector('#weekSegsNote');
    if (segs) segs.innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${i < done ? 'on' : ''}"></i>`).join('');
    if (note) note.textContent = `${done} van 5 trainingen`;
  }).catch(() => {});
}

// --- wiring -----------------------------------------------------------------

function wire(root, nav) {
  const rpe = root.querySelector('#rpeSlider');
  if (rpe) {
    rpe.addEventListener('input', () => {
      const out = root.querySelector('#rpeOut');
      if (out) out.textContent = rpe.value;
      Engine.rpe = +rpe.value; // stil bijwerken; geen re-render nodig
    });
  }
  if (Engine.screen === Screen.SUMMARY) fillWeekSegs(root);

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
      case 'wb-GOED':
      case 'wb-TWIJFEL':
      case 'wb-PIJN': {
        // Stil bijwerken + selectie direct in de DOM (geen rebuild op summary).
        Engine.wellbeing = act.slice(3);
        root.querySelectorAll('.wbopt').forEach((b) =>
          b.classList.toggle('on', b.dataset.act === act));
        return;
      }
      case 'summary-done': Engine.saveWellbeing(); return nav('dashboard');
      case 'talk-ja':
      case 'talk-moeilijk': {
        const t = root.querySelector('#talkCheck');
        if (t) t.innerHTML = '<p class="talk-ok" style="text-align:center">Goed — het tempo zit goed.</p>';
        return;
      }
      case 'talk-nee': return Engine.submitTalkTest('NEE');
      default:
        if (act.startsWith('loc-')) return Engine.submitPainLocation(act.slice(4));
    }
  });
}
