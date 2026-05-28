// KPN Rittenregistratie — app logica

const TRIPS_KEY    = 'moek_ritten_v1';
const SETTINGS_KEY = 'moek_settings_v1';
const ACTIVE_KEY   = 'moek_active_rit_v1';

let trips      = [];
let settings   = {};
let activeTrip = null;

// ── Opslag ─────────────────────────────────────────────────────────────────

function load() {
  trips      = JSON.parse(localStorage.getItem(TRIPS_KEY)    || '[]');
  settings   = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  activeTrip = JSON.parse(localStorage.getItem(ACTIVE_KEY)   || 'null');
}

function saveTrips()      { localStorage.setItem(TRIPS_KEY,    JSON.stringify(trips));      }
function saveSettings()   { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));   }
function saveActive()     { localStorage.setItem(ACTIVE_KEY,   JSON.stringify(activeTrip)); }

// ── Tabs ───────────────────────────────────────────────────────────────────

function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const name = tab.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.remove('active');
        c.classList.add('hidden');
      });
      tab.classList.add('active');
      const section = document.getElementById(`tab-${name}`);
      section.classList.add('active');
      section.classList.remove('hidden');
    });
  });
}

// ── Stats ──────────────────────────────────────────────────────────────────

function updateStats() {
  const todayStr = new Date().toLocaleDateString('nl-NL');
  const todayTrips = trips.filter(t =>
    new Date(t.startDateTime).toLocaleDateString('nl-NL') === todayStr
  );

  const todayKm = todayTrips.reduce((s, t) => s + (t.km || 0), 0);
  const totalKm = trips.reduce((s, t) => s + (t.km || 0), 0);

  document.getElementById('stat-ritten-vandaag').textContent = todayTrips.length;
  document.getElementById('stat-km-vandaag').textContent     = todayKm;
  document.getElementById('stat-km-totaal').textContent      = totalKm;

  const last = trips.length > 0 ? trips[trips.length - 1].kmEnd : null;
  document.getElementById('last-km-end').textContent = last ? `${last} km` : '--';
}

// ── Status & active trip UI ─────────────────────────────────────────────────

function updateTripUI() {
  const dot   = document.getElementById('status-dot');
  const text  = document.getElementById('status-text');
  const panel = document.getElementById('active-trip-panel');
  const btnS  = document.getElementById('btn-start');
  const btnE  = document.getElementById('btn-stop');

  if (activeTrip) {
    dot.classList.add('active');
    text.textContent = 'Rit actief';
    panel.classList.remove('hidden');
    btnS.classList.add('hidden');
    btnE.classList.remove('hidden');

    const t = new Date(activeTrip.startDateTime);
    document.getElementById('active-start-time').textContent =
      t.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('active-km-start').textContent =
      `${activeTrip.kmStart} km`;
    const loc = [activeTrip.startPostcode, activeTrip.startPlaats].filter(Boolean).join(' ');
    document.getElementById('active-vertrek').textContent = loc || '--';
  } else {
    dot.classList.remove('active');
    text.textContent = 'Geen actieve rit';
    panel.classList.add('hidden');
    btnS.classList.remove('hidden');
    btnE.classList.add('hidden');
  }
}

// ── GPS / reverse geocoding ─────────────────────────────────────────────────

