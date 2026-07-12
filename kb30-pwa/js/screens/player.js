// screens/player.js — de trainingsspeler. Grote illustratie, tellers, strakke
// werk → rust → volgende flow, met de coach die meepraat. Veiligheid via de
// altijd zichtbare noodstop en de "voelt niet goed"-knop.
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
import { nextTrainingDay, DayKind } from '../program.js';

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
  const root = mount(`<div class="screen">${html}</div>`);
  wire(root, nav);
}

// Update alleen de live-waarden, zonder de DOM te herbouwen.
function patch(app, e) {
  const setText = (sel, txt) => { const n = app.querySelector(sel); if (n && n.textContent !== txt) n.textContent = txt; };
  const pf = app.querySelector('.pbar-fill');
  if (pf) pf.style.width = Math.round(e.progress * 100) + '%';
  if (e.screen === Screen.GET_READY) setText('.big-count', String(e.remaining));
  if (e.screen === Screen.REST) setText('.rest-count', fmtTime(e.remaining));
  if (e.screen === Screen.WORK) {
    const ex = e.current;
    if (ex && ex.mode !== 'reps' && ex.mode !== 'swings') {
      setText('.big-count', workCount(ex, e.remaining));
      const ring = app.querySelector('.big-ring');
      if (ring) ring.style.setProperty('--frac', ex.workSec ? e.remaining / ex.workSec : 0);
    }
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

/** Lange sets (warming-up/cooling-down) als 5:00, korte als losse seconden. */
function workCount(ex, remaining) {
  return ex && ex.workSec > 90 ? fmtTime(remaining) : String(remaining);
}

function counterText(ex) {
  if (!ex) return '';
  if (ex._round) return `Ronde ${ex._round}/${ex._roundsTotal} · Oefening ${ex._pos}/${ex._circuitLen}`;
  return ex.phaseLabel || '';
}

function topBar(e) {
  const pct = Math.round(e.progress * 100);
  const mic = Listen.supported && Store.settings.terugpraten && Listen.active
    ? `<span class="mic-ind" title="Ik luister">${icon('mic')}</span>` : '';
  return `
  <div class="pbar-wrap">
    <div class="pbar"><div class="pbar-fill" style="width:${pct}%"></div></div>
    ${mic}
    <button class="mini-stop" data-act="emergency" aria-label="Noodstop">✕ STOP</button>
  </div>`;
}

function stepsCard(ex, title = 'Zo doe je het') {
  if (!ex || !ex.stappen || !ex.stappen.length) return '';
  return `
  <div class="steps-card">
    <p class="steps-title">${title}</p>
    <ol>${ex.stappen.slice(0, 3).map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
  </div>`;
}

function cueChips(ex, compact = false) {
  const cues = compact ? [ex.cue1] : [ex.cue1, ex.cue2];
  const chips = cues.filter(Boolean)
    .map((c) => `<span class="cue-chip">${escapeHtml(c)}</span>`).join('');
  const kg = ex.gewichtKg ? `<span class="cue-chip kg">${ex.gewichtKg} kg</span>` : '';
  return `<div class="cue-row">${kg}${chips}</div>`;
}

// --- views ---------------------------------------------------------------------

function getReadyView(e) {
  const ex = e.current;
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
    <p class="coach-say">${escapeHtml(Coach.coachName())}: “Rustig beginnen — ik praat je erdoorheen.”</p>
    <button class="btn onlight big" data-act="skipRest">Start nu</button>
    <button class="feel-link" data-act="feel">Voelt niet goed?</button>
  </div>`;
}

function workView(e) {
  const ex = e.current;
  if (!ex) return '';
  const firstRound = ex._round === 1 || !ex._round;
  let counterBlock;
  if (ex.mode === 'reps') {
    counterBlock = `
      <div class="reps"><span class="reps-x">×</span>${ex.reps}</div>
      <p class="reps-hint">Rustig, op je eigen tempo</p>
      <button class="btn onlight big" data-act="completeSet">Klaar ✓</button>`;
  } else if (ex.mode === 'swings') {
    counterBlock = `
      <div class="tap-area" data-act="tap">
        <div class="swing-count">${e.swingCount}</div>
        <div class="swing-hint">tik = +1 swing</div>
      </div>
      <div class="row">
        <button class="btn ghost" data-act="undo">Terug</button>
        <button class="btn onlight" data-act="completeSet">Klaar ✓</button>
      </div>`;
  } else {
    counterBlock = `
      <div class="ring big-ring" style="--frac:${ex.workSec ? e.remaining / ex.workSec : 0}">
        <div class="ring-inner"><div class="big-count">${workCount(ex, e.remaining)}</div></div>
      </div>`;
  }
  return `
  ${topBar(e)}
  <div class="stage work ${ex.mode === 'swings' ? 'swings-mode' : ''}">
    <p class="counter">${escapeHtml(counterText(ex))}</p>
    ${ex.mode === 'swings' ? '' : `<div class="fig-lg">${illustration(ex.illu)}</div>`}
    <h2 class="ex-name">${escapeHtml(ex.naam)}</h2>
    ${cueChips(ex, firstRound && ex.mode !== 'swings')}
    ${counterBlock}
    ${firstRound && ex.mode !== 'swings' ? stepsCard(ex) : ''}
    <div class="row bottom">
      <button class="btn ghost" data-act="pause">${e.paused ? '▶ Hervat' : 'Ⅱ Pauze'}</button>
      <button class="btn ghost" data-act="skipEx">Sla over</button>
    </div>
    <button class="feel-link" data-act="feel">Voelt niet goed?</button>
  </div>`;
}

function restView(e) {
  const nx = e.next;
  // Praattest bij het begin van elke nieuwe ronde (coachend, niet verplicht).
  const talk = nx && nx._pos === 1 && nx._round > 1 ? `
    <div class="talk-check" id="talkCheck">
      <p>Snelle check: kun je nog rustig praten?</p>
      <div class="talk-row">
        <button class="chip light" data-act="talk-ja">Ja hoor</button>
        <button class="chip light" data-act="talk-moeilijk">Het gaat</button>
        <button class="chip light warn" data-act="talk-nee">Nee, ik hijg</button>
      </div>
    </div>` : '';
  return `
  ${topBar(e)}
  <div class="stage rest">
    <p class="rest-label">RUST</p>
    <div class="big-count rest-count">${fmtTime(e.remaining)}</div>
    <p class="coach-say">${escapeHtml(Coach.restTip(e.index))}</p>
    <div class="row">
      <button class="btn ghost" data-act="addRest">+20s</button>
      <button class="btn onlight" data-act="skipRest">Sla over</button>
    </div>
    ${talk}
    ${nx ? `
    <div class="upnext-wrap">
      <span class="upnext-label">Volgende</span>
      <div class="upnext">
        <div class="upnext-fig">${illustration(nx.illu)}</div>
        <div><b>${escapeHtml(nx.naam)}</b><small>${nx.mode === 'reps' ? '× ' + nx.reps : nx.mode === 'swings' ? 'swings' : fmtTime(nx.workSec)}</small></div>
      </div>
    </div>` : `<p class="last-note">Laatste — bijna klaar!</p>`}
    <button class="feel-link" data-act="feel">Voelt niet goed?</button>
  </div>`;
}

function feelingView() {
  return `
  <div class="stage sheet">
    <h2>Hoe voel je je?</h2>
    <p class="muted">Goed dat je het aangeeft — daar zijn we samen voor.</p>
    <button class="btn danger big" data-act="feel-chest">Pijn/druk op de borst</button>
    <button class="btn warn" data-act="feel-pain">Pijn (nek/schouder/rug)</button>
    <button class="btn ghost-dark" data-act="feel-heavy">Te zwaar — ik wil rusten</button>
    <button class="btn ghost-dark" data-act="feel-back">Terug naar de training</button>
    <p class="muted small">Bij pijn op de borst: stop en bel 112.</p>
  </div>`;
}

function painLocationView() {
  const locs = [['NEK', 'Nek'], ['SCHOUDER', 'Schouder'], ['RUG', 'Rug'], ['BORST', 'Borst'], ['ANDERS', 'Anders']];
  return `
  <div class="stage sheet">
    <h2>Waar?</h2>
    ${locs.map(([k, l]) => `<button class="btn ${k === 'BORST' ? 'danger' : 'ghost-dark'}" data-act="loc-${k}">${l}</button>`).join('')}
  </div>`;
}

function recoveryView(e) {
  return `
  <div class="stage sheet recovery">
    <span class="gate-icon">${icon('heart')}</span>
    <h2>Even rustig</h2>
    <p>${escapeHtml(e.recoveryReason || '')} We nemen gas terug — dat is verstandig, niet zwak. Ga pas door als het weer goed voelt.</p>
    <button class="btn rust big" data-act="rec-continue">Rust &amp; ga door</button>
    <button class="btn ghost-dark" data-act="rec-stop">Sessie stoppen</button>
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
  const naam = Coach.userName();
  const row = (l, v) => `<div class="srow"><span>${l}</span><b>${v}</b></div>`;
  const emoji = (k, em, lbl) => `<button class="emoji-sm ${e.wellbeing === k ? 'sel' : ''}" data-act="wb-${k}" aria-label="${lbl}">${em}</button>`;
  const next = nextTrainingDay(Store.profile);
  const nextLine = next
    ? (next.kind === DayKind.KB
      ? `${cap(next.dagNaam)} staat sessie ${next.variant} voor je klaar.`
      : `${cap(next.dagNaam)} doen we rustige mobiliteit.`)
    : '';
  return `
  <div class="stage summary">
    <div class="confetti" aria-hidden="true">${'<i></i>'.repeat(12)}</div>
    <div class="trophy">🏅</div>
    <h2>Goed gedaan, ${escapeHtml(naam)}!</h2>
    <p class="coach-say">${escapeHtml(Coach.summaryTip(s))}</p>
    <div class="sum-card">
      ${row('Duur', fmtTime(s.durationSec || 0))}
      ${row('Oefeningen', s.exerciseCount || 0)}
      ${s.totalSwings ? row('Swings', s.totalSwings) : ''}
      ${(s.painReports || []).length ? row('Pijnmeldingen', s.painReports.length) : ''}
    </div>
    ${nextLine ? `<p class="next-line">${icon('week')} ${escapeHtml(nextLine)}</p>` : ''}
    <p class="wb-q">Hoe voelde het? <small>(optioneel)</small></p>
    <div class="emoji-row">${emoji('GOED', '😊', 'Goed')}${emoji('TWIJFEL', '😐', 'Twijfel')}${emoji('PIJN', '😣', 'Pijn')}</div>
    <label class="rpe-wrap">Hoe zwaar was het? (0–10)
      <input type="range" id="rpeSlider" class="slider" min="0" max="10" step="1" value="${e.rpe != null ? e.rpe : 5}">
      <span class="rpe-out" id="rpeOut">${e.rpe != null ? e.rpe : '—'}</span>
    </label>
    <button class="btn onlight big" data-act="summary-done">Klaar</button>
  </div>`;
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

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
        root.querySelectorAll('.emoji-sm').forEach((b) =>
          b.classList.toggle('sel', b.dataset.act === act));
        return;
      }
      case 'summary-done': Engine.saveWellbeing(); return nav('dashboard');
      case 'talk-ja':
      case 'talk-moeilijk': {
        const t = root.querySelector('#talkCheck');
        if (t) t.innerHTML = '<p class="talk-ok">Mooi zo — dan zit het tempo goed. 👍</p>';
        return;
      }
      case 'talk-nee': return Engine.submitTalkTest('NEE');
      default:
        if (act.startsWith('loc-')) return Engine.submitPainLocation(act.slice(4));
    }
  });
}
