// screens/main.js — disclaimer, dashboard en dagelijkse check-in.

import { mount, bindActions } from '../ui.js';
import { Store } from '../store.js';
import { DB } from '../db.js';
import { Engine } from '../engine.js';
import { Bridge, Paths } from '../bridge.js';
import {
  evaluateStart, epochDay, SessionType, PainLocation, applyChestEvent,
} from '../safety.js';

// --- eerste opstart: disclaimer ------------------------------------------
export function renderDisclaimer(nav) {
  const root = mount(`
  <div class="card center disclaimer">
    <h1>Welkom, Moek 👋</h1>
    <p>Bespreek dit programma eerst met je huisarts of cardioloog — vooral de swings.</p>
    <p class="muted">Deze app let mee op je klachten, maar vervangt geen arts. Bij pijn op de borst: stop en bel 112.</p>
    <button class="btn good big" data-act="ok">Ik heb dit gelezen</button>
  </div>`);
  bindActions(root, (act) => {
    if (act === 'ok') { Store.setProfile({ disclaimerAccepted: true }); nav('dashboard'); }
  });
}

// --- dashboard ------------------------------------------------------------
export async function renderDashboard(nav) {
  const sessions = await DB.allSessions().catch(() => []);
  const streak = computeStreak(sessions);
  const week = weekDots(sessions);
  const blocked = Date.now() < Store.block.chestBlockUntilEpochMs;

  const root = mount(`
  <div class="dashboard">
    <header class="topbar">
      <h1>KB30</h1>
      <button class="icon-btn" data-act="settings" aria-label="Instellingen">⚙️</button>
    </header>
    <div class="card today">
      <div class="today-head">
        <span class="streak">🔥 ${streak}</span>
        <span class="conn">${Bridge.available ? (Bridge.connected ? '⌚ verbonden' : '⌚ gekoppeld') : ''}</span>
      </div>
      <p class="today-sub">Klaar voor je beweegmoment?</p>
      ${blocked ? `<p class="warn-banner">Kettlebells 48u op pauze na een borstklacht — alleen mobiliteit.</p>` : ''}
      <button class="btn good big" data-act="start">Start training</button>
    </div>
    <div class="week">${week}</div>
    <div class="card quick">
      <h3>Snel invoeren</h3>
      <div class="quick-row">
        <label>Gewicht (kg)<input type="number" id="qWeight" step="0.1" inputmode="decimal"></label>
        <label>Buik (cm)<input type="number" id="qWaist" step="0.1" inputmode="decimal"></label>
      </div>
      <button class="btn" data-act="saveMeasure">Bewaar meting</button>
    </div>
    <nav class="tabbar">
      <button data-act="library">📚 Oefeningen</button>
      <button data-act="progress">📈 Voortgang</button>
      <button data-act="settings">⚙️ Instellingen</button>
    </nav>
  </div>`);

  bindActions(root, async (act) => {
    if (act === 'start') return nav('checkin');
    if (act === 'settings') return nav('settings');
    if (act === 'library') return nav('library');
    if (act === 'progress') return nav('progress');
    if (act === 'saveMeasure') {
      const w = parseFloat(root.querySelector('#qWeight').value);
      const c = parseFloat(root.querySelector('#qWaist').value);
      if (!isNaN(w) || !isNaN(c)) {
        await DB.putMeasurement({
          datum: new Date().toISOString().slice(0, 10),
          gewichtKg: isNaN(w) ? null : w, buikomtrekCm: isNaN(c) ? null : c,
        });
        root.querySelector('#qWeight').value = '';
        root.querySelector('#qWaist').value = '';
        flash(root, 'Meting bewaard ✓');
      }
    }
  });
}

