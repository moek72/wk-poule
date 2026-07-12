// screens/main.js — dashboard (dagplan + weekstrip + fase) en dagelijkse
// check-in. De coach spreekt je hier met naam aan; het weekprogramma uit
// program.js bepaalt wat er vandaag op het plan staat.

import { mount, bindActions, tabbar, handleNav, escapeHtml } from '../ui.js';
import { Store } from '../store.js';
import { DB } from '../db.js';
import { Engine } from '../engine.js';
import { Bridge, Paths } from '../bridge.js';
import { Coach } from '../coach.js';
import { icon } from '../illustrations.js';
import {
  planFor, weekOverview, phaseForWeek, formatDayNL, DayKind, isoDate,
} from '../program.js';
import {
  evaluateStart, epochDay, SessionType, PainLocation, applyChestEvent,
} from '../safety.js';

// --- dashboard ------------------------------------------------------------
export async function renderDashboard(nav) {
  // Startdatum vastleggen als die er nog niet is (bestaande gebruikers).
  if (!Store.profile.startDatum) Store.setProfile({ startDatum: isoDate(new Date()) });

  const sessions = await DB.allSessions().catch(() => []);
  const now = new Date();
  const plan = planFor(now, Store.profile);
  const week = weekOverview(Store.profile, sessions, now);
  const streak = computeStreak(sessions);
  const blocked = Date.now() < Store.block.chestBlockUntilEpochMs;
  const doneToday = week.some((d) => d.isToday && d.done);
  const trainDaysDone = week.filter((d) => d.kind !== DayKind.RUST && d.done).length;

  const root = mount(`
  <div class="dashboard page">
    <header class="topbar">
      <div class="hello">
        <p class="hello-hi">${Coach.greeting()},</p>
        <h1 class="hello-name">${escapeHtml(Coach.userName())}</h1>
      </div>
      <div class="streak-pill" title="Dagen op rij">${icon('flame')}<b>${streak}</b></div>
    </header>

    <section class="card hero hero-${plan.icon}">
      <p class="kicker">Vandaag · ${formatDayNL(now)}</p>
      <div class="hero-main">
        <span class="hero-icon">${icon(plan.icon)}</span>
        <div class="hero-txt">
          <h2>${escapeHtml(plan.titel)}</h2>
          <p class="hero-sub">${escapeHtml(plan.sub)}${plan.duurMin ? ` · ±${plan.duurMin} min` : ''}</p>
        </div>
      </div>
      <div class="coach-line">
        <span class="coach-badge">${escapeHtml(Coach.coachName().slice(0, 1))}</span>
        <p>${escapeHtml(blocked
          ? `Even pas op de plaats, ${Coach.userName()}. De kettlebells rusten nog — vandaag doen we het zacht.`
          : Coach.dashLine(plan))}</p>
      </div>
      ${blocked ? `<p class="warn-banner">${icon('heart')} Kettlebells 48 uur op pauze na een borstklacht. Vandaag alleen rustige mobiliteit — dat is even precies goed.</p>` : ''}
      ${heroAction(plan, blocked, doneToday)}
    </section>

    <section class="card week-card">
      <div class="card-head">
        <h3>${icon('week')} Deze week</h3>
        <span class="card-head-note">${trainDaysDone} van 5 gedaan</span>
      </div>
      <div class="week-strip">${week.map(dayCell).join('')}</div>
    </section>

    <section class="card phase-card">
      <div class="card-head">
        <h3>Week ${plan.week} van 12</h3>
        <span class="phase-chip">Fase ${plan.fase} · ${escapeHtml(plan.faseNaam)}</span>
      </div>
      <div class="phase-bar">${phaseBar(plan.week)}</div>
      <p class="phase-note">${escapeHtml(plan.faseUitleg)} ${swingNote(plan)}</p>
    </section>

    <section class="card quick">
      <div class="card-head"><h3>Snel invoeren</h3></div>
      <div class="quick-row">
        <label>Gewicht (kg)<input type="number" id="qWeight" step="0.1" inputmode="decimal" placeholder="—"></label>
        <label>Buik (cm)<input type="number" id="qWaist" step="0.1" inputmode="decimal" placeholder="—"></label>
        <button class="btn small" data-act="saveMeasure">Bewaar</button>
      </div>
    </section>

    ${tabbar('dashboard')}
  </div>`);

  bindActions(root, async (act) => {
    if (handleNav(act, nav)) return;
    if (act === 'start' || act === 'start-mob') return nav('checkin', act === 'start-mob' ? { forceMob: true } : null);
    if (act === 'saveMeasure') {
      const w = parseFloat(root.querySelector('#qWeight').value);
      const c = parseFloat(root.querySelector('#qWaist').value);
      if (!isNaN(w) || !isNaN(c)) {
        await DB.putMeasurement({
          datum: isoDate(new Date()),
          gewichtKg: isNaN(w) ? null : w, buikomtrekCm: isNaN(c) ? null : c,
        });
        root.querySelector('#qWeight').value = '';
        root.querySelector('#qWaist').value = '';
        flash(root, 'Meting bewaard ✓');
      }
    }
  });
}

