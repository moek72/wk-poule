// illustrations.js — inline SVG-illustraties per oefening. Eén lijnstijl,
// 2 kleuren + accent. Alles inline zodat het offline werkt (geen externe images).

const HEAD = 'var(--fig, #123)';
const LINE = 'var(--fig, #123)';
const BELL = 'var(--accent, #0e9c82)';

function frame(inner) {
  return `<svg viewBox="0 0 120 120" class="illu" role="img" aria-hidden="true">
    <style>.l{fill:none;stroke:${LINE};stroke-width:5;stroke-linecap:round;stroke-linejoin:round}
    .h{fill:${HEAD}}.b{fill:${BELL}}</style>${inner}</svg>`;
}
const head = (cx, cy) => `<circle class="h" cx="${cx}" cy="${cy}" r="8"/>`;
const bell = (cx, cy, r = 9) =>
  `<circle class="b" cx="${cx}" cy="${cy}" r="${r}"/><path class="l" style="stroke:${BELL};stroke-width:3" d="M${cx - 5},${cy - r + 2} q5,-6 10,0"/>`;

const FIGS = {
  generic: () => frame(head(60, 22) + `<path class="l" d="M60,32 V70 M60,40 L44,56 M60,40 L76,56 M60,70 L50,100 M60,70 L70,100"/>`),

  march: () => frame(head(60, 22) + `<path class="l" d="M60,32 V70 M60,40 L46,54 M60,40 L74,54 M60,70 L48,98 M60,70 L72,80 L70,98"/>`),

  carry: () => frame(head(60, 22) +
    `<path class="l" d="M60,32 V72 M60,38 L44,64 M60,38 L76,64 M60,72 L52,100 M60,72 L68,100"/>` +
    bell(44, 70, 7) + bell(76, 70, 7)),

  squat: () => frame(head(52, 26) +
    `<path class="l" d="M52,36 V60 M52,44 L40,54 M52,44 L64,54 M52,60 L44,74 L44,96 M52,60 L64,74 L64,96"/>` +
    `<rect x="70" y="78" width="26" height="6" rx="2" class="b"/><path class="l" d="M74,84 V100 M92,84 V100"/>` +
    bell(52, 52, 7)),

  deadlift: () => frame(head(46, 30) +
    `<path class="l" d="M46,38 Q56,44 66,50 M46,38 L40,60 M40,60 L36,96 M40,60 L52,92 M66,50 L60,78"/>` +
    bell(66, 62, 8)),

  press: () => frame(head(60, 30) +
    `<path class="l" d="M60,40 V74 M60,46 L46,40 L44,22 M60,46 L74,40 M60,74 L52,100 M60,74 L68,100"/>` +
    bell(44, 20, 7)),

  calf: () => frame(head(60, 22) +
    `<path class="l" d="M60,32 V72 M60,40 L46,54 M60,40 L74,54 M60,72 L52,92 L52,98 M60,72 L68,92 L68,98"/>` +
    `<path class="l" style="stroke:${BELL}" d="M40,100 h40"/>`),

  chop: () => frame(head(58, 24) +
    `<path class="l" d="M58,34 V70 M58,40 L74,30 M58,40 L70,52 M58,70 L50,98 M58,70 L66,98"/>` +
    bell(74, 28, 7) + `<path class="l" style="stroke:${BELL};stroke-dasharray:3 4" d="M74,30 L46,64"/>`),

  swing: () => frame(head(44, 24) +
    `<path class="l" d="M44,32 L54,54 M44,36 L64,58 M54,54 L48,98 M54,54 L68,92" />` +
    bell(66, 62, 9) +
    `<path class="l" style="stroke:${BELL};stroke-dasharray:3 4" d="M66,62 Q86,40 78,20"/>`),
};

export function illustration(key) {
  return (FIGS[key] || FIGS.generic)();
}

// ---------------------------------------------------------------------------
// UI-iconen: één lijnstijl (stroke, ronde uiteinden), 24×24, currentColor.
// Inline SVG zodat alles offline werkt en meekleurt met de tekstkleur.
// ---------------------------------------------------------------------------

const ICONS = {
  // Kettlebell
  kb: '<path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/><path d="M7.2 9h9.6a1 1 0 0 1 .97 1.24 l-1.1 4.4a5 5 0 0 1-9.34 0l-1.1-4.4A1 1 0 0 1 7.2 9Z"/>',
  // Mobiliteit / golf
  mob: '<path d="M3 15c2.5 0 2.5-5 5-5s2.5 5 5 5 2.5-5 5-5 2.5 5 3 5"/>',
  // Wandelen
  walk: '<circle cx="13" cy="4.5" r="1.6"/><path d="M12.5 8l-2 4.5L8 21"/><path d="M12.5 8l2.5 3 3 1"/><path d="M12.5 8L10 9.5 8.5 12"/><path d="M10.5 12.5l2.5 3.5 1 5"/>',
  // Vinkje
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  // Slotje
  lock: '<rect x="6" y="11" width="12" height="9" rx="2"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/>',
  // Vlam (streak)
  flame: '<path d="M12 3c1 3-3 4.5-3 8a3.5 3.5 0 0 0 7 0c0-1.5-.7-2.6-1.3-3.5C16.5 9 18 10.6 18 13a6 6 0 0 1-12 0c0-4.5 4.5-6.5 6-10Z"/>',
  // Huis / vandaag
  home: '<path d="M4 11.5L12 4.5l8 7"/><path d="M6.5 10v9h11v-9"/>',
  // Boek / oefeningen
  book: '<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15.5H7.5A2.5 2.5 0 0 0 5 21V5.5Z"/><path d="M5 18.5A2.5 2.5 0 0 1 7.5 16H19"/>',
  // Grafiek / voortgang
  chart: '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 15.5l3.5-4 3 2.5L19 8"/>',
  // Instellingen
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 4v2.2M12 17.8V20M20 12h-2.2M6.2 12H4M17.6 6.4l-1.5 1.5M7.9 16.1l-1.5 1.5M17.6 17.6l-1.5-1.5M7.9 7.9L6.4 6.4"/>',
  // Pijl terug
  back: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  // Hartje
  heart: '<path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10Z"/>',
  // Microfoon
  mic: '<rect x="9.5" y="3.5" width="5" height="10" rx="2.5"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v3.5"/>',
  // Speaker / stem
  speaker: '<path d="M4 9.5v5h3l5 4v-13l-5 4H4Z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M17.5 6.5a7.5 7.5 0 0 1 0 11"/>',
  // Kalender / week
  week: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  // Zon (rust)
  rest: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M21 12h-2M5 12H3M18.4 5.6l-1.4 1.4M7 17l-1.4 1.4M18.4 18.4L17 17M7 7L5.6 5.6"/>',
};

/** UI-icoon als inline SVG (stroke = currentColor). */
export function icon(name, cls = '') {
  const body = ICONS[name] || ICONS.kb;
  return `<svg viewBox="0 0 24 24" class="icn ${cls}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
