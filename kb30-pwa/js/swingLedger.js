// swingLedger.js — conflictvrije swingteller (CRDT), tegenhanger van de Kotlin
// SwingLedger. Elke tik is een uniek event "origin:seq". De teller is een
// 2P-set: added (alle tikken) en removed (undo's). count = |added \ removed|.
// Merge = union op beide velden → geen dubbeltellingen, undo's overleven merges.

export class SwingLedger {
  constructor(added = [], removed = []) {
    this.added = new Set(added);
    this.removed = new Set(removed);
  }

  get count() {
    let n = 0;
    for (const id of this.added) if (!this.removed.has(id)) n++;
    return n;
  }

  _nextSeq(origin) {
    const prefix = origin + ':';
    let max = 0;
    for (const id of this.added) {
      if (id.startsWith(prefix)) {
        const seq = parseInt(id.slice(prefix.length), 10);
        if (Number.isFinite(seq) && seq > max) max = seq;
      }
    }
    return max + 1;
  }

  add(origin) {
    const id = origin + ':' + this._nextSeq(origin);
    this.added.add(id);
    return id;
  }

  undoLast(origin) {
    const prefix = origin + ':';
    let best = null;
    let bestSeq = -1;
    for (const id of this.added) {
      if (id.startsWith(prefix) && !this.removed.has(id)) {
        const seq = parseInt(id.slice(prefix.length), 10);
        if (seq > bestSeq) { bestSeq = seq; best = id; }
      }
    }
    if (best == null) return null;
    this.removed.add(best);
    return best;
  }

  merge(other) {
    for (const id of other.added) this.added.add(id);
    for (const id of other.removed) this.removed.add(id);
    return this;
  }

  copy() {
    return new SwingLedger([...this.added], [...this.removed]);
  }

  toJSON() {
    return { added: [...this.added], removed: [...this.removed] };
  }

  static fromJSON(obj) {
    try {
      const o = typeof obj === 'string' ? JSON.parse(obj) : obj;
      return new SwingLedger(o.added || [], o.removed || []);
    } catch {
      return new SwingLedger();
    }
  }
}