function heroAction(plan, blocked, doneToday) {
  if (blocked) {
    return `<button class="btn rust big" data-act="start-mob">Rustige mobiliteit</button>`;
  }
  if (plan.kind === DayKind.RUST) {
    return `
      <p class="rest-note">Vandaag geen sessie — een rustige wandeling is goud waard.</p>
      <button class="btn ghost-dark" data-act="start-mob">Toch iets doen? Rustige mobiliteit</button>`;
  }
  const label = doneToday ? 'Nog een keer? Start training' : 'Start training';
  return `<button class="btn primary big" data-act="start">${doneToday ? `${label}` : label}</button>
    ${doneToday ? '<p class="done-note">Vandaag al gedaan — lekker bezig!</p>' : ''}`;
}

function dayCell(d) {
  const cls = ['wday', d.isToday ? 'today' : '', d.done ? 'done' : '', d.kind === DayKind.RUST ? 'restday' : ''].join(' ');
  return `
  <div class="${cls}">
    <span class="wday-label">${d.label}</span>
    <span class="wday-icon">${d.done ? icon('check') : icon(d.icon)}</span>
  </div>`;
}

function phaseBar(week) {
  let out = '';
  for (let w = 1; w <= 12; w++) {
    const ph = phaseForWeek(w).fase;
    out += `<span class="pb-seg f${ph} ${w < week ? 'past' : ''} ${w === week ? 'now' : ''}"></span>`;
  }
  return out;
}

function swingNote(plan) {
  const unlocked = !!Store.block.swingsUnlocked;
  if (plan.fase === 1) return 'Swings komen vanaf week 3 — eerst de basis.';
  if (unlocked) return 'Swings zijn vrijgespeeld — mooi verdiend!';
  return 'Swings staan nog op slot: zes sessies pijnvrij speelt ze vrij.';
}

// --- dagelijkse check-in --------------------------------------------------
export function renderCheckin(nav, opts) {
  const forceMob = !!(opts && opts.forceMob);
  const plan = planFor(new Date(), Store.profile);
  const naam = Coach.userName();
  const root = mount(`
  <div class="card checkin page">
    <button class="back" data-act="back">${icon('back')} Terug</button>
    <p class="kicker">Even inchecken</p>
    <h2>Hoe gaat het vandaag, ${escapeHtml(naam)}?</h2>
    <p class="muted">Drie korte vragen — dan stel ik de training goed voor je in.</p>

    <label class="q">Hoeveel energie heb je?</label>
    <div class="seg" id="energy">
      ${[1, 2, 3, 4, 5].map((n) => `<button data-e="${n}" class="${n === 3 ? 'on' : ''}" aria-label="Energie ${n}">${n}</button>`).join('')}
    </div>
    <p class="seg-note"><span>weinig</span><span>veel</span></p>

    <label class="q">Heb je nu ergens pijn?</label>
    <div class="seg" id="pain">
      ${[['GEEN', 'Nee'], ['NEK', 'Nek'], ['SCHOUDER', 'Schouder'], ['RUG', 'Rug'], ['BORST', 'Borst'], ['ANDERS', 'Anders']]
        .map(([k, l]) => `<button data-p="${k}" class="${k === 'GEEN' ? 'on' : ''}">${l}</button>`).join('')}
    </div>

    <label class="q">Vandaag pijnstillers (bijv. Oxycodon) genomen?</label>
    <div class="seg" id="pk">
      <button data-k="ja" class="wide">Ja</button>
      <button data-k="nee" class="wide on">Nee</button>
    </div>

    <button class="btn primary big" data-act="go">Naar de training</button>
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
    if (act === 'go') return startFromCheckin({ energy, pain, painkiller, plan, forceMob }, nav);
  });
}

function startFromCheckin({ energy, pain, painkiller, plan, forceMob }, nav) {
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
  const block = { ...Store.block, painkillerDay: today, painkillerTaken: painkiller, version: Store.block.version + 1 };
  Store.setBlock(block);
  Bridge.putState(Paths.BLOCK, JSON.stringify(block));

  const decision = evaluateStart(block, now, today);
  const wilMobiliteit = forceMob || plan.kind !== DayKind.KB;

  if (!decision.kettlebellAllowed && !wilMobiliteit) {
    const root = mount(`
    <div class="card center page gate-card">
      <span class="gate-icon">${icon('heart')}</span>
      <h2>Vandaag doen we het anders</h2>
      <p>${escapeHtml(decision.messageNl)}</p>
      <p class="muted">Geen zorgen — soepel bewegen telt ook. Ik doe gewoon met je mee.</p>
      <button class="btn rust big" data-act="mob">Alleen mobiliteit</button>
      <button class="btn ghost-dark" data-act="back">Terug</button>
    </div>`);
    bindActions(root, (act) => {
      if (act === 'back') return nav('dashboard');
      if (act === 'mob') { Engine.start(SessionType.ALLEEN_MOBILITEIT, false, true, plan); nav('player'); }
    });
    return;
  }

  let type;
  if (wilMobiliteit || !decision.kettlebellAllowed) {
    type = SessionType.ALLEEN_MOBILITEIT;
  } else {
    type = (energy <= 2 || pain !== 'GEEN') ? SessionType.LICHT : SessionType.NORMAAL;
  }

  const swings = type !== SessionType.ALLEEN_MOBILITEIT
    && !!block.swingsUnlocked && plan.fase >= 2;
  Engine.start(type, swings, true, plan);
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
    const key = isoDate(d);
    if (days.has(key)) { streak++; d.setDate(d.getDate() - 1); } else break;
  }
  return streak;
}