// --- dagelijkse check-in --------------------------------------------------
export function renderCheckin(nav) {
  const root = mount(`
  <div class="card checkin">
    <button class="back" data-act="back">← terug</button>
    <h2>Check-in</h2>

    <label class="q">Energie vandaag</label>
    <div class="seg" id="energy">
      ${[1, 2, 3, 4, 5].map((n) => `<button data-e="${n}" class="${n === 3 ? 'on' : ''}">${n}</button>`).join('')}
    </div>

    <label class="q">Pijn op dit moment?</label>
    <div class="seg" id="pain">
      ${[['GEEN', 'Geen'], ['NEK', 'Nek'], ['SCHOUDER', 'Schouder'], ['RUG', 'Rug'], ['BORST', 'Borst'], ['ANDERS', 'Anders']]
        .map(([k, l]) => `<button data-p="${k}" class="${k === 'GEEN' ? 'on' : ''}">${l}</button>`).join('')}
    </div>

    <label class="q pill">Vandaag pijnstillers (bijv. Oxycodon) genomen?</label>
    <div class="seg" id="pk">
      <button data-k="ja" class="wide">Ja</button>
      <button data-k="nee" class="wide on">Nee</button>
    </div>

    <button class="btn good big" data-act="go">Naar de training</button>
  </div>`);

  let energy = 3, pain = 'GEEN', painkiller = false;
  root.querySelectorAll('#energy button').forEach((b) =>
    b.addEventListener('click', () => { energy = +b.dataset.e; setOn(root, '#energy', b); }));
  root.querySelectorAll('#pain button').forEach((b) =>
    b.addEventListener('click', () => { pain = b.dataset.p; setOn(root, '#pain', b); }));
  root.querySelectorAll('#pk button').forEach((b) =>
    b.addEventListener('click', () => { painkiller = b.dataset.k === 'ja'; setOn(root, '#pk', b); }));

  bindActions(root, (act) => {
    if (act === 'back') return nav('dashboard');
    if (act === 'go') return startFromCheckin({ energy, pain, painkiller }, nav);
  });
}

function startFromCheckin({ energy, pain, painkiller }, nav) {
  const now = Date.now();
  const today = epochDay(now);

  // Pijn op de borst bij de check-in = direct stopcriteria.
  if (pain === PainLocation.BORST) {
    const block = applyChestEvent(Store.block, now);
    Store.setBlock(block);
    Bridge.putState(Paths.BLOCK, JSON.stringify(block));
    Engine.active = true; Engine.segment = 'STOP'; Engine.screen = 'STOP';
    Engine._emit();
    return nav('player');
  }

  // Pijnstiller-antwoord vastleggen in de gedeelde blokkade (geldt ook op horloge).
  let block = { ...Store.block, painkillerDay: today, painkillerTaken: painkiller, version: Store.block.version + 1 };
  Store.setBlock(block);
  Bridge.putState(Paths.BLOCK, JSON.stringify(block));

  const decision = evaluateStart(block, now, today);
  let type = decision.kettlebellAllowed
    ? (energy <= 2 || pain !== 'GEEN' ? SessionType.LICHT : SessionType.NORMAAL)
    : SessionType.ALLEEN_MOBILITEIT;

  if (!decision.kettlebellAllowed) {
    const root = mount(`
    <div class="card center">
      <h2>Even opletten</h2>
      <p>${decision.messageNl}</p>
      <button class="btn rust big" data-act="mob">Alleen mobiliteit</button>
      <button class="btn" data-act="back">Terug</button>
    </div>`);
    bindActions(root, (act) => {
      if (act === 'back') return nav('dashboard');
      if (act === 'mob') { Engine.start(SessionType.ALLEEN_MOBILITEIT, false, true); nav('player'); }
    });
    return;
  }

  Engine.start(type, !!block.swingsUnlocked, true);
  nav('player');
}

// --- helpers --------------------------------------------------------------
function setOn(root, sel, btn) {
  root.querySelectorAll(`${sel} button`).forEach((b) => b.classList.remove('on'));
  btn.classList.add('on');
}
function flash(root, msg) {
  const d = document.createElement('div');
  d.className = 'flash';
  d.textContent = msg;
  root.appendChild(d);
  setTimeout(() => d.remove(), 1600);
}
function computeStreak(sessions) {
  const days = new Set(sessions.filter((s) => s.voltooid).map((s) => s.datum));
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) { streak++; d.setDate(d.getDate() - 1); } else break;
  }
  return streak;
}
function weekDots(sessions) {
  const done = new Set(sessions.filter((s) => s.voltooid).map((s) => s.datum));
  const dots = [];
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // maandag
  for (let i = 0; i < 5; i++) {
    const key = d.toISOString().slice(0, 10);
    dots.push(`<span class="dot ${done.has(key) ? 'on' : ''}"></span>`);
    d.setDate(d.getDate() + 1);
  }
  return `<div class="dots">${dots.join('')}</div>`;
}
