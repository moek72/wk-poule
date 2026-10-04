// illustrations.js — inline SVG-illustraties per oefening, in de stijl van de
// goedgekeurde mockups: grote, stevige figuren (dikke lichte lijn, oranje
// kettlebell, subtiele vloerlijn). Alles inline zodat het offline werkt.
//
// Publieke API blijft gelijk: illustration(key) en icon(name).
// Kleuren/lijndiktes komen uit CSS (.illo .fig / .hd / .bell / .bh / .floor).

function frame(inner, cls = '') {
  return `<svg viewBox="0 0 200 220" class="illo ${cls}" role="img" aria-hidden="true">${inner}</svg>`;
}
const floor = (x1 = 46, x2 = 154) => `<line class="floor" x1="${x1}" y1="204" x2="${x2}" y2="204"/>`;
const head = (cx, cy, r = 14) => `<circle class="hd" cx="${cx}" cy="${cy}" r="${r}"/>`;
const bell = (cx, cy, r = 13) =>
  `<path class="bh" d="M${cx - 7},${cy - r + 1} q7,-13 14,0"/><circle class="bell" cx="${cx}" cy="${cy}" r="${r}"/>`;

const FIGS = {
  // Rechtop, armen licht gespreid — neutrale houding.
  generic: () => frame(
    floor(52, 148) + head(100, 42) +
    `<path class="fig" d="M100,56 L100,120"/>
     <path class="fig" d="M100,68 L74,110"/>
     <path class="fig" d="M100,68 L126,110"/>
     <path class="fig" d="M100,120 L88,160 L88,202"/>
     <path class="fig" d="M100,120 L112,160 L112,202"/>`),

  // Marcheren: één knie omhoog.
  march: () => frame(
    floor(52, 148) + head(102, 40) +
    `<path class="fig" d="M102,54 L100,118"/>
     <path class="fig" d="M101,66 L78,104"/>
     <path class="fig" d="M101,66 L124,102"/>
     <path class="fig" d="M100,118 L90,160 L90,202"/>
     <path class="fig" d="M100,118 L128,142 L126,176"/>`),

  // Farmer carry: twee bellen langs het lijf (uit de mockup).
  carry: () => frame(
    floor(52, 148) + head(100, 42) +
    `<path class="fig" d="M100,56 L100,120"/>
     <path class="fig" d="M100,68 L78,120"/>
     <path class="fig" d="M100,68 L122,120"/>
     <path class="fig" d="M100,120 L90,160 L90,202"/>
     <path class="fig" d="M100,120 L110,160 L110,202"/>` +
    bell(78, 133, 12) + bell(122, 133, 12)),

  // Goblet box squat: zit rustig naar achteren, bel tegen de borst, box erachter.
  squat: () => frame(
    floor(28, 172) + head(84, 52) +
    `<path class="fig" d="M86,66 Q92,90 96,114"/>
     <path class="fig" d="M88,78 L102,96"/>
     <path class="fig" d="M87,82 L100,102"/>
     <path class="fig" d="M96,114 L70,146 L72,202"/>
     <path class="fig" d="M96,114 L116,150 L114,202"/>
     <rect x="128" y="160" width="44" height="44" rx="6" style="fill:none;stroke:#24262c;stroke-width:6"/>` +
    bell(108, 102, 11)),

  // KB deadlift: hip hinge boven de bel (uit de mockup).
  deadlift: () => frame(
    floor() + head(100, 40, 15) +
    `<path class="fig" d="M100,56 Q101,86 102,116"/>
     <path class="fig" d="M92,70 L96,150"/>
     <path class="fig" d="M108,70 L104,150"/>
     <path class="fig" d="M101,116 L80,160 L79,202"/>
     <path class="fig" d="M101,116 L121,160 L122,202"/>` +
    bell(100, 166, 16)),

  // Shoulder press: één arm duwt de bel omhoog (neutrale baan).
  press: () => frame(
    floor(52, 148) + head(98, 48) +
    `<path class="fig" d="M98,62 L98,124"/>
     <path class="fig" d="M98,74 L126,62 L128,32"/>
     <path class="fig" d="M98,74 L74,112"/>
     <path class="fig" d="M98,124 L86,162 L86,202"/>
     <path class="fig" d="M98,124 L110,162 L110,202"/>` +
    bell(132, 24, 11)),

  // Calf raises: op de tenen, hakken los van de vloer.
  calf: () => frame(
    floor(52, 148) + head(100, 38) +
    `<path class="fig" d="M100,52 L100,116"/>
     <path class="fig" d="M100,64 L78,108"/>
     <path class="fig" d="M100,64 L122,108"/>
     <path class="fig" d="M100,116 L92,156 L92,192"/>
     <path class="fig" d="M100,116 L108,156 L108,192"/>
     <path class="fig" d="M88,192 L96,192"/>
     <path class="fig" d="M104,192 L112,192"/>`),

  // Wood chop: bel hoog bij de schouder, diagonale baan naar de heup.
  chop: () => frame(
    floor(48, 152) + head(96, 44) +
    `<path class="fig" d="M96,58 L98,120"/>
     <path class="fig" d="M97,70 L128,50"/>
     <path class="fig" d="M97,70 L114,86"/>
     <path class="fig" d="M98,120 L82,160 L82,202"/>
     <path class="fig" d="M98,120 L116,160 L118,202"/>` +
    bell(136, 46, 11) +
    `<path class="bh" style="stroke-dasharray:4 8" d="M132,58 L74,132"/>`),

  // Russian swing: hinge, bel zwaait naar voren met vaartlijn.
  swing: () => frame(
    floor(38, 162) + head(82, 44, 15) +
    `<path class="fig" d="M84,58 Q92,84 98,108"/>
     <path class="fig" d="M88,70 L126,96"/>
     <path class="fig" d="M92,76 L128,104"/>
     <path class="fig" d="M98,108 L74,152 L72,202"/>
     <path class="fig" d="M98,108 L112,156 L116,202"/>` +
    bell(138, 112, 15) +
    `<path class="bh" style="stroke-dasharray:4 8" d="M146,100 Q160,64 140,40"/>`),
};

export function illustration(key, cls = '') {
  const svg = (FIGS[key] || FIGS.generic)();
  return cls ? svg.replace('class="illo ', `class="illo ${cls} `) : svg;
}

// ---------------------------------------------------------------------------
// UI-iconen: één lijnstijl (stroke, ronde uiteinden), 24×24, currentColor.
// Minimaal en volwassen — geen decoratie.
// ---------------------------------------------------------------------------

const ICONS = {
  // Kettlebell-glyph (deels gevuld, oranje via CSS-kleur van de aanroeper)
  kb: '<path d="M9 8V7a3 3 0 0 1 6 0v1"/><path d="M7.5 9h9l-.8 4a4 4 0 0 1-7.4 0Z" fill="currentColor" stroke="none"/>',
  // Slotje
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  // Chevron rechts
  chev: '<path d="m9 6 6 6-6 6"/>',
  // Pijl terug
  back: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  // Instellingen
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M21 12h-3M6 12H3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6"/>',
  // Uitroepteken (stop)
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>',
  // Microfoon
  mic: '<rect x="9.5" y="3.5" width="5" height="10" rx="2.5"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v3.5"/>',
  // Vinkje
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
};

/** UI-icoon als inline SVG (stroke = currentColor). */
export function icon(name, cls = '') {
  const body = ICONS[name] || ICONS.kb;
  return `<svg viewBox="0 0 24 24" class="icn ${cls}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