async function fetchGPS(pcId, plaatsId, btnId) {
  const btn = document.getElementById(btnId);
  const orig = btn.innerHTML;
  btn.innerHTML = '⏳ Ophalen…';
  btn.disabled = true;

  try {
    const pos = await new Promise((ok, fail) =>
      navigator.geolocation.getCurrentPosition(ok, fail, {
        timeout: 12000,
        enableHighAccuracy: true,
      })
    );

    const { latitude: lat, longitude: lon } = pos.coords;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=nl`,
      { headers: { 'User-Agent': 'KPN-Rittenregistratie/1.0' } }
    );

    if (!res.ok) throw new Error('Nominatim antwoordde niet');
    const data = await res.json();
    const addr = data.address || {};

    const rawPC = (addr.postcode || '').replace(/\s+/g, '').toUpperCase();
    const pc    = rawPC.length >= 6 ? `${rawPC.slice(0, 4)} ${rawPC.slice(4)}` : rawPC;
    const place = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';

    document.getElementById(pcId).value    = pc;
    document.getElementById(plaatsId).value = place;
  } catch (err) {
    const msg = err.code === 1 ? 'Locatietoegang geweigerd' :
                err.code === 3 ? 'GPS time-out' : `GPS fout: ${err.message || err}`;
    toast(msg, 4000);
  } finally {
    btn.innerHTML = orig;
    btn.disabled  = false;
  }
}

// ── Modal helpers ──────────────────────────────────────────────────────────

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Start rit ─────────────────────────────────────────────────────────────

function initStartModal() {
  document.getElementById('btn-start').addEventListener('click', () => {
    // Vul beginstand automatisch in met de laatste eindstand
    const lastKm = trips.length > 0 ? trips[trips.length - 1].kmEnd : '';
    document.getElementById('start-km').value        = lastKm || '';
    document.getElementById('start-postcode').value  = '';
    document.getElementById('start-plaats').value    = '';
    document.querySelector('input[name="start-soort"][value="zakelijk"]').checked = true;
    openModal('modal-start');
    setTimeout(() => {
      const kmInput = document.getElementById('start-km');
      kmInput.focus();
      kmInput.select();
    }, 300);
  });

  document.getElementById('btn-start-annuleer').addEventListener('click', () => closeModal('modal-start'));
  document.querySelector('#modal-start .modal-backdrop').addEventListener('click', () => closeModal('modal-start'));

  document.getElementById('btn-gps-start').addEventListener('click', () =>
    fetchGPS('start-postcode', 'start-plaats', 'btn-gps-start')
  );

  document.getElementById('btn-start-confirm').addEventListener('click', () => {
    const km = parseInt(document.getElementById('start-km').value, 10);
    if (!Number.isFinite(km) || km < 0) { toast('Voer een geldige beginstand in'); return; }

    activeTrip = {
      startDateTime:  new Date().toISOString(),
      kmStart:        km,
      startPostcode:  document.getElementById('start-postcode').value.trim(),
      startPlaats:    document.getElementById('start-plaats').value.trim(),
      soort:          document.querySelector('input[name="start-soort"]:checked').value,
    };
    saveActive();
    closeModal('modal-start');
    updateTripUI();
    updateStats();
    toast('Rit gestart!');
  });
}

// ── Km-diff berekening ─────────────────────────────────────────────────────

function updateKmDiff() {
  const end  = parseInt(document.getElementById('stop-km').value, 10);
  const diff = document.getElementById('km-diff');
  if (activeTrip && Number.isFinite(end) && end > activeTrip.kmStart) {
    diff.textContent = `Gereden kilometers: ${end - activeTrip.kmStart} km`;
  } else {
    diff.textContent = 'Gereden kilometers: -- km';
  }
}

// ── Beëindig rit ───────────────────────────────────────────────────────────

function initStopModal() {
  document.getElementById('btn-stop').addEventListener('click', () => {
    document.getElementById('stop-km').value        = '';
    document.getElementById('stop-postcode').value  = '';
    document.getElementById('stop-plaats').value    = '';
    updateKmDiff();
    openModal('modal-stop');
    setTimeout(() => document.getElementById('stop-km').focus(), 300);
  });

  document.getElementById('btn-stop-annuleer').addEventListener('click', () => closeModal('modal-stop'));
  document.querySelector('#modal-stop .modal-backdrop').addEventListener('click', () => closeModal('modal-stop'));

  document.getElementById('stop-km').addEventListener('input', updateKmDiff);

  document.getElementById('btn-gps-stop').addEventListener('click', () =>
    fetchGPS('stop-postcode', 'stop-plaats', 'btn-gps-stop')
  );

  document.getElementById('btn-stop-confirm').addEventListener('click', () => {
    const kmEnd = parseInt(document.getElementById('stop-km').value, 10);
    if (!Number.isFinite(kmEnd) || kmEnd < 0) { toast('Voer een geldige eindstand in'); return; }
    if (kmEnd <= activeTrip.kmStart) { toast('Eindstand moet hoger zijn dan beginstand'); return; }

    const rit = {
      ...activeTrip,
      endDateTime:   new Date().toISOString(),
      kmEnd,
      km:            kmEnd - activeTrip.kmStart,
      endPostcode:   document.getElementById('stop-postcode').value.trim(),
      endPlaats:     document.getElementById('stop-plaats').value.trim(),
    };

    trips.push(rit);
    saveTrips();
    activeTrip = null;
    saveActive();
    closeModal('modal-stop');
    updateTripUI();
    updateStats();
    renderTrips();
    toast(`Rit beëindigd! ${rit.km} km gereden.`);
  });
}

// ── Ritten lijst ───────────────────────────────────────────────────────────

function renderTrips() {
  const list    = document.getElementById('trips-list');
  const summary = document.getElementById('trips-summary');
  const total   = trips.reduce((s, t) => s + (t.km || 0), 0);

  summary.textContent = `${trips.length} ritten • ${total} km totaal`;

  if (trips.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🚗</div>
        <p>Nog geen ritten geregistreerd</p>
      </div>`;
    return;
  }

  list.innerHTML = trips
    .slice()
    .reverse()
    .map((rit, revIdx) => {
      const realIdx   = trips.length - 1 - revIdx;
      const start     = new Date(rit.startDateTime);
      const dateStr   = start.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      const timeStr   = start.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
      const vertrek   = [rit.startPostcode, rit.startPlaats].filter(Boolean).join(' ') || '–';
      const aankomst  = [rit.endPostcode,   rit.endPlaats  ].filter(Boolean).join(' ') || '–';
      const badgeCls  = rit.soort === 'zakelijk' ? 'badge-zakelijk' : 'badge-prive';

      return `
        <div class="trip-card">
          <div class="trip-card-header">
            <div class="trip-date">${dateStr} • ${timeStr}</div>
            <div class="trip-km">${rit.km} km</div>
          </div>
          <div class="trip-route">${escHtml(vertrek)} → ${escHtml(aankomst)}</div>
          <div class="trip-card-footer">
            <span class="badge ${badgeCls}">${escHtml(rit.soort)}</span>
            <button class="btn-delete-trip" data-idx="${realIdx}" title="Verwijder rit">🗑</button>
          </div>
        </div>`;
    })
    .join('');

  list.querySelectorAll('.btn-delete-trip').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Deze rit verwijderen?')) return;
      trips.splice(parseInt(btn.dataset.idx, 10), 1);
      saveTrips();
      renderTrips();
      updateStats();
    });
  });
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Verwijder alles ────────────────────────────────────────────────────────

