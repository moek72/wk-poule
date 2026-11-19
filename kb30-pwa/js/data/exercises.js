// exercises.js — de KB30-oefenbibliotheek. Alle oefeningen zijn STAAND, geen
// diepe squats, geen diep vooroverbuigen, geen belasting boven het hoofd, max
// 8 kg. Verboden oefeningen bestaan hier simpelweg niet.
//
// Elke oefening: id, naam, spiergroepen, moeilijkheid, stappen (B1), "waarom"
// (coach-uitleg), Moek-waarschuwing, standaard werk/rust, illustratie-key en
// flags.

import { SessionType } from '../safety.js';

export const EXERCISES = [
  {
    id: 'kb_deadlift', naam: 'KB Deadlift', spieren: ['benen', 'billen', 'rug'],
    moeilijk: 1, gewichtKg: 8, workSec: 40, restSec: 20, illu: 'deadlift',
    cue1: 'Rug neutraal', cue2: 'Kracht uit de heupen',
    stappen: [
      'Sta rechtop, voeten op heupbreedte, kettlebell tussen je voeten.',
      'Duw je heupen naar achteren, rug blijft recht.',
      'Pak de bel en kom omhoog door je heupen naar voren te duwen.',
      'Knijp je billen aan bovenin. Rustig weer zakken.',
    ],
    waarom: 'Sterke benen en billen beschermen je rug. Dit is ook de school voor de swing.',
    waarschuwing: 'Dit is de swing-school. Rug altijd neutraal, nooit rond.',
  },
  {
    id: 'box_squat', naam: 'Goblet Box Squat', spieren: ['benen'],
    moeilijk: 1, gewichtKg: 8, workSec: 40, restSec: 20, illu: 'squat',
    cue1: 'Naar de stoel', cue2: 'Niet dieper',
    stappen: [
      'Sta voor een stoel, kettlebell tegen je borst (goblet).',
      'Zak rustig tot je de stoel net raakt.',
      'Kom meteen weer omhoog. Rug rechtop.',
    ],
    waarom: 'Zo blijft opstaan uit een stoel makkelijk. Sterke benen, veilige diepte.',
    waarschuwing: 'Nooit dieper dan de stoel. Knieën blijven achter je tenen.',
  },
  {
    id: 'farmer_carry', naam: 'Farmer Carry', spieren: ['grip', 'core', 'houding'],
    moeilijk: 1, gewichtKg: 8, workSec: 40, restSec: 20, illu: 'carry',
    cue1: 'Schouders laag', cue2: 'Rustig lopen',
    stappen: [
      'Pak in elke hand een kettlebell.',
      'Sta rechtop, schouders laag en naar achteren.',
      'Loop rustig heen en weer. Adem door.',
    ],
    waarom: 'Boodschappen sjouwen zonder klachten: grip, houding en core in één.',
    waarschuwing: 'Niet hangen aan je schouders. Rustig tempo.',
  },
  {
    id: 'suitcase_carry', naam: 'Suitcase Carry', spieren: ['zijkant core'],
    moeilijk: 2, gewichtKg: 8, workSec: 40, restSec: 20, illu: 'carry',
    cue1: 'Rechtop blijven', cue2: 'Niet zijwaarts hangen',
    stappen: [
      'Pak één kettlebell in één hand.',
      'Sta kaarsrecht, blijf recht ondanks het gewicht aan één kant.',
      'Loop rustig. Wissel daarna van hand.',
    ],
    waarom: 'Je zijkant leert je rechtop te houden — daar heeft je rug elke dag wat aan.',
    waarschuwing: 'Niet zijwaarts overhangen — je core houdt je recht.',
  },
  {
    id: 'front_rack_march', naam: 'Front Rack March', spieren: ['core', 'benen'],
    moeilijk: 2, gewichtKg: 4, workSec: 40, restSec: 20, illu: 'march',
    cue1: 'Rechtop', cue2: 'Rustig tempo', neckShoulder: true,
    stappen: [
      'Houd twee lichte bellen bij je schouders (front rack).',
      'Marcheer op de plaats, knie rustig omhoog.',
      'Blijf rechtop, buik licht aangespannen.',
    ],
    waarom: 'Balans en core-kracht, zonder je nek te belasten.',
    waarschuwing: 'Blijf rechtop, niet omhoog kijken.',
  },
  {
    id: 'shoulder_press', naam: 'Shoulder Press (neutraal)', spieren: ['schouders'],
    moeilijk: 2, gewichtKg: 4, workSec: 40, restSec: 20, illu: 'press', neckShoulder: true,
    cue1: 'Pijnvrije baan', cue2: 'Niet omhoog kijken',
    stappen: [
      'Bel op schouderhoogte, neutrale grip (handpalm naar binnen).',
      'Duw rustig omhoog, alleen zover als pijnvrij is.',
      'Rustig terug. Stop bij nekpijn.',
    ],
    waarom: 'Soepele, sterke schouders voor alles wat je dagelijks tilt en pakt.',
    waarschuwing: 'Alleen pijnvrije baan. Niet omhoog kijken. Stop bij nekpijn.',
  },
  {
    id: 'goblet_march', naam: 'Goblet Standing March', spieren: ['core', 'benen'],
    moeilijk: 1, gewichtKg: 6, workSec: 40, restSec: 20, illu: 'march',
    cue1: 'Knie rustig omhoog', cue2: 'Rechtop',
    stappen: [
      'Kettlebell tegen je borst (goblet).',
      'Marcheer op de plaats, knie rustig omhoog.',
      'Rustig tempo, rechtop blijven.',
    ],
    waarom: 'Conditie en core tegelijk, lekker rustig op je eigen tempo.',
    waarschuwing: 'Rustig tempo, rechtop blijven.',
  },
  {
    id: 'calf_raises', naam: 'Calf Raises', spieren: ['kuiten'],
    moeilijk: 1, gewichtKg: 4, workSec: 40, restSec: 20, illu: 'calf',
    cue1: 'Hand aan de muur', cue2: 'Rustig omhoog',
    stappen: [
      'Sta rechtop, eventueel hand aan de muur voor balans.',
      'Kom rustig op je tenen.',
      'Rustig weer zakken.',
    ],
    waarom: 'Sterke kuiten helpen je bloedsomloop en je balans.',
    waarschuwing: 'Hand aan de muur mag, voor balans.',
  },
  {
    id: 'wood_chop', naam: 'Wood Chop hoog→midden', spieren: ['core', 'rotatie'],
    moeilijk: 2, gewichtKg: 4, workSec: 40, restSec: 20, illu: 'chop',
    cue1: 'Klein bereik', cue2: 'Nooit naar de grond',
    stappen: [
      'Bel met beide handen bij één schouder.',
      'Beweeg rustig diagonaal naar je heup aan de andere kant.',
      'Klein bereik, rug neutraal.',
    ],
    waarom: 'Draaikracht voor het echte leven: iets aanpakken, wegzetten, omdraaien.',
    waarschuwing: 'Klein bereik, nooit tot de grond. Rug neutraal.',
  },
  {
    id: 'around_body', naam: 'Around-the-body Pass', spieren: ['core'],
    moeilijk: 1, gewichtKg: 4, workSec: 40, restSec: 20, illu: 'generic', optioneel: false,
    cue1: 'Rustig tempo', cue2: 'Rechtop',
    stappen: [
      'Geef de bel rond je middel door van hand naar hand.',
      'Blijf rechtop, rustig tempo.',
      'Wissel halverwege van richting.',
    ],
    waarom: 'Coördinatie en grip — en je core werkt stilletjes de hele tijd mee.',
    waarschuwing: 'Rechtop blijven, rustig doorgeven.',
  },
  {
    id: 'halo', naam: 'Halo (klein rondje)', spieren: ['schouders'],
    moeilijk: 2, gewichtKg: 4, workSec: 30, restSec: 20, illu: 'generic',
    neckShoulder: true, optioneel: true,
    cue1: 'Klein rondje', cue2: 'Bij nekklachten overslaan',
    stappen: [
      'Bel voor je borst, beide handen.',
      'Maak een klein rondje rond je hoofd.',
      'Rustig, klein bereik.',
    ],
    waarom: 'Houdt je schouders soepel — klein en gecontroleerd.',
    waarschuwing: 'OPTIONEEL. Overslaan bij nekklachten die dag.',
  },
  {
    id: 'row_support', naam: 'Steunend eenarmig roeien', spieren: ['rug'],
    moeilijk: 2, gewichtKg: 8, workSec: 40, restSec: 20, illu: 'generic', optioneel: true,
    cue1: 'Rug recht', cue2: 'Lichte hoek',
    stappen: [
      'Eén hand op de tafel, lichte hoek voorover, rug recht.',
      'Trek de bel met de andere hand naar je heup.',
      'Rustig laten zakken.',
    ],
    waarom: 'Een sterke bovenrug helpt je houding, elke dag.',
    waarschuwing: 'OPTIONEEL. Rug recht, lichte hoek, niet diep voorover.',
  },
  // --- Fase 2+ (op slot tot unlock) ---
  {
    id: 'russian_swing', naam: 'Russian Two-hand Swing', spieren: ['heupen', 'rug', 'benen'],
    moeilijk: 3, gewichtKg: 8, workSec: 30, restSec: 30, illu: 'swing',
    isSwing: true, fase: 2,
    cue1: 'Kracht uit de heupen', cue2: 'Max tot borsthoogte',
    stappen: [
      'Kettlebell met twee handen, voeten iets breder dan heupbreedte.',
      'Kantel in de heupen (hip hinge), rug neutraal.',
      'Duw je heupen explosief naar voren — de bel zwaait tot borsthoogte.',
      'Laat de bel terugvallen, vang met een nieuwe hip hinge.',
    ],
    waarom: 'Dé oefening: kracht én conditie in één. Deze verdien je in fase 2.',
    waarschuwing: 'Kracht uit de heupen, armen ontspannen. NOOIT trekken met rug of armen. Max tot borsthoogte.',
  },
  {
    id: 'single_swing', naam: 'Single-arm Swing', spieren: ['heupen', 'rug'],
    moeilijk: 3, gewichtKg: 8, workSec: 30, restSec: 30, illu: 'swing',
    isSwing: true, fase: 3, optioneel: true,
    cue1: 'Heupen sturen', cue2: 'Schouder laag',
    stappen: [
      'Zelfde als de Russian swing, maar met één hand.',
      'Houd je schouder laag en stabiel.',
      'Wissel per set van arm.',
    ],
    waarom: 'Zelfde kracht als de swing, met extra balans en core.',
    waarschuwing: 'Fase 3, optioneel. Alleen als de two-hand swing pijnvrij is.',
  },
];

