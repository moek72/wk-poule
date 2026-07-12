// engine.js — workout-state machine voor de telefoon. Tegenhanger van de
// Kotlin WorkoutViewModel op het horloge: eigen timer, veiligheidsgates, en
// tweerichtingssync met het horloge via de Data Layer-brug.

import { Store } from './store.js';
import { Cue } from './voice.js';
import { Bridge, Paths } from './bridge.js';
import { DB } from './db.js';
import { buildSession } from './data/exercises.js';
import { computeSwingsUnlocked } from './gates.js';
import {
  SessionType, applyChestEvent, needsRecoveryCheck, isEmergency, PainLocation, TalkTest, epochDay,
} from './safety.js';

export const Screen = Object.freeze({
  PLAYER: 'PLAYER', SWINGS: 'SWINGS', POST_EXERCISE: 'POST_EXERCISE',
  PAIN_LOCATION: 'PAIN_LOCATION', RPE: 'RPE', TALK_TEST: 'TALK_TEST',
  RECOVERY: 'RECOVERY', STOP: 'STOP', SUMMARY: 'SUMMARY',
});
const Segment = { WERK: 'WERK', RUST: 'RUST', PAUZE: 'PAUZE', NA_OEFENING: 'NA_OEFENING', HERSTEL_CHECK: 'HERSTEL_CHECK', KLAAR: 'KLAAR', STOP: 'STOP' };

function toRef(e) {
  return {
    id: e.id, naam: e.naam, cue1: e.cue1 || '', cue2: e.cue2 || '',
    workSec: e.workSec, restSec: e.restSec, isSwing: !!e.isSwing,
    weightKg: e.gewichtKg || 0, neckShoulder: !!e.neckShoulder, illustration: e.illu || 'generic',
  };
}

class WorkoutEngine {
  constructor() {
    this.active = false;
    this.screen = Screen.PLAYER;
    this.exercises = [];
    this.index = 0;
    this.remaining = 0;
    this.running = false;
    this.segment = Segment.WERK;
    this.isOwner = false;
    this.sessionId = '';
    this.type = SessionType.NORMAAL;
    this.startMs = 0;
    this._timer = null;
    this._midSetPain = false;
    this.recoveryReason = '';
    this.summary = null;
    this.rpeValues = [];
    this.painReports = [];
    this.doneNames = [];
    this.oefeningLog = [];
    this._subs = new Set();
    this._wireBridge();
  }

  on(cb) { this._subs.add(cb); return () => this._subs.delete(cb); }
  _emit() { this._subs.forEach((cb) => cb(this)); }

  get current() { return this.exercises[this.index] || null; }
  get next() { return this.exercises[this.index + 1] || null; }
  get swingCount() { return Store.ledger.count; }

  // --- start --------------------------------------------------------------
  start(type, swingsUnlocked, owner = true) {
    this.exercises = buildSession(type, swingsUnlocked).map(toRef);
    this.index = 0;
    this.type = type;
    this.sessionId = 'p-' + Date.now();
    this.startMs = Date.now();
    this.isOwner = owner;
    this.active = true;
    this.rpeValues = []; this.painReports = []; this.doneNames = []; this.oefeningLog = [];
    this._enterWork();
  }

  _enterWork() {
    const ex = this.current;
    if (!ex) return this._finish();
    this.remaining = ex.workSec;
    this.running = true;
    this.segment = Segment.WERK;
    this.screen = ex.isSwing ? Screen.SWINGS : Screen.PLAYER;
    Cue.workStart();
    this._push();
    this._tick();
    this._emit();
  }

  _enterRest() {
    const ex = this.current;
    this.remaining = ex ? ex.restSec : 0;
    if (this.remaining <= 0) return this._advance();
    this.running = true;
    this.segment = Segment.RUST;
    this.screen = Screen.PLAYER;
    Cue.restStart();
    this._push();
    this._tick();
    this._emit();
  }

  _tick() {
    clearInterval(this._timer);
    this._timer = setInterval(() => {
      if (!this.running) return;
      this.remaining--;
      if (this.remaining >= 1 && this.remaining <= 3) Cue.tick(this.remaining);
      if (this.remaining <= 0) {
        clearInterval(this._timer);
        this._onElapsed();
      }
      this._push();
      this._emit();
    }, 1000);
  }

  _onElapsed() {
    if (this.segment === Segment.WERK) {
      Cue.setEnd();
      const ex = this.current;
      if (!ex || ex.id === 'warmup') return this._advance();
      if (ex.id === 'cooldown') return this._finish();
      this.running = false;
      this.segment = Segment.NA_OEFENING;
      this.screen = Screen.POST_EXERCISE;
      this._emit();
    } else if (this.segment === Segment.RUST) {
      this._advance();
    }
  }

