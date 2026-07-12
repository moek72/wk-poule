// screens/more.js — voortgang (grafieken), bibliotheek en instellingen.

import { mount, bindActions, tabbar, handleNav, escapeHtml } from '../ui.js';
import { Store } from '../store.js';
import { DB } from '../db.js';
import { Bridge, Paths } from '../bridge.js';
import { StopCriteria } from '../safety.js';
import { EXERCISES, MOBILITY } from '../data/exercises.js';
import { illustration, icon } from '../illustrations.js';
import { Coach } from '../coach.js';
import { Listen } from '../listen.js';
import { currentWeek, phaseForWeek } from '../program.js';

// --- voortgang ------------------------------------------------------------
export async function renderProgress(nav) {
  const [sessions, measurements] = await Promise.all([
    DB.allSessions().catch(() => []),
    DB.allMeasurements().catch(() => []),
  ]);
  const done = sessions.filter((s) => s.voltooid);
  const ms = measurements.slice().sort((a, b) => (a.datum < b.datum ? -1 : 1));
  const weight = ms.filter((m) => m.gewichtKg != null).map((m) => m.gewichtKg);
  const waist = ms.filter((m) => m.buikomtrekCm != null).map((m) => m.buikomtrekCm);
  const totalSwings = done.reduce((n, s) => n + (s.totaalSwings || 0)
    + (s.oefeningen || []).reduce((k, o) => k + (o.swings || 0), 0), 0);
  const totalMin = Math.round(done.reduce((n, s) => n + (s.duurSec || 0), 0) / 60);
  const week = currentWeek(Store.profile);
  const ph = phaseForWeek(week);

  const moedig = done.length === 0
    ? 'Je eerste sessie is de belangrijkste. Ik sta klaar wanneer jij dat bent.'
    : done.length < 5
      ? `Al ${done.length} ${done.length === 1 ? 'sessie' : 'sessies'} gedaan — de opbouw is begonnen!`
      : `${done.length} sessies, ${totalMin} minuten bewogen. Daar mag je trots op zijn.`;

  const root = mount(`
  <div class="page progress">
    <header class="pagehead">
      <h1>Voortgang</h1>
      <span class="phase-chip">Week ${week} · Fase ${ph.fase}</span>
    </header>
    <div class="coach-line card">
      <span class="coach-badge">${escapeHtml(Coach.coachName().slice(0, 1))}</span>
      <p>${escapeHtml(moedig)}</p>
    </div>
    <div class="stat-row">
      <div class="stat"><b>${done.length}</b><span>sessies</span></div>
      <div class="stat"><b>${totalMin}</b><span>minuten</span></div>
      <div class="stat"><b>${totalSwings}</b><span>swings</span></div>
    </div>
    <section class="card">
      <div class="card-head"><h3>Sessies per week</h3><span class="card-head-note">doel: 5</span></div>
      ${weekBars(done)}
    </section>
    <section class="card">
      <div class="card-head"><h3>Gewicht</h3></div>
      ${lineChart(weight, 'kg')}
    </section>
    <section class="card">
      <div class="card-head"><h3>Buikomtrek</h3></div>
      ${lineChart(waist, 'cm')}
    </section>
    ${tabbar('progress')}
  </div>`);
  bindActions(root, (act) => { handleNav(act, nav); });
}

function emptyState(txt) {
  return `<div class="empty">
    <span class="empty-icon">${icon('chart')}</span>
    <p>${txt}</p>
  </div>`;
}

