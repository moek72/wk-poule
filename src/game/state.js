const listeners = new Map();

export const initialState = {
  credit: 40,
  club: 0,
  round: 1,
  bonus: 0,
  reels: [null, null, null],
  holds: [false, false, false],
  mode: 'intro',
  pendingWin: null,
  lastWin: null,
  lastMessage: 'Welkom bij Familie Club 2000',
  muted: false,
  debug: false,
  forcedResult: null,
  stats: {
    spins: 0,
    wins: 0,
    jackpots: 0,
  },
};

export const state = structuredClone(initialState);

export function subscribe(key, callback) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(callback);
  return () => listeners.get(key)?.delete(callback);
}

function emit(key, value) {
  listeners.get(key)?.forEach((callback) => callback(value, state));
  listeners.get('*')?.forEach((callback) => callback(state, key, value));
}

export function setState(key, value) {
  state[key] = value;
  emit(key, value);
}

export function patchState(updates) {
  Object.entries(updates).forEach(([key, value]) => setState(key, value));
}

export function setMessage(message) {
  setState('lastMessage', message);
}

export function addClub(points) {
  setState('club', Math.max(0, Math.min(200, state.club + points)));
}

export function spendClub(points) {
  if (state.club < points) return false;
  addClub(-points);
  return true;
}

export function spendCredit(points = 1) {
  if (state.credit < points) return false;
  setState('credit', state.credit - points);
  return true;
}

export function addCredit(points) {
  setState('credit', state.credit + points);
}

export function resetState() {
  const fresh = structuredClone(initialState);
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, fresh);
  emit('*', state);
}