  _advance() {
    const ex = this.current;
    if (ex) {
      this.doneNames.push(ex.naam);
      this.oefeningLog.push(this._logFor(ex));
    }
    this.index++;
    if (this.index >= this.exercises.length) return this._finish();
    this._enterWork();
  }

  _logFor(ex) {
    return {
      id: ex.id, tijd: ex.workSec,
      swings: ex.isSwing ? this.swingCount : 0,
      rpe: this.rpeValues.length ? this.rpeValues[this.rpeValues.length - 1] : null,
      rating: this._lastRating || null,
      pijn: this._lastRating === 'PIJN' ? '😣' : null,
    };
  }

  // --- controls -----------------------------------------------------------
  pause() {
    if (this.segment === Segment.WERK || this.segment === Segment.RUST) this._prevSegment = this.segment;
    this.running = false; clearInterval(this._timer); this.segment = Segment.PAUZE;
    this._push(); this._mirror(Paths.CTRL_PAUSE); this._emit();
  }
  resume() {
    if (this.running) return;
    this.running = true;
    this.segment = this._prevSegment || Segment.WERK;
    this.screen = (this.segment === Segment.WERK && this.current && this.current.isSwing) ? Screen.SWINGS : Screen.PLAYER;
    this._tick(); this._mirror(Paths.CTRL_RESUME); this._push(); this._emit();
  }
  skip() { this._mirror(Paths.CTRL_SKIP); clearInterval(this._timer); this.running = false; this._advance(); }
  setDone() { this._mirror(Paths.CTRL_SET_DONE); clearInterval(this._timer); this.remaining = 0; this.running = false; this._onElapsed(); }
  emergencyStop() { this._chestStop(true); }

  reportPainNow() {
    if (this.segment === Segment.WERK || this.segment === Segment.RUST) this._prevSegment = this.segment;
    this.running = false; clearInterval(this._timer);
    this._midSetPain = true; this.segment = Segment.PAUZE;
    this.screen = Screen.PAIN_LOCATION; this._emit();
  }

  // --- swings -------------------------------------------------------------
  addSwing() { Store.ledger.add('phone'); Cue.swingTick(); this._persistSwings(); }
  undoSwing() { Store.ledger.undoLast('phone'); this._persistSwings(); }
  _persistSwings() { Store.saveLedger(); Bridge.putState(Paths.SWINGS, JSON.stringify(Store.ledger.toJSON())); this._emit(); }

  // --- feedback -----------------------------------------------------------
  submitRating(rating) {
    this._lastRating = rating;
    const ex = this.current;
    if (ex) this._mirror(Paths.PAIN_REPORT, { exerciseId: ex.id, rating });
    this.screen = rating === 'PIJN' ? Screen.PAIN_LOCATION : Screen.RPE;
    this._emit();
  }

  submitPainLocation(location) {
    const ex = this.current;
    if (location === PainLocation.BORST) return this._chestStop(true);
    this.painReports.push(`${ex ? ex.naam : 'Oefening'}: ${location.toLowerCase()} 😣`);
    if (ex) this._mirror(Paths.PAIN_REPORT, { exerciseId: ex.id, location });
    if (this._midSetPain) { this._midSetPain = false; this._resumeAfterPain(); }
    else { this.screen = Screen.RPE; this._emit(); }
  }

  _resumeAfterPain() {
    this.running = true;
    this.segment = this._prevSegment || Segment.WERK;
    this.screen = (this.segment === Segment.WERK && this.current && this.current.isSwing) ? Screen.SWINGS : Screen.PLAYER;
    this._tick(); this._emit();
  }

  submitRpe(value) {
    const v = Math.max(0, Math.min(10, value | 0));
    this.rpeValues.push(v);
    const ex = this.current;
    if (ex) this._mirror(Paths.RPE, { exerciseId: ex.id, value: v });
    this.screen = Screen.TALK_TEST;
    this._emit();
  }

  submitTalkTest(result) {
    const ex = this.current;
    if (ex) this._mirror(Paths.TALK_TEST, { exerciseId: ex.id, result });
    const lastRpe = this.rpeValues.length ? this.rpeValues[this.rpeValues.length - 1] : null;
    if (needsRecoveryCheck(lastRpe, result)) {
      Cue.safety();
      let r = '';
      if (lastRpe != null && lastRpe >= 8) r += `RPE ${lastRpe} is hoog. `;
      if (result === TalkTest.NEE) r += 'Praten lukte niet meer. ';
      this.recoveryReason = r.trim();
      this.segment = Segment.HERSTEL_CHECK;
      this.screen = Screen.RECOVERY;
      this._emit();
    } else {
      this._wasRest = true;
      this._enterRest();
    }
  }

