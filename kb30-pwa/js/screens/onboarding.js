// screens/onboarding.js — eenmalige introductie. Minimaal en serieus, in het
// donkere designsysteem: wat het programma is, hoe de week werkt, de opbouw,
// het arts-advies (expliciet akkoord) en je naam. Gesproken begeleiding is een
// neutrale aan/uit-keuze — geen coach-persona.
//
// Bewaart in Store.profile: disclaimerAccepted, naam, startDatum, onboarded.

import { mount, bindActions, escapeHtml } from '../ui.js';
import { Store } from '../store.js';
import { isoDate } from '../program.js';

let step = 0;

export function renderOnboarding(nav, opts) {
  const replay = !!(opts && opts.replay);
  const totaal = 5;
  const dots = Array.from({ length: totaal }, (_, i) =>
    `<i class="${i === step ? 'on' : i < step ? 'done' : ''}"></i>`).join('');

  const stappen = [stepWelkom, stepWeek, stepOpbouw, stepVeiligheid, stepNaam];
  const { body, nextLabel, nextAct } = stappen[step](replay);

  const root = mount(`
  <div class="screen onboarding">
    <div class="top">
      <div class="obdots">${dots}</div>
      ${replay ? '<button class="iconbtn" data-act="ob-exit" aria-label="Sluiten">✕</button>' : ''}
    </div>
    <div class="ob-body">${body}</div>
    <div class="ob-foot">
      ${step > 0 ? '<button class="btn ghost" data-act="ob-back">Terug</button>' : ''}
      <button class="btn primary block" data-act="${nextAct}">${nextLabel}</button>
    </div>
  </div>`);

  const voiceSw = root.querySelector('#obVoice');
  if (voiceSw) voiceSw.addEventListener('click', () => {
    Store.setSettings({ stem: !Store.settings.stem });
    voiceSw.querySelector('.sw').classList.toggle('on', Store.settings.stem);
    voiceSw.setAttribute('aria-checked', String(Store.settings.stem));
  });

  bindActions(root, (act) => {
    if (act === 'ob-exit') { step = 0; return nav('settings'); }
    if (act === 'ob-back') { step = Math.max(0, step - 1); return renderOnboarding(nav, opts); }
    if (act === 'ob-next') {
      if (step === 3) Store.setProfile({ disclaimerAccepted: true });
      step++;
      return renderOnboarding(nav, opts);
    }
    if (act === 'ob-done') {
      const input = root.querySelector('#obNaam');
      const naam = (input && input.value.trim()) || 'Moek';
      const patch = { naam, onboarded: true, disclaimerAccepted: true };
      if (!replay && !Store.profile.startDatum) patch.startDatum = isoDate(new Date());
      Store.setProfile(patch);
      step = 0;
      return nav('dashboard');
    }
  });
}

// --- stappen -----------------------------------------------------------------

function stepWelkom() {
  return {
    nextLabel: 'Verder', nextAct: 'ob-next',
    body: `
    <p class="kick o">KB30 · Kettlebell-programma</p>
    <h1 class="d title-xl">12 weken.<br>30 min per keer.</h1>
    <p class="bodytext">Trainen met je eigen kettlebells van 4 en 8 kilo. Kort en doelgericht, met een veilige opbouw.</p>
    <div class="rows" style="margin-top:22px">
      <button class="srow" id="obVoice" role="switch" aria-checked="${!!Store.settings.stem}">
        <span><span class="t">Gesproken begeleiding</span>
        <span class="s" style="display:block">Telt af en zegt wat er komt</span></span>
        <span class="sw ${Store.settings.stem ? 'on' : ''}"></span>
      </button>
    </div>`,
  };
}

function stepWeek() {
  return {
    nextLabel: 'Verder', nextAct: 'ob-next',
    body: `
    <p class="kick o">Het weekritme</p>
    <h1 class="d title-xl">5 dagen<br>per week.</h1>
    <div class="rows" style="margin-top:22px">
      <div class="rowline"><span class="lbl">Ma · Wo · Vr</span><span class="val txt">Kettlebell · 30 min</span></div>
      <div class="rowline"><span class="lbl">Di · Do</span><span class="val txt">Mobiliteit · 20 min</span></div>
      <div class="rowline"><span class="lbl">Za · Zo</span><span class="val txt">Rust</span></div>
    </div>
    <p class="bodytext mut">Korte blokken werk, korte rust. De app telt af en zegt wat er komt.</p>`,
  };
}

function stepOpbouw() {
  return {
    nextLabel: 'Verder', nextAct: 'ob-next',
    body: `
    <p class="kick o">De opbouw</p>
    <h1 class="d title-xl">3 fases.</h1>
    <div class="fases">
      <div class="fase"><b>1</b><span class="fw">Week 1–2</span><p>Techniek. De basis goed leren, nog geen swings.</p></div>
      <div class="fase"><b>2</b><span class="fw">Week 3–6</span><p>Swings doen mee — pas na zes pijnvrije sessies.</p></div>
      <div class="fase"><b>3</b><span class="fw">Week 7–12</span><p>Meer volume en meer swings, op eigen tempo.</p></div>
    </div>
    <p class="bodytext mut">Swings staan eerst op slot. Zes pijnvrije sessies spelen ze vrij.</p>`,
  };
}

function stepVeiligheid() {
  return {
    nextLabel: 'Akkoord', nextAct: 'ob-next',
    body: `
    <p class="kick o">Veiligheid</p>
    <h1 class="d title-xl">Eerst<br>even dit.</h1>
    <p class="bodytext">Bespreek dit programma met je huisarts of cardioloog — vooral de swings.</p>
    <p class="bodytext mut">Pijn of druk op de borst, uitstraling naar arm, kaak of rug, duizeligheid of abnormale kortademigheid: stop direct en bel 112. Na een borstklacht staan de kettlebells 48 uur op pauze.</p>
    <p class="bodytext mut">Deze app vervangt geen arts.</p>`,
  };
}

function stepNaam(replay) {
  const naam = Store.profile.naam || 'Moek';
  return {
    nextLabel: replay ? 'Bewaar' : 'Start', nextAct: 'ob-done',
    body: `
    <p class="kick o">Laatste stap</p>
    <h1 class="d title-xl">Je naam.</h1>
    <p class="bodytext mut">Voor de gesproken begeleiding.</p>
    <input type="text" id="obNaam" class="txtinput" style="margin-top:18px" value="${escapeHtml(naam)}"
      autocomplete="given-name" maxlength="20" aria-label="Je naam">`,
  };
}
