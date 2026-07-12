// engine.js — Fitify-achtige workout-flow: maak-je-klaar → werk → rust
// ("volgende: …") → volgende, met tellers en minimale onderbreking. Veiligheid
// blijft altijd bereikbaar (noodstop + "voelt niet goed"), en een borstklacht
// stopt direct met 48u-blok. Tweerichtingssync met het horloge blijft werken.

import { Store } from './store.js';
import { Cue } from './voice.js';
import { Bridge, Paths } from './bridge.js';
import { DB } from './db.js';
import { buildSession } from './data/exercises.js';
import { computeSwingsUnlocked } from './gates.js';
import {
  SessionType, applyChestEvent, needsRecoveryCheck, isEmergency, PainLocation, TalkTest,
} from './safety.js';

export const Screen = Object.freeze({
  GET_READY: 'GET_READY', WORK: 'WORK', REST: 'REST',
  FEELING: 'FEELING', PAIN_LOCATION: 'PAIN_LOCATION', RECOVERY: 'RECOVERY',
  STOP: 'STOP', SUMMARY: 'SUMMARY',
});
// Watch-protocol segmenten (blijven gelijk aan Kotlin).
const Seg = { WERK: 'WERK', RUST: 'RUST', PAUZE: 'PAUZE', STOP: 'STOP', KLAAR: 'KLAAR' };

const READY_SEC = 6;

class WorkoutEngine {
  constructor() {
    this._reset();
    this._subs = new Set();
    Bridge.onMessage((path, payload) => this._onWatch(path, payload));
  }

  on(cb) { this._subs.add(cb); return () => this._subs.delete(cb); }
  _emit() { this._subs.forEach((cb) => cb(this)); }

  get current() { return this.steps[this.index] || null; }
  get next() { return this.steps[this.index + 1] || null; }
  get swingCount() { return Store.ledger.count; }
  get progress() {
    if (!this.steps.length) return 0;
    return Math.min(1, this.done / this.steps.length);
  }

  // --- start --------------------------------------------------------------
  start(type, swingsUnlocked, owner = true) {
    this.steps = buildSession(type, swingsUnlocked);
    this.index = 0;
    this.done = 0;
    this.type = type;
    this.sessionId = 'p-' + Date.now();
    this.startMs = Date.now();
    this.isOwner = owner;
    this.active = true;
    this.paused = false;
    this.wellbeing = null;
    this.rpe = null;
    this.painReports = [];
    this._enterGetReady();
  }

  _enterGetReady() {
    this.paused = false;
    this.segment = Seg.RUST;
    this.remaining = READY_SEC;
    this.screen = Screen.GET_READY;
    this._push(); this._tick(); this._emit();
  }

  _enterWork() {
    const ex = this.current;
    if (!ex) return this._finish();
    this.paused = false;
    this.segment = Seg.WERK;
    this.screen = Screen.WORK;
    Cue.workStart();
    if (ex.mode === 'reps') {
      this.remaining = null;         // zelf-tempo: geen afteller
      this._clearTick();
    } else {
      this.remaining = ex.workSec;   // time / swings
      this._tick();
    }
    this._push(); this._emit();
  }

  _afterWork() {
    this.done++;
    Cue.setEnd();
    if (this.index >= this.steps.length - 1) return this._finish();
    this._enterRest();
  }

  _enterRest() {
    const ex = this.current;
    this.segment = Seg.RUST;
    this.screen = Screen.REST;
    this.remaining = Math.max(5, (ex && ex.restSec) || 15);
    Cue.restStart();
    this._push(); this._tick(); this._emit();
  }

  _restDone() {
    this.index++;
    this._enterWork();
  }

  // --- timer --------------------------------------------------------------
  _tick() {
    this._clearTick();
    this._timer = setInterval(() => {
      if (this.paused) return;
      if (this.remaining == null) return;
      this.remaining--;
      if (this.remaining >= 1 && this.remaining <= 3) Cue.tick(this.remaining);
      if (this.remaining <= 0) {
        this._clearTick();
        this._onZero();
      }
      this._push(); this._emit();
    }, 1000);
  }
  _clearTick() { clearInterval(this._timer); this._timer = null; }