  recoveryContinue() { this._wasRest = true; this._enterRest(); }
  recoveryStop() { this._finish(); }

  // --- emergency / block --------------------------------------------------
  _chestStop(local) {
    clearInterval(this._timer);
    this.running = false;
    Cue.safety();
    const block = applyChestEvent(Store.block, Date.now());
    Store.setBlock(block);
    this.segment = Segment.STOP;
    this.screen = Screen.STOP;
    Bridge.putState(Paths.BLOCK, JSON.stringify(block));   // dwing af op horloge
    if (local) this._mirror(Paths.CTRL_EMERGENCY, { kind: 'chest' });
    this._emit();
  }

  reportSymptoms(symptomKeys, painLocation) {
    if (isEmergency(symptomKeys, painLocation)) this._chestStop(true);
  }

  acknowledgeStop() { this._reset(); this._emit(); }

  // --- finish -------------------------------------------------------------
  async _finish() {
    clearInterval(this._timer);
    this.running = false;
    const durationSec = Math.round((Date.now() - this.startMs) / 1000);
    const avg = this.rpeValues.length ? this.rpeValues.reduce((a, b) => a + b, 0) / this.rpeValues.length : null;
    this.summary = {
      sessionId: this.sessionId, type: this.type, durationSec,
      exerciseNames: [...this.doneNames], totalSwings: this.swingCount,
      averageRpe: avg, painReports: [...this.painReports],
    };
    this.segment = Segment.KLAAR;
    this.screen = Screen.SUMMARY;
    this._emit();

    // Bewaar lokaal (bron van waarheid). Werk daarna de progressiegate bij.
    const record = {
      id: this.sessionId, datum: new Date().toISOString().slice(0, 10),
      type: this.type, oefeningen: this.oefeningLog, voltooid: true, duurSec: durationSec,
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

  dismissSummary() { this._reset(); this._emit(); }

  _reset() {
    this.active = false; this.running = false; clearInterval(this._timer);
    this.exercises = []; this.index = 0; this.remaining = 0; this.summary = null;
    this._midSetPain = false; this._lastRating = null; this._wasRest = false;
  }

  // --- watch mirroring ----------------------------------------------------
  _wireBridge() {
    Bridge.onMessage((path, payload) => this._onWatch(path, payload));
  }

  _onWatch(path, payload) {
    // SWINGS + BLOCK sync are merged centrally in app.js; here we only react to
    // control messages and (when the watch owns the session) session snapshots.
    switch (path) {
      case Paths.CTRL_PAUSE: if (this.running) { this.running = false; clearInterval(this._timer); this.segment = Segment.PAUZE; this._emit(); } break;
      case Paths.CTRL_RESUME: if (!this.running && this.active) { this.running = true; this._tick(); this._emit(); } break;
      case Paths.CTRL_SKIP: if (this.active) { clearInterval(this._timer); this.running = false; this._advance(); } break;
      case Paths.CTRL_EMERGENCY: this._chestStop(false); break;
      case Paths.CTRL_START: if (!this.active) this.start(payload.type || SessionType.NORMAAL, !!Store.block.swingsUnlocked, false); break;
      default: break;
    }
  }

  // Adopt a session the watch owns (phone renders it, watch drives the timer).
  adoptWatchSession(snap) {
    if (this.isOwner && this.active) return; // we own our own session; ignore
    this.active = true;
    this.isOwner = false;
    this.exercises = snap.exercises || [];
    this.index = snap.index || 0;
    this.remaining = snap.remainingSec || 0;
    this.running = !!snap.running;
    this.segment = snap.segment || 'WERK';
    this.type = snap.type || SessionType.NORMAAL;
    this.sessionId = snap.sessionId || this.sessionId;
    this.screen = snap.segment === 'STOP' ? Screen.STOP
      : snap.segment === 'KLAAR' ? Screen.SUMMARY
      : (this.current && this.current.isSwing && snap.segment === 'WERK') ? Screen.SWINGS
      : Screen.PLAYER;
    this._emit();
  }

  // --- sync helpers -------------------------------------------------------
  _mirror(path, payload = {}) { Bridge.sendControl(path, payload); }

  _push() {
    if (!Bridge.available || !this.isOwner) return;
    const snap = {
      sessionId: this.sessionId, type: this.type, segment: this.segment,
      exercises: this.exercises, index: this.index, remainingSec: this.remaining,
      running: this.running, swingCount: this.swingCount,
      updatedAtEpochMs: Date.now(), origin: 'phone',
    };
    Bridge.putState(Paths.SESSION, JSON.stringify(snap));
  }
}

export const Engine = new WorkoutEngine();
export { epochDay };