function initDeleteAll() {
  document.getElementById('btn-delete-all').addEventListener('click', () => {
    if (trips.length === 0) { toast('Geen ritten om te verwijderen'); return; }
    if (!confirm(`Alle ${trips.length} ritten definitief verwijderen?`)) return;
    trips = [];
    saveTrips();
    renderTrips();
    updateStats();
    toast('Alle ritten verwijderd');
  });
}

// ── Excel export ───────────────────────────────────────────────────────────

function exportExcel() {
  if (trips.length === 0) { toast('Geen ritten om te exporteren'); return; }

  const naam     = escHtml(settings.naam     || '');
  const kenteken = escHtml(settings.kenteken || '');
  const voertuig = escHtml(settings.voertuig || '');
  const dateExport = new Date().toLocaleDateString('nl-NL');

  let rows = trips.map(r => {
    const sd = new Date(r.startDateTime);
    const ed = r.endDateTime ? new Date(r.endDateTime) : null;
    return [
      sd.toLocaleDateString('nl-NL'),
      sd.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
      ed ? ed.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : '',
      r.kmStart,
      r.kmEnd   || '',
      r.km      || '',
      r.startPostcode || '',
      r.endPostcode   || '',
      r.soort         || '',
    ].map(v => `<td>${escHtml(String(v))}</td>`).join('');
  }).map(row => `<tr>${row}</tr>`).join('\n');

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns="http://www.w3.org/TR/REC-html40">
  <head><meta charset="UTF-8">
    <!--[if gte mso 9]><xml>
      <x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
        <x:Name>Rittenregistratie</x:Name>
        <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
      </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
    </xml><![endif]-->
  </head><body><table>
    <tr><td colspan="9"><b>Moek's Rittenregistratie</b></td></tr>
    <tr><td>Naam:</td><td colspan="8">${naam}</td></tr>
    <tr><td>Kenteken:</td><td colspan="8">${kenteken}</td></tr>
    <tr><td>Voertuig:</td><td colspan="8">${voertuig}</td></tr>
    <tr><td>Exportdatum:</td><td colspan="8">${dateExport}</td></tr>
    <tr></tr>
    <tr>
      <th>Datum</th><th>Begintijd</th><th>Eindtijd</th>
      <th>Beginstand</th><th>Eindstand</th><th>Km gereden</th>
      <th>Vertrekpostcode</th><th>Aankomstpostcode</th><th>Soort rit</th>
    </tr>
    ${rows}
  </table></body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href:     url,
    download: `moeks-ritten-${new Date().toISOString().slice(0, 10)}.xls`,
  });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast('Excel bestand gedownload');
}