  _onZero() {
    if (this.screen === Screen.GET_READY) return this._enterWork();
    if (this.screen === Screen.REST) return this._restDone();
    if (this.screen === Screen.WORK) return this._afterWork();
  }

  // --- controls -----------------------------------------------------------
  togglePause() {
    this.paused = !this.paused;
    this.segment = this.paused ? Seg.PAUZE : (this.screen === Screen.WORK ? Seg.WERK : Seg.RUST);
    this._mirror(this.paused ? Paths.CTRL_PAUSE : Paths.CTRL_RESUME);
    this._push(); this._emit();
  }

  /** Reps-oefening klaar, of werk vroegtijdig afronden. */
  completeSet() {
    if (this.screen !== Screen.WORK) return;
    this._mirror(Paths.CTRL_SET_DONE);
    this._clearTick();
    this._afterWork();
  }

  /** Rust overslaan → meteen door. */
  skipRest() {
    if (this.screen !== Screen.REST && this.screen !== Screen.GET_READY) return;
    this._clearTick();
    if (this.screen === Screen.GET_READY) this._enterWork();
    else this._restDone();
  }

  addRest(sec = 20) {
    if (this.remaining != null) { this.remaining += sec; this._push(); this._emit(); }
  }

  /** Hele oefening overslaan. */
  skipExercise() {
    this._mirror(Paths.CTRL_SKIP);
    this._clearTick();
    this.done++;
    if (this.index >= this.steps.length - 1) return this._finish();
    this.index++;
    this._enterWork();
  }

  // --- swings -------------------------------------------------------------
  addSwing() { Store.ledger.add('phone'); Cue.swingTick(); this._persistSwings(); }
  undoSwing() { Store.ledger.undoLast('phone'); this._persistSwings(); }
  _persistSwings() {
    Store.saveLedger();
    Bridge.putState(Paths.SWINGS, JSON.stringify(Store.ledger.toJSON()));
    this._emit();
  }

  // --- "voelt niet goed" (veiligheid, bereikbaar maar niet opdringerig) ---
  openFeeling() {
    if (!this.paused) this.togglePause();
    this.screen = Screen.FEELING;
    this._emit();
  }
  closeFeeling() {
    this.screen = this.segment === Seg.WERK ? Screen.WORK : Screen.REST;
    if (this.paused) this.togglePause();
    this._emit();
  }
  feelingTooHeavy() {
    Cue.safety();
    this.screen = Screen.RECOVERY;
    this.recoveryReason = 'Je gaf aan dat het te zwaar was.';
    this._emit();
  }
  feelingPain() { this.screen = Screen.PAIN_LOCATION; this._emit(); }

  submitPainLocation(location) {
    if (location === PainLocation.BORST) return this._chestStop(true);
    const ex = this.current;
    this.painReports.push(`${ex ? ex.naam : 'Oefening'}: ${location.toLowerCase()} 😣`);
    if (ex) this._mirror(Paths.PAIN_REPORT, { exerciseId: ex.id, location });
    this.closeFeeling();
  }

  recoveryContinue() { this.closeFeeling(); }
  recoveryStop() { this._finish(); }

  // --- noodstop / borst ---------------------------------------------------
  emergencyStop() { this._chestStop(true); }
  _chestStop(local) {
    this._clearTick();
    this.paused = true;
    Cue.safety();
    const block = applyChestEvent(Store.block, Date.now());
    Store.setBlock(block);
    this.segment = Seg.STOP;
    this.screen = Screen.STOP;
    Bridge.putState(Paths.BLOCK, JSON.stringify(block));
    if (local) this._mirror(Paths.CTRL_EMERGENCY, { kind: 'chest' });
    this._emit();
  }
  acknowledgeStop() { this._reset(); this._emit(); }

