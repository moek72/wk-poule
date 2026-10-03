// gates.js — progressielogica. Fase 2 (swings) unlockt alleen als:
//   ≥ 6 voltooide KB-sessies, ÉN de laatste 3 zonder 😣, ÉN ochtend-checks
//   zonder rug/nekpijn. Progressie is nooit verplicht.

const PIJN = '😣';

export function computeSwingsUnlocked(sessions, morningChecks) {
  const kb = sessions
    .filter((s) => s.voltooid && s.type !== 'ALLEEN_MOBILITEIT')
    .sort((a, b) => (a.datum < b.datum ? -1 : 1));
  if (kb.length < 6) return false;

  const last3 = kb.slice(-3);
  const pijnInLaatste3 = last3.some((s) =>
    (s.oefeningen || []).some((o) => o.pijn === PIJN || o.rating === 'PIJN'),
  );
  if (pijnInLaatste3) return false;

  // Ochtend-checks van de laatste ~2 weken zonder rug/nekpijn.
  const recent = (morningChecks || []).slice(-6);
  const rugNekPijn = recent.some(
    (c) => c.score === PIJN && ['RUG', 'NEK', 'rug', 'nek'].includes(c.locatie),
  );
  if (rugNekPijn) return false;

  return true;
}

// Volume omhoog (+1 ronde) mag alleen na een volledig pijnvrije week.
export function mayIncreaseVolume(sessionsThisWeek) {
  if (sessionsThisWeek.length === 0) return false;
  return !sessionsThisWeek.some((s) =>
    (s.oefeningen || []).some((o) => o.pijn === PIJN || o.rating === 'PIJN'),
  );
}
