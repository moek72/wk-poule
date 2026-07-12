// screens/more.js — voortgang (grafieken), bibliotheek en instellingen.

import { mount, bindActions, escapeHtml } from '../ui.js';
import { Store } from '../store.js';
import { DB } from '../db.js';
import { Bridge, Paths } from '../bridge.js';
import { StopCriteria } from '../safety.js';
import { EXERCISES } from '../data/exercises.js';
import { illustration } from '../illustrations.js';

// --- voortgang ------------------------------------------------------------
export async function renderProgress(nav) {
  const [sessions, measurements] = await Promise.all([
    DB.allSessions().catch(() => []),
    DB.allMeasurements().catch(() => []),
  ]);
  const ms = measurements.slice().sort((a, b) => (a.datum < b.datum ? -1 : 1));
  const weight = ms.filter((m) => m.gewichtKg != null).map((m) => m.gewichtKg);
  const waist = ms.filter((m) => m.buikomtrekCm != null).map((m) => m.buikomtrekCm);
  const totalSwings = sessions.reduce((n, s) => n + (s.oefeningen || []).reduce((k, o) => k + (o.swings || 0), 0), 0);
  const rpes = sessions.flatMap((s) => (s.oefeningen || []).map((o) => o.rpe).filter((x) => x != null));

  const root = mount(`
  <div class="card progress">
    <button class="back" data-act="back">← terug</button>
    <h2>Voortgang</h2>
    <div class="stat-row">
      <div class="stat"><b>${sessions.filter((s) => s.voltooid).length}</b><span>sessies</span></div>
      <div class="stat"><b>${totalSwings}</b><span>swings</span></div>
      <div class="stat"><b>${rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : '—'}</b><span>gem. RPE</span></div>
    </div>
    <h3>Gewicht</h3>${lineChart(weight, 'kg')}
    <h3>Buikomtrek</h3>${lineChart(waist, 'cm')}
    <h3>Sessies per week</h3>${weekBars(sessions)}
  </div>`);
  bindActions(root, (act) => { if (act === 'back') nav('dashboard'); });
}

function lineChart(values, unit) {
  if (!values.length) return `<p class="muted">Nog geen data.</p>`;
  const w = 300, h = 90, pad = 8;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const step = values.length > 1 ? (w - 2 * pad) / (values.length - 1) : 0;
  const pts = values.map((v, i) => {
    const x = pad + i * step;
    const y = h - pad - ((v - min) / range) * (h - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" class="chart">
    <polyline points="${pts}" fill="none" stroke="var(--accent,#0e9c82)" stroke-width="3" stroke-linejoin="round"/>
    <text x="${pad}" y="12" class="ct">${max}${unit}</text>
    <text x="${pad}" y="${h - 2}" class="ct">${min}${unit}</text>
  </svg>`;
}

function weekBars(sessions) {
  const byWeek = {};
  sessions.filter((s) => s.voltooid).forEach((s) => {
    const wk = isoWeek(new Date(s.datum));
    byWeek[wk] = (byWeek[wk] || 0) + 1;
  });
  const weeks = Object.keys(byWeek).sort().slice(-8);
  if (!weeks.length) return `<p class="muted">Nog geen sessies.</p>`;
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
  const root = mount(`
  <div class="card library">
    <button class="back" data-act="back">← terug</button>
    <h2>Oefeningen</h2>
    <div class="lib-list">
      ${EXERCISES.map((e) => `
        <button class="lib-item" data-act="open-${e.id}">
          <span class="lib-fig">${illustration(e.illu)}</span>
          <span class="lib-txt">
            <b>${escapeHtml(e.naam)}</b>
            <small>${(e.spieren || []).join(', ')}${e.fase ? ' · fase ' + e.fase : ''}${e.isSwing ? ' · 🔒' : ''}</small>
          </span>
        </button>`).join('')}
    </div>
  </div>`);
  bindActions(root, (act) => {
    if (act === 'back') return nav('dashboard');
    if (act.startsWith('open-')) return nav('library', act.slice(5));
  });
}

function renderExerciseDetail(nav, id) {
  const e = EXERCISES.find((x) => x.id === id);
  if (!e) return nav('library');
  const locked = e.isSwing && !Store.block.swingsUnlocked;
  const root = mount(`
  <div class="card detail">
    <button class="back" data-act="back">← oefeningen</button>
    <div class="detail-fig">${illustration(e.illu)}</div>
    <h2>${escapeHtml(e.naam)}</h2>
    <p class="muted">${(e.spieren || []).join(', ')} · ${e.gewichtKg} kg${e.fase ? ' · fase ' + e.fase : ''}</p>
    ${locked ? `<p class="warn-banner">🔒 Op slot tot fase 2 is vrijgespeeld.</p>` : ''}
    <h3>Uitvoering</h3>
    <ol>${(e.stappen || []).map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
    <div class="warn-box"><b>Let op:</b> ${escapeHtml(e.waarschuwing || '')}</div>
  </div>`);
  bindActions(root, (act) => { if (act === 'back') nav('library'); });
}

// --- instellingen ---------------------------------------------------------
export function renderSettings(nav) {
  const s = Store.settings;
  const blocked = Date.now() < Store.block.chestBlockUntilEpochMs;
  const root = mount(`
  <div class="card settings">
    <button class="back" data-act="back">← terug</button>
    <h2>Instellingen</h2>
    ${toggle('stem', 'Stem (NL)', s.stem)}
    ${toggle('trillen', 'Trillen', s.trillen)}
    ${toggle('darkMode', 'Donkere modus', s.darkMode)}
    ${toggle('groteKnoppen', 'Grote knoppen', s.groteKnoppen)}

    <h3>Hartslag (horloge)</h3>
    <p class="muted small">${StopCriteria.hartslagDisclaimer}</p>
    ${toggleBlock('hrEnabled', 'Hartslag tonen op horloge', Store.block.hrEnabled)}

    <h3>Veiligheid</h3>
    ${blocked
      ? `<button class="btn warn" data-act="resetBlock">Klachten weg — reset 48u-blok</button>`
      : `<p class="muted small">Geen actieve blokkade.</p>`}
    <button class="btn" data-act="viewDisclaimer">Bekijk arts-advies</button>

    <h3>Data (alles lokaal)</h3>
    <button class="btn" data-act="export">Exporteer naar JSON</button>
    <label class="btn filelabel">Importeer JSON<input type="file" id="importFile" accept="application/json" hidden></label>
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

  bindActions(root, async (act) => {
    if (act === 'back') return nav('dashboard');
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
        ...data, settings: Store.settings, block: Store.block, swings: Store.ledger.toJSON(),
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
      if (data.block) Store.setBlock(data.block);
      alert('Import gelukt ✓');
      nav('dashboard');
    } catch { alert('Import mislukt — ongeldig bestand.'); }
  });
}

function toggle(key, label, on) {
  return `<div class="setting" data-toggle="${key}"><span>${label}</span><span class="sw ${on ? 'on' : ''}"></span></div>`;
}
function toggleBlock(key, label, on) {
  return `<div class="setting" data-toggleblock="${key}"><span>${label}</span><span class="sw ${on ? 'on' : ''}"></span></div>`;
}

export function applyTheme() {
  document.documentElement.classList.toggle('dark', !!Store.settings.darkMode);
  document.documentElement.classList.toggle('big', !!Store.settings.groteKnoppen);
}