  // --- einde --------------------------------------------------------------
  async _finish() {
    this._clearTick();
    this.paused = true;
    const durationSec = Math.round((Date.now() - this.startMs) / 1000);
    const circuit = this.steps.filter((s) => s._round);
    this.summary = {
      sessionId: this.sessionId, type: this.type, durationSec,
      exerciseCount: new Set(circuit.map((s) => s.id)).size,
      totalSwings: this.swingCount, painReports: [...this.painReports],
    };
    this.segment = Seg.KLAAR;
    this.screen = Screen.SUMMARY;
    this._emit();

    const record = {
      id: this.sessionId, datum: new Date().toISOString().slice(0, 10),
      type: this.type, oefeningen: circuit.map((s) => ({ id: s.id })),
      voltooid: true, duurSec: durationSec, totaalSwings: this.swingCount,
    };
    try {
      await DB.putSession(record);
      const [sessions, checks] = await Promise.all([DB.allSessions(), DB.allMorningChecks()]);
      const unlocked = computeSwingsUnlocked(sessions, checks);
      if (unlocked !== Store.block.swingsUnlocked) {
        Store.setBlock({ ...Store.block, swingsUnlocked: unlocked, version: Store.block.version + 1 });
        Bridge.putState(Paths.BLOCK, JSON.stringify(Store.block));
      }
    } catch (e) { console.warn('finish persist', e); }
  }

  // Optionele afsluit-check (niet verplicht).
  setWellbeing(rating) { this.wellbeing = rating; this._emit(); }
  setRpe(v) { this.rpe = v; this._emit(); }
  async saveWellbeing() {
    if (this.wellbeing || this.rpe != null) {
      try {
        const all = await DB.allSessions();
        const rec = all.find((s) => s.id === this.summary.sessionId);
        if (rec) { rec.wellbeing = this.wellbeing; rec.rpe = this.rpe; await DB.putSession(rec); }
      } catch { /* ignore */ }
    }
    this.dismiss();
  }
  dismiss() { this._reset(); this._emit(); }

  // --- helpers ------------------------------------------------------------
  _reset() {
    this.active = false; this.paused = false; this._clearTick();
    this.steps = []; this.index = 0; this.done = 0; this.remaining = 0;
    this.screen = Screen.GET_READY; this.segment = Seg.RUST;
    this.summary = null; this.recoveryReason = ''; this.wellbeing = null; this.rpe = null;
    this.painReports = []; this.isOwner = false;
  }

  // --- watch sync ---------------------------------------------------------
  _onWatch(path, payload) {
    switch (path) {
      case Paths.CTRL_PAUSE: if (this.active && !this.paused) this.togglePause(); break;
      case Paths.CTRL_RESUME: if (this.active && this.paused) this.togglePause(); break;
      case Paths.CTRL_SKIP: if (this.active) this.skipExercise(); break;
      case Paths.CTRL_EMERGENCY: this._chestStop(false); break;
      case Paths.CTRL_START: if (!this.active) this.start(payload.type || SessionType.NORMAAL, !!Store.block.swingsUnlocked, false); break;
      default: break;
    }
  }
  adoptWatchSession(snap) {
    if (this.isOwner && this.active) return;
    this.active = true; this.isOwner = false;
    this.steps = snap.exercises || [];
    this.index = snap.index || 0;
    this.remaining = snap.remainingSec || 0;
    this.paused = !snap.running;
    this.segment = snap.segment || Seg.WERK;
    this.type = snap.type || SessionType.NORMAAL;
    this.screen = snap.segment === 'STOP' ? Screen.STOP
      : snap.segment === 'KLAAR' ? Screen.SUMMARY
      : snap.segment === 'RUST' ? Screen.REST : Screen.WORK;
    this._emit();
  }

  _mirror(path, payload = {}) { Bridge.sendControl(path, payload); }
  _push() {
    if (!Bridge.available || !this.isOwner) return;
    Bridge.putState(Paths.SESSION, JSON.stringify({
      sessionId: this.sessionId, type: this.type, segment: this.segment,
      exercises: this.steps, index: this.index, remainingSec: this.remaining || 0,
      running: !this.paused, swingCount: this.swingCount,
      updatedAtEpochMs: Date.now(), origin: 'phone',
    }));
  }
}

export const Engine = new WorkoutEngine();
