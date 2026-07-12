// screens/more.js — voortgang (grafieken), bibliotheek en instellingen,
// in het donkere designsysteem. Alle data- en veiligheidshandelingen
// (export/import, blokkade-reset, toggles, horloge-sync) zijn ongewijzigd.

import { mount, bindActions, tabbar, handleNav, escapeHtml } from '../ui.js';
import { Store } from '../store.js';
import { DB } from '../db.js';
import { Bridge, Paths } from '../bridge.js';
import { EXERCISES, MOBILITY } from '../data/exercises.js';
import { illustration, icon } from '../illustrations.js';
import { Coach } from '../coach.js';
import { Listen } from '../listen.js';
import { isoDate } from '../program.js';

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
  const totalMin = Math.round(done.reduce((n, s) => n + (s.duurSec || 0), 0) / 60);
  const streak = computeStreak(done);

  const root = mount(`
  <div class="screen has-nav progresspage">
    <h1 class="d title-lg" style="margin:8px 0 16px">Voortgang</h1>

    <div class="stat3">
      <div class="t"><b>${done.length}</b><span>Sessies</span></div>
      <div class="t"><b>${totalMin}</b><span>Minuten</span></div>
      <div class="t"><b>${streak}</b><span>Op rij</span></div>
    </div>

    <p class="qlabel">Sessies per week · doel 5</p>
    ${weekBars(done)}

    <p class="qlabel">Gewicht</p>
    ${lineChart(weight, 'kg')}

    <p class="qlabel">Buikomtrek</p>
    ${lineChart(waist, 'cm')}

    <p class="qlabel">Nieuwe meting</p>
    <div class="measure-row">
      <label class="field">Gewicht (kg)<input type="number" id="qWeight" step="0.1" inputmode="decimal" placeholder="—"></label>
      <label class="field">Buik (cm)<input type="number" id="qWaist" step="0.1" inputmode="decimal" placeholder="—"></label>
      <button class="btn" data-act="saveMeasure">Bewaar</button>
    </div>

    ${tabbar('progress')}
  </div>`);

  bindActions(root, async (act) => {
    if (handleNav(act, nav)) return;
    if (act === 'saveMeasure') {
      const w = parseFloat(root.querySelector('#qWeight').value);
      const c = parseFloat(root.querySelector('#qWaist').value);
      if (!isNaN(w) || !isNaN(c)) {
        await DB.putMeasurement({
          datum: isoDate(new Date()),
          gewichtKg: isNaN(w) ? null : w, buikomtrekCm: isNaN(c) ? null : c,
        });
        return renderProgress(nav);
      }
    }
  });
}

function computeStreak(done) {
  const days = new Set(done.map((s) => s.datum));
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = isoDate(d);
    if (days.has(key)) { streak++; d.setDate(d.getDate() - 1); } else break;
  }
  return streak;
}

function emptyState(txt) {
  return `<div class="empty">${txt}</div>`;
}