export const MOBILITY = [
  { id: 'mob_march', naam: 'Marcheren op de plaats', gewichtKg: 0, workSec: 40, restSec: 20, illu: 'march', cue1: 'Rustig tempo', cue2: 'Adem door', spieren: ['benen'], stappen: ['Marcheer rustig op de plaats.', 'Adem rustig door.'], waarom: 'Zet je bloedsomloop zachtjes aan.', waarschuwing: 'Rustig aan.' },
  { id: 'mob_shoulder', naam: 'Schouderrolletjes', gewichtKg: 0, workSec: 30, restSec: 15, illu: 'generic', cue1: 'Klein rondje', cue2: 'Ontspannen', spieren: ['schouders'], stappen: ['Rol je schouders rustig naar achteren.'], waarom: 'Maakt je schouders en nek losser.', waarschuwing: 'Ontspannen bewegen.' },
  { id: 'mob_hip', naam: 'Heupcirkels', gewichtKg: 0, workSec: 30, restSec: 15, illu: 'generic', cue1: 'Kleine cirkel', cue2: 'Rug neutraal', spieren: ['heupen'], stappen: ['Handen op je heupen, maak rustige cirkels.'], waarom: 'Soepele heupen maken alles makkelijker.', waarschuwing: 'Kleine, rustige cirkels.' },
  { id: 'mob_counter', naam: 'Rugmobilisatie (aanrecht)', gewichtKg: 0, workSec: 30, restSec: 15, illu: 'generic', cue1: 'Handen op aanrecht', cue2: 'Lichte hoek', spieren: ['rug'], stappen: ['Handen op het aanrecht, lichte hoek, rug lang maken.'], waarom: 'Geeft je rug rustig ruimte, zonder belasting.', waarschuwing: 'Onbelast, lichte hoek.' },
  { id: 'mob_suitcase', naam: 'Lichte Suitcase Carry', gewichtKg: 4, workSec: 30, restSec: 20, illu: 'carry', cue1: '4 kg', cue2: 'Rechtop', spieren: ['core'], stappen: ['Eén lichte bel, loop rechtop.'], waarom: 'Licht werk voor je core, houdt je actief.', waarschuwing: 'Licht gewicht, rechtop.' },
];

