// coach.js — de stem en persoonlijkheid van KB30.
//
// Eén module voor alles wat de coach zegt: op het scherm (korte, warme zinnen
// op B1-niveau) én hardop via de Web Speech API (speechSynthesis, nl-NL,
// bij voorkeur een vrouwelijke Nederlandse stem).
//
// Belangrijk: alles hier is optioneel en faalt stil. Zonder stemmen (headless,
// oude browser) werkt de hele app gewoon — de coach schrijft dan alleen.
// Geen externe AI, geen netwerk: alleen de ingebouwde browser-spraak.

import { Store } from './store.js';

// --- namen ------------------------------------------------------------------

export const COACH_NAMEN = ['Sanne', 'Lisa', 'Emma'];

function userName() { return (Store.profile.naam || 'Moek').trim() || 'Moek'; }
function coachName() { return (Store.profile.coachNaam || 'Sanne').trim() || 'Sanne'; }

// --- spraak (speechSynthesis) ------------------------------------------------

let _voices = [];
let _synth = null;

function synth() {
  if (_synth) return _synth;
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      _synth = window.speechSynthesis;
    }
  } catch { _synth = null; }
  return _synth;
}

function refreshVoices() {
  const s = synth();
  if (!s) { _voices = []; return; }
  try { _voices = s.getVoices() || []; } catch { _voices = []; }
}

/** Init: stemmen laden (komen soms pas later binnen). Veilig zonder support. */
function init() {
  const s = synth();
  if (!s) return;
  refreshVoices();
  try { s.onvoiceschanged = () => refreshVoices(); } catch { /* ok */ }
}

/** Alle Nederlandse stemmen (voor de kiezer in Instellingen). */
function dutchVoices() {
  refreshVoices();
  return _voices.filter((v) => /^nl([-_]|$)/i.test(v.lang || ''));
}

// Namen die op een vrouwelijke stem wijzen (per platform verschillend).
const FEMALE_HINT = /fenna|lotte|claire|ellen|saskia|laura|xenia|colette|ilse|mirjam|female|vrouw|f\b/i;

/** Kies de beste stem: ingesteld > vrouwelijk nl > nl > (browser-default). */
function pickVoice() {
  const nl = dutchVoices();
  const wanted = Store.settings.coachVoiceURI;
  if (wanted) {
    const hit = _voices.find((v) => v.voiceURI === wanted);
    if (hit) return hit;
  }
  return nl.find((v) => FEMALE_HINT.test(v.name || '')) || nl[0] || null;
}

/**
 * Spreek een zin uit. No-op als stem uitstaat of TTS ontbreekt.
 * @param {string} text
 * @param {{interrupt?:boolean, rate?:number}} opts
 */
function speak(text, opts = {}) {
  if (!text || !Store.settings.stem) return;
  const s = synth();
  if (!s) return;
  try {
    if (opts.interrupt !== false) s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'nl-NL';
    u.rate = opts.rate || 1.0;
    u.pitch = 1.05;
    const v = pickVoice();
    if (v) u.voice = v;
    s.speak(u);
  } catch { /* stil falen — knoppen werken altijd */ }
}

/** Stop lopende spraak (bij schermwissel, zodat zinnen niet stapelen). */
function stopSpeech() {
  const s = synth();
  if (!s) return;
  try { s.cancel(); } catch { /* ok */ }
}

// --- tekst-hulpjes ------------------------------------------------------------

function pick(pool, seed) {
  if (!pool.length) return '';
  const i = seed != null ? Math.abs(seed) % pool.length : Math.floor(Math.random() * pool.length);
  return pool[i];
}

function daySeed() {
  const d = new Date();
  return d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate();
}

// --- zinnen: dashboard ---------------------------------------------------------

