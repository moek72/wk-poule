// screens/main.js — dashboard (dagplan + week/fase-info) en dagelijkse
// check-in, in het donkere designsysteem. Het weekprogramma uit program.js
// bepaalt wat er vandaag op het plan staat; alle veiligheidspoorten
// (borstblokkade, pijnstillers) blijven exact gelijk.

import { mount, bindActions, tabbar, handleNav, escapeHtml } from '../ui.js';
import { Store } from '../store.js';
import { DB } from '../db.js';
import { Engine } from '../engine.js';
import { Bridge, Paths } from '../bridge.js';
import { icon } from '../illustrations.js';
import {
  planFor, weekOverview, formatDayNL, DayKind, isoDate, DAG_LANG,
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
  const blocked = Date.now() < Store.block.chestBlockUntilEpochMs;
  const doneToday = week.some((d) => d.isToday && d.done);
  const trainDaysDone = week.filter((d) => d.kind !== DayKind.RUST && d.done).length;
  const unlocked = !!Store.block.swingsUnlocked;
  const lastDay = lastTrainingDay(sessions, now);

  const root = mount(`
  <div class="screen has-nav dashboard">
    <div class="top">
      <div class="brand">KB<b>30</b></div>
      <button class="iconbtn" data-act="nav-settings" aria-label="Instellingen">${icon('gear')}</button>
    </div>

    <div style="margin-top:26px">
      <p class="kick o">Vandaag · ${escapeHtml(formatDayNL(now))}</p>
      <h1 class="d title-xl">${escapeHtml(dayTitle(plan))}</h1>
      <p class="d subtitle">${escapeHtml(daySub(plan))}</p>
    </div>

    ${blocked ? `<p class="blocknote">Kettlebells 48 uur op pauze na een borstklacht.<br>Vandaag alleen rustige mobiliteit.</p>` : ''}

    <div style="margin-top:26px">${heroAction(plan, blocked, doneToday)}</div>

    <div class="spacer"></div>

    <div class="rows" style="margin-bottom:8px">
      <div class="rowline">
        <span class="lbl">Week</span>
        <span style="display:flex;align-items:center;gap:14px">
          <span class="bar" style="width:120px"><i style="width:${Math.round((plan.week / 12) * 100)}%"></i></span>
          <span class="val">${plan.week} <small>/ 12</small></span>
        </span>
      </div>
      <div class="rowline">
        <span class="lbl">Deze week</span>
        <span class="val o">${trainDaysDone} <small>/ 5</small></span>
      </div>
      <div class="rowline ${unlocked ? '' : 'lockrow'}">
        <span class="lbl">Swings</span>
        ${unlocked
          ? '<span class="val o">Vrij</span>'
          : `<span class="val">${icon('lock')} Vergrendeld</span>`}
      </div>
      <div class="rowline">
        <span class="lbl">Laatste training</span>
        <span class="val txt">${escapeHtml(lastDay)}</span>
      </div>
    </div>

    ${tabbar('dashboard')}
  </div>`);

  bindActions(root, (act) => {
    if (handleNav(act, nav)) return;
    if (act === 'start' || act === 'start-mob') return nav('checkin', act === 'start-mob' ? { forceMob: true } : null);
  });
}

function dayTitle(plan) {
  if (plan.kind === DayKind.KB) return `Training ${plan.variant}`;
  if (plan.kind === DayKind.MOBILITEIT) return 'Mobiliteit';
  return 'Rust';
}

function daySub(plan) {
  if (plan.kind === DayKind.KB) return `Kettlebell · ${plan.duurMin} min`;
  if (plan.kind === DayKind.MOBILITEIT) return `Herstel · ${plan.duurMin} min`;
  return 'Herstel of wandeling';
}

function heroAction(plan, blocked, doneToday) {
  if (blocked) {
    return `<button class="btn primary block" data-act="start-mob">Rustige mobiliteit</button>`;
  }
  if (plan.kind === DayKind.RUST) {
    return `<button class="btn ghost block" data-act="start-mob">Toch bewegen? Mobiliteit</button>`;
  }
  return `<button class="btn primary block" data-act="start">Start training</button>
    ${doneToday ? '<p class="kick" style="margin-top:12px;text-align:center">Vandaag al gedaan</p>' : ''}`;
}

function lastTrainingDay(sessions, now) {
  const done = (sessions || []).filter((s) => s.voltooid && s.datum)
    .sort((a, b) => (a.datum < b.datum ? 1 : -1));
  if (!done.length) return '—';
  const d = new Date(done[0].datum + 'T12:00:00');
  if (done[0].datum === isoDate(now)) return 'Vandaag';
  const naam = DAG_LANG[d.getDay()];
  return naam.charAt(0).toUpperCase() + naam.slice(1);
}

// --- dagelijkse check-in --------------------------------------------------
export function renderCheckin(nav, opts) {
  const forceMob = !!(opts && opts.forceMob);
  const plan = planFor(new Date(), Store.profile);
  const root = mount(`
  <div class="screen checkin">
    <div class="top">
      <div class="brand" style="font-size:20px">Check-in</div>
      <button class="iconbtn" data-act="back" aria-label="Terug">✕</button>
    </div>

    <div style="margin-top:14px">
      <p class="qlabel" style="margin-top:6px">Energie</p>
      <div class="seg" id="energy">
        ${[1, 2, 3, 4, 5].map((n) => `<button data-e="${n}" class="${n === 3 ? 'on' : ''}" aria-label="Energie ${n}">${n}</button>`).join('')}
      </div>

      <p class="qlabel">Pijn op dit moment?</p>
      <div class="seg txt wrap" id="pain">
        ${[['GEEN', 'Geen'], ['NEK', 'Nek'], ['SCHOUDER', 'Schouder'], ['RUG', 'Rug'], ['BORST', 'Borst'], ['ANDERS', 'Anders']]
          .map(([k, l]) => `<button data-p="${k}" class="${k === 'GEEN' ? 'on' : ''}">${l}</button>`).join('')}
      </div>

      <p class="qlabel">Vandaag pijnstillers genomen?</p>
      <div class="seg txt" id="pk">
        <button data-k="ja">Ja</button>
        <button data-k="nee" class="on">Nee</button>
      </div>
    </div>

    <div class="spacer"></div>
    <button class="btn primary block" style="margin-bottom:22px" data-act="go">Verder</button>
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
    <div class="screen gate">
      <div class="stage" style="text-align:left;align-items:flex-start">
        <p class="kick o">Vandaag anders</p>
        <h1 class="d title-xl">Geen<br>kettlebells.</h1>
        <p class="bodytext">${escapeHtml(decision.messageNl)}</p>
      </div>
      <div class="playfoot">
        <button class="btn primary block" data-act="mob">Alleen mobiliteit</button>
        <button class="btn ghost" data-act="back">Terug</button>
      </div>
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