function lineChart(values, unit) {
  if (!values.length) return emptyState(`Nog geen metingen. Vul ze in op het dashboard bij “Snel invoeren”.`);
  const w = 300, h = 90, pad = 8;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const step = values.length > 1 ? (w - 2 * pad) / (values.length - 1) : 0;
  const pts = values.map((v, i) => {
    const x = pad + i * step;
    const y = h - pad - ((v - min) / range) * (h - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const last = values[values.length - 1];
  const [lx, ly] = pts.split(' ').pop().split(',');
  return `<svg viewBox="0 0 ${w} ${h}" class="chart">
    <polyline points="${pts}" fill="none" stroke="var(--brand)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${lx}" cy="${ly}" r="4" fill="var(--brand)"/>
    <text x="${pad}" y="12" class="ct">${max} ${unit}</text>
    <text x="${pad}" y="${h - 2}" class="ct">${min} ${unit}</text>
    <text x="${w - pad}" y="12" text-anchor="end" class="ct strong">nu: ${last} ${unit}</text>
  </svg>`;
}

function weekBars(sessions) {
  const byWeek = {};
  sessions.forEach((s) => {
    const wk = isoWeek(new Date(s.datum));
    byWeek[wk] = (byWeek[wk] || 0) + 1;
  });
  const weeks = Object.keys(byWeek).sort().slice(-8);
  if (!weeks.length) return emptyState('Nog geen sessies — na je eerste training zie je hier je week-ritme groeien.');
  const maxv = Math.max(...weeks.map((k) => byWeek[k]), 5);
  return `<div class="bars">${weeks.map((k) =>
    `<div class="bar"><div class="bar-fill" style="height:${(byWeek[k] / maxv) * 70}px"></div><span>${byWeek[k]}</span></div>`).join('')}</div>`;
}
function isoWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const wk = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(wk).padStart(2, '0')}`;
}

// --- bibliotheek ----------------------------------------------------------
export function renderLibrary(nav, detailId) {
  if (detailId) return renderExerciseDetail(nav, detailId);
  const kracht = EXERCISES.filter((e) => !e.isSwing);
  const swings = EXERCISES.filter((e) => e.isSwing);
  const unlocked = !!Store.block.swingsUnlocked;

  const item = (e, locked = false) => `
    <button class="lib-item ${locked ? 'locked' : ''}" data-act="open-${e.id}">
      <span class="lib-fig">${illustration(e.illu)}</span>
      <span class="lib-txt">
        <b>${escapeHtml(e.naam)}</b>
        <small>${(e.spieren || []).join(', ')}${e.gewichtKg ? ` · ${e.gewichtKg} kg` : ''}${e.fase ? ' · fase ' + e.fase : ''}${locked ? ' · 🔒' : ''}</small>
      </span>
      ${locked ? `<span class="lib-lock">${icon('lock')}</span>` : ''}
    </button>`;

  const root = mount(`
  <div class="page library">
    <header class="pagehead"><h1>Oefeningen</h1></header>
    <p class="muted">Alles staand, max 8 kg, veilig voor rug en nek. Tik voor uitleg.</p>
    <h3 class="lib-sec">Kracht</h3>
    <div class="lib-list">${kracht.map((e) => item(e)).join('')}</div>
    <h3 class="lib-sec">Swings ${unlocked ? '· vrijgespeeld ✓' : '· nog op slot'}</h3>
    ${unlocked ? '' : `<p class="muted small">Zes pijnvrije sessies spelen de swings vrij — dat is je fase 2.</p>`}
    <div class="lib-list">${swings.map((e) => item(e, !unlocked)).join('')}</div>
    <h3 class="lib-sec">Mobiliteit &amp; herstel</h3>
    <div class="lib-list">${MOBILITY.map((e) => item(e)).join('')}</div>
    ${tabbar('library')}
  </div>`);
  bindActions(root, (act) => {
    if (handleNav(act, nav)) return;
    if (act.startsWith('open-')) return nav('library', act.slice(5));
  });
}

function renderExerciseDetail(nav, id) {
  const e = EXERCISES.find((x) => x.id === id) || MOBILITY.find((x) => x.id === id);
  if (!e) return nav('library');
  const locked = e.isSwing && !Store.block.swingsUnlocked;
  const root = mount(`
  <div class="page detail">
    <button class="back" data-act="back">${icon('back')} Oefeningen</button>
    <div class="detail-fig">${illustration(e.illu)}</div>
    <h2>${escapeHtml(e.naam)}</h2>
    <p class="muted">${(e.spieren || []).join(', ')}${e.gewichtKg ? ` · ${e.gewichtKg} kg` : ' · zonder gewicht'}${e.fase ? ' · fase ' + e.fase : ''}</p>
    ${locked ? `<p class="warn-banner">${icon('lock')} Nog op slot tot fase 2 is vrijgespeeld — zes sessies pijnvrij, dan mag hij mee.</p>` : ''}
    ${e.waarom ? `<div class="why-box"><b>Waarom deze oefening?</b> ${escapeHtml(e.waarom)}</div>` : ''}
    <h3>Zo doe je het</h3>
    <ol class="detail-steps">${(e.stappen || []).map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
    <div class="warn-box"><b>Let op:</b> ${escapeHtml(e.waarschuwing || '')}</div>
  </div>`);
  bindActions(root, (act) => { if (act === 'back') nav('library'); });
}

// --- instellingen ---------------------------------------------------------
export function renderSettings(nav) {
  const s = Store.settings;
  const blocked = Date.now() < Store.block.chestBlockUntilEpochMs;
  const voices = Coach.dutchVoices();
  const chosen = Coach.pickVoice();

  const root = mount(`
  <div class="page settings">
    <header class="pagehead"><h1>Instellingen</h1></header>

    <section class="card">
      <div class="card-head"><h3>Jij &amp; je coach</h3></div>
      <label class="field">Jouw naam
        <input type="text" id="setNaam" value="${escapeHtml(Store.profile.naam || 'Moek')}" maxlength="20">
      </label>
      <label class="field">Naam van je coach
        <input type="text" id="setCoach" value="${escapeHtml(Store.profile.coachNaam || 'Sanne')}" maxlength="20">
      </label>
      <button class="btn small" data-act="saveNames">Bewaar namen</button>
      <button class="btn ghost-dark" data-act="replayIntro">Bekijk de uitleg opnieuw</button>
    </section>

    <section class="card">
      <div class="card-head"><h3>${icon('speaker')} Stem van de coach</h3></div>
      ${toggle('stem', 'Coach praat mee (stem aan)', s.stem)}
      ${voices.length ? `
        <label class="field">Kies een stem
          <select id="voiceSel">
            ${voices.map((v) => `<option value="${escapeHtml(v.voiceURI)}" ${chosen && v.voiceURI === chosen.voiceURI ? 'selected' : ''}>${escapeHtml(v.name)}</option>`).join('')}
          </select>
        </label>`
    : `<p class="muted small">Geen Nederlandse stem gevonden op dit apparaat — de coach gebruikt dan de standaardstem.</p>`}
      <button class="btn small" data-act="testVoice">Test de stem</button>
      ${Listen.supported ? `
        <div class="divider"></div>
        ${toggle('terugpraten', 'Terugpraten (spraakbesturing)', s.terugpraten)}
        <p class="muted small">${icon('mic')} Zeg tijdens de training “volgende”, “pauze”, “hervat” of “stop”.
        Hiervoor vraagt je telefoon eenmalig toestemming voor de microfoon. Knoppen blijven altijd gewoon werken.</p>` : ''}
    </section>

    <section class="card">
      <div class="card-head"><h3>Weergave &amp; feedback</h3></div>
      <label class="field">Thema
        <div class="seg" id="themaSeg">
          ${[['auto', 'Auto'], ['licht', 'Licht'], ['donker', 'Donker']]
      .map(([k, l]) => `<button data-thema="${k}" class="${(s.thema || 'auto') === k ? 'on' : ''}">${l}</button>`).join('')}
        </div>
      </label>
      ${toggle('trillen', 'Trillen', s.trillen)}
      ${toggle('groteKnoppen', 'Grote knoppen', s.groteKnoppen)}
    </section>

    <section class="card">
      <div class="card-head"><h3>${icon('heart')} Veiligheid</h3></div>
      <p class="muted small">Hartslag stuurt hier nooit de training — we werken op gevoel en de praattest. ${StopCriteria.hartslagDisclaimer}</p>
      ${toggleBlock('hrEnabled', 'Hartslag tonen op horloge (alleen info)', Store.block.hrEnabled)}
      ${blocked
      ? `<button class="btn warn" data-act="resetBlock">Klachten weg — reset 48u-pauze</button>`
      : `<p class="muted small">Geen actieve pauze. Alles staat op groen.</p>`}
      <button class="btn ghost-dark" data-act="viewDisclaimer">Bekijk arts-advies</button>
    </section>

    <section class="card">
      <div class="card-head"><h3>Jouw data (alles lokaal)</h3></div>
      <p class="muted small">Niets verlaat je telefoon. Maak zelf een reservekopie:</p>
      <button class="btn ghost-dark" data-act="export">Exporteer naar JSON</button>
      <label class="btn ghost-dark filelabel">Importeer JSON<input type="file" id="importFile" accept="application/json" hidden></label>
    </section>

    ${tabbar('settings')}
  </div>`);

  root.querySelectorAll('[data-toggle]').forEach((el) => {
    el.addEventListener('click', () => {
      const key = el.dataset.toggle;
      Store.setSettings({ [key]: !Store.settings[key] });
      applyTheme();
      nav('settings');
    });
  });
  root.querySelectorAll('[data-toggleblock]').forEach((el) => {
    el.addEventListener('click', () => {
      const key = el.dataset.toggleblock;
      const block = { ...Store.block, [key]: !Store.block[key], version: Store.block.version + 1 };
      Store.setBlock(block);
      Bridge.putState(Paths.BLOCK, JSON.stringify(block));
      nav('settings');
    });
  });
  root.querySelectorAll('#themaSeg button').forEach((b) => {
    b.addEventListener('click', () => {
      Store.setSettings({ thema: b.dataset.thema });
      applyTheme();
      nav('settings');
    });
  });
  const voiceSel = root.querySelector('#voiceSel');
  if (voiceSel) voiceSel.addEventListener('change', () => {
    Store.setSettings({ coachVoiceURI: voiceSel.value });
  });

  bindActions(root, async (act) => {
    if (handleNav(act, nav)) return;
    if (act === 'saveNames') {
      const naam = (root.querySelector('#setNaam').value || '').trim() || 'Moek';
      const coach = (root.querySelector('#setCoach').value || '').trim() || 'Sanne';
      Store.setProfile({ naam, coachNaam: coach });
      Coach.speak(`Prima, ${naam}. Ik ben ${coach}.`);
      return nav('settings');
    }
    if (act === 'replayIntro') return nav('onboarding', { replay: true });
    if (act === 'testVoice') return Coach.sayTest();
    if (act === 'viewDisclaimer') return nav('disclaimer-view');
    if (act === 'resetBlock') {
      const block = { ...Store.block, chestBlockUntilEpochMs: 0, version: Store.block.version + 1 };
      Store.setBlock(block);
      Bridge.putState(Paths.BLOCK, JSON.stringify(block));
      return nav('settings');
    }
    if (act === 'export') {
      const data = await DB.exportAll();
      const blob = new Blob([JSON.stringify({
        ...data, settings: Store.settings, profile: Store.profile,
        block: Store.block, swings: Store.ledger.toJSON(),
      }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `kb30-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  });

  const fileInput = root.querySelector('#importFile');
  if (fileInput) fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      await DB.importAll(data);
      if (data.settings) Store.setSettings(data.settings);
      if (data.profile) Store.setProfile(data.profile);
      if (data.block) Store.setBlock(data.block);
      alert('Import gelukt ✓');
      nav('dashboard');
    } catch { alert('Import mislukt — ongeldig bestand.'); }
  });
}

function toggle(key, label, on) {
  return `<div class="setting" data-toggle="${key}" role="switch" aria-checked="${!!on}" tabindex="0"><span>${label}</span><span class="sw ${on ? 'on' : ''}"></span></div>`;
}
function toggleBlock(key, label, on) {
  return `<div class="setting" data-toggleblock="${key}" role="switch" aria-checked="${!!on}" tabindex="0"><span>${label}</span><span class="sw ${on ? 'on' : ''}"></span></div>`;
}

/** Thema toepassen: expliciet licht/donker, of automatisch (systeem). */
export function applyTheme() {
  const t = Store.settings.thema || 'auto';
  document.documentElement.classList.toggle('dark', t === 'donker');
  document.documentElement.classList.toggle('light', t === 'licht');
  document.documentElement.classList.toggle('big', !!Store.settings.groteKnoppen);
}
