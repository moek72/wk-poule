// screens/onboarding.js — de eenmalige, vriendelijke welkomstflow.
//
// Vervangt het kale waarschuwingsscherm. Vijf rustige stappen: kennismaken met
// de coach, hoe de week werkt, hoe de 12 weken opbouwen, wat de veiligheid
// betekent (mét het arts-advies als één kalme stap) en tot slot je naam.
// Alles wordt in Store.profile bewaard en is terug te vinden in Instellingen.

import { mount, bindActions, escapeHtml } from '../ui.js';
import { Store } from '../store.js';
import { Coach, COACH_NAMEN } from '../coach.js';
import { icon, illustration } from '../illustrations.js';
import { isoDate } from '../program.js';

let step = 0;
let gekozenCoach = null;
let spokeWelcome = false;

export function renderOnboarding(nav, opts) {
  const replay = !!(opts && opts.replay);
  if (gekozenCoach == null) gekozenCoach = Store.profile.coachNaam || 'Sanne';
  const totaal = 5;

  const dots = Array.from({ length: totaal }, (_, i) =>
    `<span class="ob-dot ${i === step ? 'on' : ''} ${i < step ? 'done' : ''}"></span>`).join('');

  const stappen = [stepWelkom, stepWeek, stepOpbouw, stepVeiligheid, stepNaam];
  const root = mount(`
  <div class="onboarding">
    <div class="ob-top">
      <div class="ob-dots">${dots}</div>
      ${replay ? '<button class="ob-close" data-act="ob-exit" aria-label="Sluiten">✕</button>' : ''}
    </div>
    <div class="ob-body">${stappen[step](replay)}</div>
  </div>`);

  // Coach-naam kiezen (stap 1).
  root.querySelectorAll('[data-coach]').forEach((b) => {
    b.addEventListener('click', () => {
      gekozenCoach = b.dataset.coach;
      root.querySelectorAll('[data-coach]').forEach((x) => x.classList.toggle('on', x === b));
      const el = root.querySelector('.ob-coachname');
      if (el) el.textContent = gekozenCoach;
    });
  });

  bindActions(root, (act) => {
    if (act === 'ob-exit') { step = 0; return nav('settings'); }
    if (act === 'ob-back') { step = Math.max(0, step - 1); return renderOnboarding(nav, opts); }
    if (act === 'ob-next') {
      if (step === 0) {
        Store.setProfile({ coachNaam: gekozenCoach });
        if (!spokeWelcome) { spokeWelcome = true; Coach.sayWelcomeOnboarding(); }
      }
      if (step === 3) {
        // Arts-advies rustig bevestigd.
        Store.setProfile({ disclaimerAccepted: true });
      }
      step++;
      return renderOnboarding(nav, opts);
    }
    if (act === 'ob-done') {
      const input = root.querySelector('#obNaam');
      const naam = (input && input.value.trim()) || 'Moek';
      const patch = { naam, coachNaam: gekozenCoach, onboarded: true, disclaimerAccepted: true };
      if (!replay && !Store.profile.startDatum) patch.startDatum = isoDate(new Date());
      Store.setProfile(patch);
      Coach.speak(`Fijn, ${naam}. We beginnen rustig, en ik ben er de hele training bij.`);
      step = 0;
      return nav('dashboard');
    }
  });
}

// --- stappen -----------------------------------------------------------------

function coachAvatar() {
  return `<div class="ob-avatar">${illustration('swing')}</div>`;
}

function actions(backable, nextLabel = 'Verder') {
  return `<div class="ob-actions">
    ${backable ? `<button class="btn ghost" data-act="ob-back">${icon('back')} Terug</button>` : ''}
    <button class="btn primary big" data-act="ob-next">${nextLabel}</button>
  </div>`;
}

function stepWelkom() {
  const chips = COACH_NAMEN.map((n) =>
    `<button class="chip ${n === gekozenCoach ? 'on' : ''}" data-coach="${n}">${n}</button>`).join('');
  return `
  <div class="ob-card">
    ${coachAvatar()}
    <p class="ob-kicker">Welkom bij KB30</p>
    <h1>Hoi! Ik ben <span class="ob-coachname">${escapeHtml(gekozenCoach)}</span>,<br>jouw kettlebell-coach.</h1>
    <p>Samen trainen we thuis met jouw kettlebells van 4 en 8 kilo. Een half uurtje per keer — ik praat je er stap voor stap doorheen.</p>
    <p class="ob-sub">Hoe mag je coach heten?</p>
    <div class="chip-row">${chips}</div>
  </div>
  ${actions(false, 'Leuk, vertel meer')}`;
}