function greeting(hour = new Date().getHours()) {
  if (hour < 6) return 'Goedenacht';
  if (hour < 12) return 'Goedemorgen';
  if (hour < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

function dashLine(plan) {
  const naam = userName();
  if (plan.kind === 'RUST') {
    return pick([
      `Vandaag rust, ${naam}. Rust is óók training — een wandeling telt.`,
      `Rustdag, ${naam}. Lekker herstellen. Morgen sta ik weer voor je klaar.`,
      `Neem het rustig vandaag, ${naam}. Een blokje om is genoeg.`,
    ], daySeed());
  }
  if (plan.kind === 'MOBILITEIT') {
    return pick([
      `Vandaag maken we alles soepel, ${naam}. Rustig bewegen, niets forceren.`,
      `Hersteldag, ${naam}. Twintig minuten soepel bewegen — je lijf wordt er blij van.`,
      `Rustig aan vandaag, ${naam}. Mobiliteit houdt je lekker in beweging.`,
    ], daySeed());
  }
  const focus = plan.variant === 'A' ? 'benen en core' : 'houding en schouders';
  return pick([
    `Vandaag sessie ${plan.variant}, ${naam}: ${focus}. Rustig tempo — techniek eerst.`,
    `Sessie ${plan.variant} staat klaar, ${naam}. Een half uurtje, en ik praat je erdoorheen.`,
    `Klaar voor sessie ${plan.variant}, ${naam}? We doen het samen, stap voor stap.`,
  ], daySeed());
}

// --- zinnen: training -----------------------------------------------------------

function sessionStartText(plan, type) {
  const naam = userName();
  if (type === 'ALLEEN_MOBILITEIT') {
    return `Hoi ${naam}. Vandaag rustige mobiliteit. Niets moet, alles mag zacht. We beginnen zo.`;
  }
  const label = plan && plan.variant ? `sessie ${plan.variant}` : 'je kettlebell-circuit';
  return `Hoi ${naam}, vandaag ${label}. We beginnen rustig met de warming-up. Ik tel voor je af.`;
}

function targetText(ex) {
  if (ex.mode === 'reps') return `${ex.reps} keer, op je eigen tempo.`;
  if (ex.mode === 'swings') return 'Tik elke swing op het scherm, dan tel ik mee.';
  const sec = ex.workSec || 40;
  return sec >= 120 ? `${Math.round(sec / 60)} minuten.` : `${sec} seconden.`;
}

function exerciseIntroText(ex) {
  const parts = [ex.naam + '.'];
  if (ex._round === 1 || !ex._round) {
    const eerste = (ex.stappen && ex.stappen[0]) || '';
    if (eerste) parts.push(eerste);
  }
  if (ex.cue1) parts.push(ex.cue1 + '.');
  parts.push(targetText(ex));
  return parts.join(' ');
}

const ENCOURAGE = [
  'Goed bezig, houd dit tempo vast.',
  'Mooi zo. Blijf rustig ademen.',
  'Prima ritme. Techniek boven snelheid.',
  'Je doet het netjes. Nog even volhouden.',
  'Sterk hoor. Schouders laag, adem door.',
];
function encourageText(i = 0) { return pick(ENCOURAGE, i); }

const REST_TIPS = [
  'Adem rustig door je neus in en door je mond uit.',
  'Schud je armen en schouders even los.',
  'Neem een slokje water als je dat wilt.',
  'Kun je nog rustig praten? Dan zit je goed.',
  'Sta even lekker rechtop en ontspan je nek.',
  'Niets forceren vandaag. Rustig is precies goed.',
];
function restTip(i = 0) { return pick(REST_TIPS, i); }

function restText(nextEx, i = 0) {
  const straks = nextEx ? ` Straks: ${nextEx.naam}.` : ' Dit was de laatste — bijna klaar!';
  return pick([
    `Mooi gedaan. Even rusten.${straks}`,
    `Goed zo. Adem rustig door.${straks}`,
    `Netjes! Neem je rust.${straks}`,
  ], i);
}

// --- zinnen: samenvatting ---------------------------------------------------------

function summaryPraise(summary) {
  const naam = userName();
  const min = Math.max(1, Math.round((summary.durationSec || 0) / 60));
  return pick([
    `Klaar! Goed gedaan, ${naam}. ${min} minuten bewogen — daar word je sterker van.`,
    `Dat zit erop, ${naam}. ${min} minuten — netjes gedaan.`,
    `Trots op je, ${naam}. Weer een sessie in de pocket.`,
  ], daySeed());
}

function summaryTip(summary) {
  if ((summary.painReports || []).length) {
    return 'Je gaf pijn aan — goed dat je het meldde. Volgende keer pakken we het ietsje lichter.';
  }
  if (summary.totalSwings > 0) {
    return `${summary.totalSwings} swings geteld. Volgende keer: zelfde rust, zelfde techniek.`;
  }
  return 'Tip voor de volgende keer: begin weer rustig en let op je ademhaling.';
}

function recoveryText() {
  return `Even gas terug, ${userName()}. Rust rustig uit. We gaan pas door als het weer goed voelt.`;
}

// --- publieke API -------------------------------------------------------------

export const Coach = {
  init,
  speak,
  stopSpeech,
  dutchVoices,
  pickVoice,
  get available() { return !!synth(); },

  userName,
  coachName,
  greeting,
  dashLine,
  restTip,
  encourageText,

  // Gesproken momenten (allemaal veilig zonder TTS):
  sayWelcomeOnboarding() {
    speak(`Hoi! Ik ben ${coachName()}, jouw kettlebell-coach. Ik leg je rustig uit hoe alles werkt.`);
  },
  saySessionStart(plan, type) { speak(sessionStartText(plan, type)); },
  sayExerciseIntro(ex) { speak(exerciseIntroText(ex)); },
  sayEncourage(i) { speak(encourageText(i), { interrupt: false }); },
  sayRest(nextEx, i) { speak(restText(nextEx, i)); },
  sayCount(n) { speak(String(n)); },
  saySummary(summary) { speak(`${summaryPraise(summary)} ${summaryTip(summary)}`); },
  sayRecovery() { speak(recoveryText()); },
  sayTest() {
    speak(`Hoi ${userName()}, ik ben ${coachName()}. Zo klink ik. Zullen we straks samen trainen?`);
  },

  // Tekst voor op het scherm:
  sessionStartText,
  exerciseIntroText,
  restText,
  summaryPraise,
  summaryTip,
};

init();
