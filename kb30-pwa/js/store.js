// store.js — centrale app-state met pub/sub. Instellingen, profiel, blokkade en
// swingteller lokaal in localStorage; historie in IndexedDB (db.js).

import { emptyBlock, mergeBlock } from './safety.js';
import { SwingLedger } from './swingLedger.js';

const LS = {
  settings: 'kb30.settings',
  profile: 'kb30.profile',
  block: 'kb30.block',
  swings: 'kb30.swings',
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}

const listeners = new Map(); // key -> Set<cb>

const SETTINGS_DEFAULTS = {
  stem: true, trillen: true, darkMode: false, groteKnoppen: true,
  thema: 'auto',            // 'auto' | 'licht' | 'donker'
  coachVoiceURI: null,      // gekozen TTS-stem (Instellingen)
  terugpraten: false,       // spraakbesturing, standaard uit
};
const PROFILE_DEFAULTS = {
  fase: 1, disclaimerAccepted: false, onboarded: false,
  naam: 'Moek', coachNaam: 'Sanne', startDatum: null,
};

const _settings = { ...SETTINGS_DEFAULTS, ...load(LS.settings, {}) };
// Migratie: oude boolean darkMode → nieuw thema.
if (!load(LS.settings, {}).thema && _settings.darkMode) _settings.thema = 'donker';

export const Store = {
  settings: _settings,
  profile: { ...PROFILE_DEFAULTS, ...load(LS.profile, {}) },
  block: load(LS.block, emptyBlock()),
  ledger: SwingLedger.fromJSON(load(LS.swings, { added: [], removed: [] })),

  subscribe(key, cb) {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(cb);
    return () => listeners.get(key).delete(cb);
  },
  _emit(key, val) {
    (listeners.get(key) || []).forEach((cb) => cb(val));
  },

  setSettings(patch) {
    this.settings = { ...this.settings, ...patch };
    save(LS.settings, this.settings);
    this._emit('settings', this.settings);
  },
  setProfile(patch) {
    this.profile = { ...this.profile, ...patch };
    save(LS.profile, this.profile);
    this._emit('profile', this.profile);
  },
  setBlock(block) {
    this.block = block;
    save(LS.block, this.block);
    this._emit('block', this.block);
  },
  // Merge inkomende blokkade (van horloge) op version.
  mergeBlock(incoming) {
    this.setBlock(mergeBlock(this.block, incoming));
  },
  saveLedger() {
    save(LS.swings, this.ledger.toJSON());
    this._emit('swings', this.ledger.count);
  },
  mergeLedger(incoming) {
    this.ledger.merge(incoming);
    this.saveLedger();
  },
};
