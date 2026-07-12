// exercises.js — de KB30-oefenbibliotheek. Alle oefeningen zijn STAAND, geen
// diepe squats, geen diep vooroverbuigen, geen belasting boven het hoofd, max
// 8 kg. Verboden oefeningen bestaan hier simpelweg niet.
//
// Elke oefening: id, naam, spiergroepen, moeilijkheid, stappen (B1), Moek-
// waarschuwing, standaard werk/rust, illustratie-key, en flags.

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
    waarschuwing: 'Fase 3, optioneel. Alleen als de two-hand swing pijnvrij is.',
  },
];

const MOBILITY = [
  { id: 'mob_march', naam: 'Marcheren op de plaats', gewichtKg: 0, workSec: 40, restSec: 20, illu: 'march', cue1: 'Rustig tempo', cue2: 'Adem door', spieren: ['benen'], stappen: ['Marcheer rustig op de plaats.', 'Adem rustig door.'], waarschuwing: 'Rustig aan.' },
  { id: 'mob_shoulder', naam: 'Schouderrolletjes', gewichtKg: 0, workSec: 30, restSec: 15, illu: 'generic', cue1: 'Klein rondje', cue2: 'Ontspannen', spieren: ['schouders'], stappen: ['Rol je schouders rustig naar achteren.'], waarschuwing: 'Ontspannen bewegen.' },
  { id: 'mob_hip', naam: 'Heupcirkels', gewichtKg: 0, workSec: 30, restSec: 15, illu: 'generic', cue1: 'Kleine cirkel', cue2: 'Rug neutraal', spieren: ['heupen'], stappen: ['Handen op je heupen, maak rustige cirkels.'], waarschuwing: 'Kleine, rustige cirkels.' },
  { id: 'mob_counter', naam: 'Rugmobilisatie (aanrecht)', gewichtKg: 0, workSec: 30, restSec: 15, illu: 'generic', cue1: 'Handen op aanrecht', cue2: 'Lichte hoek', spieren: ['rug'], stappen: ['Handen op het aanrecht, lichte hoek, rug lang maken.'], waarschuwing: 'Onbelast, lichte hoek.' },
  { id: 'mob_suitcase', naam: 'Lichte Suitcase Carry', gewichtKg: 4, workSec: 30, restSec: 20, illu: 'carry', cue1: '4 kg', cue2: 'Rechtop', spieren: ['core'], stappen: ['Eén lichte bel, loop rechtop.'], waarschuwing: 'Licht gewicht, rechtop.' },
];

export const WARMUP = {
  id: 'warmup', naam: 'Warming-up', gewichtKg: 0, workSec: 300, restSec: 0, illu: 'march',
  cue1: 'Marcheren + armcirkels', cue2: 'Losmaken', spieren: ['algemeen'],
  stappen: ['Marcheer op de plaats.', 'Armcirkels en schouderrolletjes.', 'Heupscharnier zonder gewicht.'],
  waarschuwing: 'Niet stiekem overslaan — dit beschermt je rug.',
};
export const COOLDOWN = {
  id: 'cooldown', naam: 'Cooling-down', gewichtKg: 0, workSec: 300, restSec: 0, illu: 'march',
  cue1: 'Rustig marcheren', cue2: 'Staande stretches', spieren: ['algemeen'],
  stappen: ['Rustig marcheren.', 'Staande stretches, rustig ademen.'],
  waarschuwing: 'Rustig uitlopen.',
};

export function byId(id) {
  return EXERCISES.find((e) => e.id === id) || null;
}

// Fase-1 basiscircuit (5 oefeningen).
const PHASE1 = ['kb_deadlift', 'box_squat', 'farmer_carry', 'goblet_march', 'wood_chop'];

/**
 * Bouw de geordende oefeninglijst voor een sessie.
 * @param {string} type NORMAAL / LICHT / ALLEEN_MOBILITEIT
 * @param {boolean} swingsUnlocked
 * @param {number} rounds fase-1 standaard 3
 */
export function buildSession(type, swingsUnlocked, rounds = 3) {
  if (type === SessionType.ALLEEN_MOBILITEIT) {
    return [MOBILITY[0], MOBILITY[1], MOBILITY[2], MOBILITY[4], MOBILITY[0]].map(clone);
  }
  let circuit = PHASE1.map(byId);
  if (type === SessionType.LICHT) circuit = circuit.filter((e) => !e.neckShoulder);
  if (swingsUnlocked) circuit = [byId('russian_swing'), ...circuit.slice(1)];

  const out = [clone(WARMUP)];
  const r = Math.max(1, Math.min(4, rounds));
  for (let i = 0; i < r; i++) out.push(...circuit.map(clone));
  out.push(clone(COOLDOWN));
  return out;
}

function clone(e) {
  return JSON.parse(JSON.stringify(e));
}