function lineChart(values, unit) {
  if (!values.length) return emptyState('Nog geen metingen — vul hieronder je eerste meting in.');
  const w = 320, h = 90, pad = 14;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const step = values.length > 1 ? (w - 2 * pad) / (values.length - 1) : 0;
  const pts = values.map((v, i) => {
    const x = pad + i * step;
    const y = (h - 22) - ((v - min) / range) * (h - 44) + 12;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const last = values[values.length - 1];
  const [lx, ly] = pts.split(' ').pop().split(',');
  const fmt = (v) => String(v).replace('.', ',');
  return `<svg viewBox="0 0 ${w} ${h}" class="chart" role="img" aria-label="Verloop ${unit}">
    <polyline points="${pts}" fill="none" stroke="#FF5A1F" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${lx}" cy="${ly}" r="4.5" fill="#FF5A1F"/>
    <text x="${pad}" y="18" fill="#8B909A" font-family="Archivo" font-size="11" font-weight="700">${fmt(max)} ${unit}</text>
    <text x="${w - pad}" y="18" text-anchor="end" fill="#FF5A1F" font-family="Archivo" font-size="11" font-weight="800">nu ${fmt(last)} ${unit}</text>
  </svg>`;
}

function weekBars(sessions) {
  const byWeek = {};
  sessions.forEach((s) => {
    const wk = isoWeek(new Date(s.datum));
    byWeek[wk] = (byWeek[wk] || 0) + 1;
  });
  const weeks = Object.keys(byWeek).sort().slice(-6);
  if (!weeks.length) return emptyState('Nog geen sessies — na je eerste training zie je hier je weekritme.');
  const maxv = Math.max(...weeks.map((k) => byWeek[k]), 5);
  const nowWk = isoWeek(new Date());
  return `<div class="chartbars">${weeks.map((k) =>
    `<div class="cb ${k === nowWk && byWeek[k] < 5 ? '' : ''}" style="height:${Math.round((byWeek[k] / maxv) * 100)}%"></div>`).join('')}</div>`;
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
    <button class="lrow ${locked ? 'lock' : ''}" data-act="open-${e.id}">
      <span class="thumb${locked ? ' locked' : ''}">${locked ? icon('lock') : illustration(e.illu)}</span>
      <span>
        <span class="nm" style="display:block">${escapeHtml(e.naam)}</span>
        <span class="mu" style="display:block">${libMeta(e)}</span>
      </span>
      ${locked ? '' : `<span class="chev">${icon('chev')}</span>`}
    </button>`;

  const root = mount(`
  <div class="screen has-nav library">
    <div class="libhead"><h1 class="d title-lg">Oefeningen</h1></div>
    <div class="sec">Kracht</div>
    <div class="rows">${kracht.map((e) => item(e)).join('')}</div>
    <div class="sec">Swings ${unlocked ? '· vrijgespeeld' : '· nog vergrendeld'}</div>
    <div class="rows">${swings.map((e) => item(e, !unlocked)).join('')}</div>
    <div class="sec">Mobiliteit &amp; herstel</div>
    <div class="rows">${MOBILITY.map((e) => item(e)).join('')}</div>
    ${tabbar('library')}
  </div>`);
  bindActions(root, (act) => {
    if (handleNav(act, nav)) return;
    if (act.startsWith('open-')) return nav('library', act.slice(5));
  });
}

function libMeta(e) {
  const parts = [...(e.spieren || [])];
  if (e.gewichtKg) parts.push(`${e.gewichtKg} kg`);
  if (e.fase) parts.push(`fase ${e.fase}`);
  return escapeHtml(parts.join(' · '));
}

function renderExerciseDetail(nav, id) {
  const e = EXERCISES.find((x) => x.id === id) || MOBILITY.find((x) => x.id === id);
  if (!e) return nav('library');
  const locked = e.isSwing && !Store.block.swingsUnlocked;
  const root = mount(`
  <div class="screen detail" style="padding-bottom:34px">
    <div class="top" style="justify-content:flex-start">
      <button class="back" data-act="back">${icon('back')} Oefeningen</button>
    </div>
    <div class="illowrap">${illustration(e.illu)}</div>
    <h1 class="d" style="font-size:clamp(30px,10vw,40px);text-align:center">${escapeHtml(e.naam)}</h1>
    <p class="detail-meta" style="text-align:center">${libMeta(e) || 'Zonder gewicht'}</p>
    ${locked ? `<div class="locknote">${icon('lock')} Vergrendeld tot fase 2 — zes sessies pijnvrij speelt swings vrij.</div>` : ''}
    ${e.waarom ? `<div class="why-box"><b>Waarom</b>${escapeHtml(e.waarom)}</div>` : ''}
    <div class="sec" style="margin-top:26px">Zo doe je het</div>
    <ol class="detail-steps">${(e.stappen || []).map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
    <div class="warnbox"><b>Let op</b>${escapeHtml(e.waarschuwing || '')}</div>
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
  <div class="screen has-nav settingspage">
    <h1 class="d title-lg" style="margin:8px 0 4px">Instellingen</h1>
    <div style="flex:1">
      <div class="sec">Coach</div>
      ${toggle('stem', 'Gesproken begeleiding', 'Telt af en zegt wat er komt', s.stem)}
      ${voices.length ? `
      <div class="srow">
        <span style="flex:1"><span class="t">Stem</span>
        <select id="voiceSel" class="txtinput" style="margin-top:8px;min-height:48px;font-size:15px">
          ${voices.map((v) => `<option value="${escapeHtml(v.voiceURI)}" ${chosen && v.voiceURI === chosen.voiceURI ? 'selected' : ''}>${escapeHtml(v.name)}</option>`).join('')}
        </select></span>
      </div>` : ''}
      <button class="srow" data-act="testVoice"><span class="t">Stem testen</span><span class="go">${icon('chev')}</span></button>
      ${toggle('trillen', 'Trillen', 'Bij aftellen en einde set', s.trillen)}
      ${Listen.supported ? toggle('terugpraten', 'Terugpraten', 'Zeg "volgende", "pauze" of "stop"', s.terugpraten) : ''}

      <div class="sec">Meten</div>
      ${toggleBlock('hrEnabled', 'Hartslag tonen', 'Alleen ter informatie — stuurt de training nooit', Store.block.hrEnabled)}

      <div class="sec">Profiel</div>
      <div class="srow">
        <span style="flex:1"><span class="t">Naam</span>
        <input type="text" id="setNaam" class="txtinput" style="margin-top:8px;min-height:48px;font-size:15px"
          value="${escapeHtml(Store.profile.naam || 'Moek')}" maxlength="20" aria-label="Je naam"></span>
        <button class="btn ghost" style="flex:0 0 96px;min-height:48px;font-size:13px" data-act="saveNames">Bewaar</button>
      </div>
      <button class="srow" data-act="replayIntro"><span class="t">Introductie opnieuw bekijken</span><span class="go">${icon('chev')}</span></button>

      <div class="sec">Veiligheid</div>
      <button class="srow" data-act="viewDisclaimer"><span class="t">Arts-advies bekijken</span><span class="go">${icon('chev')}</span></button>
      ${blocked
        ? `<button class="srow" data-act="resetBlock"><span><span class="t" style="color:var(--danger)">Blokkade resetten</span><span class="s" style="display:block">Klachten weg of met arts besproken — 48u-pauze opheffen</span></span><span class="go">${icon('chev')}</span></button>`
        : `<div class="srow"><span><span class="t" style="color:var(--dim)">Blokkade resetten</span><span class="s" style="display:block">Geen actieve blokkade</span></span></div>`}

      <div class="sec">Gegevens · alles lokaal</div>
      <button class="srow" data-act="export"><span class="t">Exporteren naar bestand</span><span class="go">${icon('chev')}</span></button>
      <label class="srow" style="cursor:pointer"><span class="t">Importeren</span><span class="go">${icon('chev')}</span><input type="file" id="importFile" accept="application/json" hidden></label>
    </div>
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
  const voiceSel = root.querySelector('#voiceSel');
  if (voiceSel) voiceSel.addEventListener('change', () => {
    Store.setSettings({ coachVoiceURI: voiceSel.value });
  });

  bindActions(root, async (act) => {
    if (handleNav(act, nav)) return;
    if (act === 'saveNames') {
      const naam = (root.querySelector('#setNaam').value || '').trim() || 'Moek';
      Store.setProfile({ naam });
      return nav('settings');
    }
    if (act === 'replayIntro') return nav('onboarding', { replay: true });
    if (act === 'testVoice') return Coach.speak('Zo klinkt de gesproken begeleiding.');
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
      alert('Import gelukt');
      nav('dashboard');
    } catch { alert('Import mislukt — ongeldig bestand.'); }
  });
}

function toggle(key, label, sub, on) {
  return `<button class="srow" data-toggle="${key}" role="switch" aria-checked="${!!on}">
    <span><span class="t">${label}</span>${sub ? `<span class="s" style="display:block">${sub}</span>` : ''}</span>
    <span class="sw ${on ? 'on' : ''}"></span></button>`;
}
function toggleBlock(key, label, sub, on) {
  return `<button class="srow" data-toggleblock="${key}" role="switch" aria-checked="${!!on}">
    <span><span class="t">${label}</span>${sub ? `<span class="s" style="display:block">${sub}</span>` : ''}</span>
    <span class="sw ${on ? 'on' : ''}"></span></button>`;
}

/** Alleen donker thema — oude themaklassen opruimen. */
export function applyTheme() {
  document.documentElement.classList.remove('dark', 'light', 'big');
}