export const WARMUP = {
  id: 'warmup', naam: 'Warming-up', gewichtKg: 0, workSec: 300, restSec: 0, illu: 'march',
  cue1: 'Marcheren + armcirkels', cue2: 'Losmaken', spieren: ['algemeen'],
  stappen: ['Marcheer op de plaats.', 'Armcirkels en schouderrolletjes.', 'Heupscharnier zonder gewicht.'],
  waarom: 'Warm spierweefsel beweegt soepeler en beschermt je rug.',
  waarschuwing: 'Niet stiekem overslaan — dit beschermt je rug.',
};
export const COOLDOWN = {
  id: 'cooldown', naam: 'Cooling-down', gewichtKg: 0, workSec: 300, restSec: 0, illu: 'march',
  cue1: 'Rustig marcheren', cue2: 'Staande stretches', spieren: ['algemeen'],
  stappen: ['Rustig marcheren.', 'Staande stretches, rustig ademen.'],
  waarom: 'Zo komt je lijf rustig tot rust na het werk.',
  waarschuwing: 'Rustig uitlopen.',
};

export function byId(id) {
  return EXERCISES.find((e) => e.id === id) || null;
}

// Uitvoeringsmodus per oefening: 'time' (aftellen), 'reps' (zelf-tempo, target),
// 'swings' (tik-teller op tijd). Bepaalt hoe de teller op de speler eruitziet.
const MODES = {
  kb_deadlift: { mode: 'reps', reps: 10 },
  box_squat: { mode: 'reps', reps: 10 },
  farmer_carry: { mode: 'time' },
  suitcase_carry: { mode: 'time' },
  front_rack_march: { mode: 'time' },
  shoulder_press: { mode: 'reps', reps: 8 },
  goblet_march: { mode: 'time' },
  calf_raises: { mode: 'reps', reps: 15 },
  wood_chop: { mode: 'reps', reps: 10 },
  around_body: { mode: 'time' },
  halo: { mode: 'reps', reps: 8 },
  row_support: { mode: 'reps', reps: 10 },
  russian_swing: { mode: 'swings' },
  single_swing: { mode: 'swings' },
};