function stepWeek() {
  const rij = (icn, dagen, txt, cls = '') => `
    <div class="ob-week-row ${cls}">
      <span class="ob-week-icon">${icon(icn)}</span>
      <span class="ob-week-days">${dagen}</span>
      <span class="ob-week-txt">${txt}</span>
    </div>`;
  return `
  <div class="ob-card">
    <p class="ob-kicker">Zo werkt je week</p>
    <h1>Vijf beweegmomenten,<br>twee dagen rust.</h1>
    <div class="ob-week">
      ${rij('kb', 'Ma · Wo · Vr', 'Kettlebell-circuit, ±30 min', 'kb')}
      ${rij('mob', 'Di · Do', 'Soepel bewegen, ±20 min', 'mob')}
      ${rij('walk', 'Za · Zo', 'Rust of een wandeling', 'rust')}
    </div>
    <p>Elke oefening is kort: even werken, dan even rust. Ik zeg steeds wat er komt en tel voor je af.</p>
  </div>
  ${actions(true)}`;
}

function stepOpbouw() {
  return `
  <div class="ob-card">
    <p class="ob-kicker">12 weken, 3 fases</p>
    <h1>We bouwen rustig op.</h1>
    <div class="ob-fases">
      <div class="ob-fase"><b>Fase 1</b><span>Week 1–2</span><p>Techniekschool. De basis goed leren, nog geen swings.</p></div>
      <div class="ob-fase"><b>Fase 2</b><span>Week 3–6</span><p>De swing doet mee — als jouw lijf er klaar voor is.</p></div>
      <div class="ob-fase"><b>Fase 3</b><span>Week 7–12</span><p>Iets meer swings en volume, nog steeds op jouw tempo.</p></div>
    </div>
    <p>De swings staan eerst op slot ${icon('lock')} — je speelt ze vrij door zes sessies pijnvrij te trainen. Zo hoort het: eerst techniek, dan kracht.</p>
  </div>
  ${actions(true)}`;
}

function stepVeiligheid() {
  return `
  <div class="ob-card">
    <p class="ob-kicker">Ik let met je mee</p>
    <h1>Veilig trainen, zonder gedoe.</h1>
    <ul class="ob-list">
      <li>${icon('heart')} Voor elke training vraag ik kort hoe het gaat.</li>
      <li>${icon('speaker')} We sturen op gevoel en de praattest — nooit op hartslag.</li>
      <li>${icon('check')} Voelt iets niet goed? Eén tik en we nemen gas terug.</li>
    </ul>
    <div class="ob-arts">
      <p><b>Eén ding vooraf:</b> bespreek dit plan eerst even met je huisarts of cardioloog — vooral de swings. Dan trainen wij daarna met een gerust hart.</p>
    </div>
  </div>
  <div class="ob-actions">
    <button class="btn ghost" data-act="ob-back">${icon('back')} Terug</button>
    <button class="btn primary big" data-act="ob-next">Doe ik — akkoord</button>
  </div>`;
}

function stepNaam(replay) {
  const naam = Store.profile.naam || 'Moek';
  return `
  <div class="ob-card">
    ${coachAvatar()}
    <p class="ob-kicker">Laatste stap</p>
    <h1>Hoe mag ik je noemen?</h1>
    <input type="text" id="obNaam" class="ob-input" value="${escapeHtml(naam)}"
      autocomplete="given-name" maxlength="20" aria-label="Je naam">
    <p class="ob-sub">Dan weet je zeker dat ik het tegen jóu heb.</p>
  </div>
  <div class="ob-actions">
    <button class="btn ghost" data-act="ob-back">${icon('back')} Terug</button>
    <button class="btn primary big" data-act="ob-done">${replay ? 'Bewaar' : 'We gaan beginnen!'}</button>
  </div>`;
}
