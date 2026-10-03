// db.js — kleine IndexedDB-wrapper. Alles lokaal, geen backend, geen tracking.
// Stores: sessions (afgeronde trainingen), morningChecks, measurements.

const DB_NAME = 'kb30';
const DB_VERSION = 1;

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('morningChecks')) {
        db.createObjectStore('morningChecks', { keyPath: 'datum' });
      }
      if (!db.objectStoreNames.contains('measurements')) {
        db.createObjectStore('measurements', { keyPath: 'datum' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let result;
    Promise.resolve(fn(s)).then((r) => (result = r));
    t.oncomplete = () => { db.close(); resolve(result); };
    t.onerror = () => { db.close(); reject(t.error); };
    t.onabort = () => { db.close(); reject(t.error); };
  });
}

function reqPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const DB = {
  putSession: (s) => tx('sessions', 'readwrite', (st) => st.put(s)),
  allSessions: () => tx('sessions', 'readonly', (st) => reqPromise(st.getAll())),
  putMorningCheck: (c) => tx('morningChecks', 'readwrite', (st) => st.put(c)),
  allMorningChecks: () => tx('morningChecks', 'readonly', (st) => reqPromise(st.getAll())),
  putMeasurement: (m) => tx('measurements', 'readwrite', (st) => st.put(m)),
  allMeasurements: () => tx('measurements', 'readonly', (st) => reqPromise(st.getAll())),

  async exportAll() {
    const [sessions, morningChecks, measurements] = await Promise.all([
      this.allSessions(), this.allMorningChecks(), this.allMeasurements(),
    ]);
    return { sessions, morningChecks, measurements };
  },

  async importAll(data) {
    for (const s of data.sessions || []) await this.putSession(s);
    for (const c of data.morningChecks || []) await this.putMorningCheck(c);
    for (const m of data.measurements || []) await this.putMeasurement(m);
  },
};
