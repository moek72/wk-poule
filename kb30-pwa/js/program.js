// program.js — het 12-weken weekprogramma van KB30.
//
// Weekritme:  Ma / Wo / Vr  = kettlebell-circuit (~30 min, sessie A en B om
// en om).  Di / Do = actief herstel & mobiliteit (~20 min).  Za / Zo = rust
// of een wandeling.
//
// Opbouw in 3 fases (berekend vanaf de startdatum in het profiel):
//   Fase 1  week 1–2   Techniekschool — geen swings, 3 rondes.
//   Fase 2  week 3–6   Swings erin — Russian swing, max ~20–30% van het circuit.
//   Fase 3  week 7–12  Opbouw — tot ~40% swings, vanaf week 9 evt. 4 rondes.
//
// Swings doen pas mee als ÉN de fase het toelaat ÉN de veiligheids-gate
// (gates.js → block.swingsUnlocked) is vrijgespeeld. Nooit alleen op kalender.

import { SessionType } from './safety.js';

export const DayKind = Object.freeze({ KB: 'KB', MOBILITEIT: 'MOBILITEIT', RUST: 'RUST' });

export const DAG_KORT = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
export const DAG_LANG = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
export const MAAND = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

// getDay() → soort dag. 0=zo … 6=za.
const WEEK_TEMPLATE = {
  1: DayKind.KB, 2: DayKind.MOBILITEIT, 3: DayKind.KB,
  4: DayKind.MOBILITEIT, 5: DayKind.KB, 6: DayKind.RUST, 0: DayKind.RUST,
};

export function isoDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function startOfDay(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/** Huidige programmaweek (1..12) vanaf profile.startDatum; zonder start: week 1. */
export function currentWeek(profile, now = new Date()) {
  const startISO = profile && profile.startDatum;
  if (!startISO) return 1;
  const start = startOfDay(new Date(startISO + 'T12:00:00'));
  // Programma begint op de maandag van de startweek.
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const diff = startOfDay(now) - start;
  const wk = Math.floor(diff / (7 * 86400000)) + 1;
  return Math.max(1, Math.min(12, wk));
}

/** Fase-informatie bij een programmaweek. */
export function phaseForWeek(week) {
  if (week <= 2) {
    return {
      fase: 1, naam: 'Techniekschool', vanWeek: 1, totWeek: 2,
      uitleg: 'Rustig de basis leren. Nog geen swings — eerst techniek.',
    };
  }
  if (week <= 6) {
    return {
      fase: 2, naam: 'Swings erin', vanWeek: 3, totWeek: 6,
      uitleg: 'De Russian swing doet mee, een klein deel van het circuit.',
    };
  }
  return {
    fase: 3, naam: 'Opbouw', vanWeek: 7, totWeek: 12,
    uitleg: 'Iets meer swings en volume — nog steeds op jouw tempo.',
  };
}

/** Sessie A of B voor een KB-dag: om en om over alle KB-dagen heen. */
export function kbVariantFor(date, week) {
  const slot = { 1: 0, 3: 1, 5: 2 }[date.getDay()] ?? 0;
  return ((week - 1) * 3 + slot) % 2 === 0 ? 'A' : 'B';
}

/**
 * Het volledige dagplan voor een datum.
 * @returns {{kind, week, fase, faseNaam, faseUitleg, variant, rounds, type,
 *            titel, sub, duurMin, icon}}
 */
export function planFor(date, profile) {
  const week = currentWeek(profile, date);
  const ph = phaseForWeek(week);
  const kind = WEEK_TEMPLATE[date.getDay()];
  const base = {
    kind, week, fase: ph.fase, faseNaam: ph.naam, faseUitleg: ph.uitleg,
    variant: null, rounds: 3, type: null, datum: isoDate(date),
  };

  if (kind === DayKind.KB) {
    const variant = kbVariantFor(date, week);
    const rounds = ph.fase === 3 && week >= 9 ? 4 : 3;
    return {
      ...base, variant, rounds, type: SessionType.NORMAAL,
      titel: `Kettlebell-circuit · Sessie ${variant}`,
      sub: variant === 'A' ? 'Benen, billen en core' : 'Houding, schouders en grip',
      duurMin: 30, icon: 'kb',
    };
  }
  if (kind === DayKind.MOBILITEIT) {
    return {
      ...base, type: SessionType.ALLEEN_MOBILITEIT, rounds: 3,
      titel: 'Actief herstel & mobiliteit',
      sub: 'Soepel bewegen, alles ontspannen',
      duurMin: 20, icon: 'mob',
    };
  }
  return {
    ...base, type: null,
    titel: 'Rustdag',
    sub: 'Herstel, of maak een rustige wandeling',
    duurMin: 0, icon: 'walk',
  };
}

/** De 7 dagen van de huidige kalenderweek, met status. */
export function weekOverview(profile, sessions, now = new Date()) {
  const doneDates = new Set((sessions || []).filter((s) => s.voltooid).map((s) => s.datum));
  const monday = startOfDay(now);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const plan = planFor(d, profile);
    days.push({
      date: d, iso: isoDate(d), label: DAG_KORT[d.getDay()],
      kind: plan.kind, icon: plan.icon,
      done: doneDates.has(isoDate(d)),
      isToday: isoDate(d) === isoDate(now),
      isPast: startOfDay(d) < startOfDay(now),
    });
  }
  return days;
}

/** Eerstvolgende trainingsdag ná vandaag (voor de samenvatting). */
export function nextTrainingDay(profile, now = new Date()) {
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const plan = planFor(d, profile);
    if (plan.kind !== DayKind.RUST) {
      return { ...plan, dagNaam: DAG_LANG[d.getDay()], date: d };
    }
  }
  return null;
}

/** Nederlandse datum: "maandag 13 juli". */
export function formatDayNL(d) {
  return `${DAG_LANG[d.getDay()]} ${d.getDate()} ${MAAND[d.getMonth()]}`;
}