// De twee circuits die Ma/Wo/Vr afwisselen. Deadlift blijft in beide: dat is
// de swing-school én de veiligste kracht-basis.
export const SESSION_A = ['kb_deadlift', 'box_squat', 'farmer_carry', 'goblet_march', 'wood_chop'];
export const SESSION_B = ['kb_deadlift', 'shoulder_press', 'suitcase_carry', 'calf_raises', 'around_body'];

function withMode(e) {
  const m = MODES[e.id] || { mode: 'time' };
  return { ...clone(e), mode: m.mode, reps: m.reps || null };
}

/**
 * Bouw de geordende sessie: een lijst 'stappen'. Elke circuit-oefening krijgt
 * meta voor de tellers (ronde X/Y, oefening A/B). Warming-up en cooling-down
 * staan als aparte stappen zonder ronde-teller.
 *
 * Swings doen alleen mee als swingsUnlocked (veiligheids-gate) én de fase het
 * toelaat: fase 2 → 1 van de 5 slots (20%), fase 3 → 2 van de 5 (40%).
 *
 * @param {string} type NORMAAL / LICHT / ALLEEN_MOBILITEIT
 * @param {boolean} swingsUnlocked
 * @param {number} rounds standaard 3 (fase 3, week 9+: 4)
 * @param {{variant?:('A'|'B'), fase?:number}} opts
 */
export function buildSession(type, swingsUnlocked, rounds = 3, opts = {}) {
  const variant = opts.variant === 'B' ? 'B' : 'A';
  const fase = opts.fase || (swingsUnlocked ? 2 : 1);
  let circuit;
  let r = Math.max(1, Math.min(4, rounds));

  if (type === SessionType.ALLEEN_MOBILITEIT) {
    circuit = MOBILITY.slice();
    r = Math.min(3, r);
  } else {
    circuit = (variant === 'B' ? SESSION_B : SESSION_A).map(byId);
    if (type === SessionType.LICHT) circuit = circuit.filter((e) => !e.neckShoulder);
    if (swingsUnlocked && fase >= 2) {
      // Deadlift-slot wordt de swing (max ~20–30% van het circuit).
      circuit = [byId('russian_swing'), ...circuit.slice(1)];
      if (fase >= 3 && circuit.length >= 3) {
        // Fase 3: tweede swing-slot achteraan (~40%).
        circuit = [...circuit.slice(0, circuit.length - 1), byId('single_swing')];
      }
    }
  }

  const out = [];
  if (type !== SessionType.ALLEEN_MOBILITEIT) {
    out.push({ ...withMode(WARMUP), phaseLabel: 'Warming-up' });
  }
  for (let round = 1; round <= r; round++) {
    circuit.forEach((e, i) => {
      out.push({
        ...withMode(e),
        _round: round, _roundsTotal: r,
        _pos: i + 1, _circuitLen: circuit.length,
      });
    });
  }
  if (type !== SessionType.ALLEEN_MOBILITEIT) {
    out.push({ ...withMode(COOLDOWN), phaseLabel: 'Cooling-down' });
  }
  return out;
}

function clone(e) {
  return JSON.parse(JSON.stringify(e));
}
