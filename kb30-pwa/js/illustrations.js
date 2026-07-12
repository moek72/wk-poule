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