// ── Google Sheets export ───────────────────────────────────────────────────

async function exportSheets() {
  const url = settings.sheetsUrl;
  if (!url) { toast('Stel eerst de Google Sheet URL in bij Instellingen'); return; }
  if (trips.length === 0) { toast('Geen ritten om te exporteren'); return; }

  const btn = document.getElementById('btn-sheets');
  btn.disabled  = true;
  btn.innerHTML = '⏳ Bezig…';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        naam:      settings.naam,
        kenteken:  settings.kenteken,
        voertuig:  settings.voertuig,
        ritten:    trips,
      }),
    });
    toast(res.ok ? 'Verzonden naar Google Sheets!' : `Fout: HTTP ${res.status}`, 4000);
  } catch (err) {
    toast(`Verbindingsfout: ${err.message}`, 4000);
  } finally {
    btn.disabled  = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7zm-2 16H5V5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h7v-2z"/></svg> Naar Google Sheets sturen`;
  }
}

// ── Instellingen ───────────────────────────────────────────────────────────

function initSettings() {
  document.getElementById('settings-naam').value      = settings.naam      || '';
  document.getElementById('settings-kenteken').value  = settings.kenteken  || '';
  document.getElementById('settings-voertuig').value  = settings.voertuig  || '';
  document.getElementById('settings-sheets').value    = settings.sheetsUrl || '';

  document.getElementById('settings-kenteken').addEventListener('input', e => {
    e.target.value = e.target.value.toUpperCase();
  });

  document.getElementById('btn-save-settings').addEventListener('click', () => {
    settings.naam      = document.getElementById('settings-naam').value.trim();
    settings.kenteken  = document.getElementById('settings-kenteken').value.trim().toUpperCase();
    settings.voertuig  = document.getElementById('settings-voertuig').value.trim();
    settings.sheetsUrl = document.getElementById('settings-sheets').value.trim();
    saveSettings();
    toast('Instellingen opgeslagen ✓');
  });
}

// ── Toast ──────────────────────────────────────────────────────────────────

let toastTimer = null;

function toast(msg, ms = 3000) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), ms);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────

function init() {
  load();
  initTabs();
  updateStats();
  updateTripUI();
  renderTrips();
  initStartModal();
  initStopModal();
  initDeleteAll();
  initSettings();

  document.getElementById('btn-excel').addEventListener('click', exportExcel);
  document.getElementById('btn-sheets').addEventListener('click', exportSheets);
}

document.addEventListener('DOMContentLoaded', init);
