// safety.js — KB30 harde medische regels als CODE (niet als tips).
//
// Dit is de JS-tegenhanger van de Kotlin `nl.kb30.protocol.SafetyGate` op het
// horloge. Beide apparaten delen exact dezelfde logica en teksten, zodat een
// blokkade op de telefoon of het horloge overal hetzelfde betekent.
//
// GEEN ENKELE functie hier laat hartslag de intensiteit of progressie sturen.
// Intensiteit gaat uitsluitend via RPE (0–10) + praattest.

export const CHEST_BLOCK_MS = 48 * 60 * 60 * 1000; // 48 uur

export const BlockReason = Object.freeze({
  GEEN: 'GEEN',
  PIJNSTILLER: 'PIJNSTILLER',
  BORST_48U: 'BORST_48U',
});

export const SessionType = Object.freeze({
  NORMAAL: 'NORMAAL',
  LICHT: 'LICHT',
  ALLEEN_MOBILITEIT: 'ALLEEN_MOBILITEIT',
});

export const PainLocation = Object.freeze({
  NEK: 'NEK', SCHOUDER: 'SCHOUDER', RUG: 'RUG', BORST: 'BORST', ANDERS: 'ANDERS',
});

export const TalkTest = Object.freeze({ JA: 'JA', MOEILIJK: 'MOEILIJK', NEE: 'NEE' });

// De stopcriteria-symptomen. Hartslag staat hier bewust NIET tussen: een
// sensormeting mag nooit op zichzelf een noodgeval of "veilig" verklaren.
export const StopSymptom = Object.freeze({
  BORST_PIJN: 'Pijn of druk op de borst',
  UITSTRALING: 'Uitstraling naar arm, kaak of rug',
  DUIZELIGHEID: 'Duizeligheid',
  KORTADEMIGHEID: 'Abnormale kortademigheid',
  HARTKLOPPINGEN: 'Hartkloppingen',
});

/** epoch-dag (dagen sinds 1970) voor een tijdstip in ms. */
export function epochDay(ms) {
  return Math.floor(ms / 86_400_000);
}

/** Standaard, lege blokkadestatus. */
export function emptyBlock() {
  return {
    chestBlockUntilEpochMs: 0,
    painkillerDay: -1,
    painkillerTaken: false,
    swingsUnlocked: false,
    hrEnabled: false,
    version: 0,
  };
}

/**
 * Beslis of een kettlebell-sessie mag starten.
 * Volgorde: actieve borstblokkade wint, dan een pijnstiller-dag.
 */
export function evaluateStart(block, nowMs, todayEpochDay) {
  if (nowMs < block.chestBlockUntilEpochMs) {
    return {
      kettlebellAllowed: false,
      reason: BlockReason.BORST_48U,
      forcedType: SessionType.ALLEEN_MOBILITEIT,
      messageNl:
        'Na een borstklacht rusten de kettlebells 48 uur. Vandaag alleen ' +
        'rustige mobiliteit. Klachten weg of met de arts besproken? Reset dit ' +
        'bij Instellingen.',
    };
  }
  if (block.painkillerDay === todayEpochDay && block.painkillerTaken) {
    return {
      kettlebellAllowed: false,
      reason: BlockReason.PIJNSTILLER,
      forcedType: SessionType.ALLEEN_MOBILITEIT,
      messageNl:
        'Je gaf aan vandaag pijnstillers te hebben genomen. Die maskeren juist ' +
        'de signalen waar we op letten. Vandaag geen kettlebells — alleen mobiliteit.',
    };
  }
  return { kettlebellAllowed: true, reason: BlockReason.GEEN, forcedType: null, messageNl: '' };
}

/** Borstklacht: stopscherm + 48u-blok. Bumpt version zodat het wint bij sync. */
export function applyChestEvent(block, nowMs) {
  return {
    ...block,
    chestBlockUntilEpochMs: nowMs + CHEST_BLOCK_MS,
    version: block.version + 1,
  };
}

/** RPE 8–10 of praattest "Nee" → stop de set, open herstel-check. */
export function needsRecoveryCheck(rpe, talk) {
  return (rpe != null && rpe >= 8) || talk === TalkTest.NEE;
}

/** Noodgeval: elk stopsymptoom, of pijn op de borst. */
export function isEmergency(symptomKeys, painLocation) {
  return (symptomKeys && symptomKeys.length > 0) || painLocation === PainLocation.BORST;
}

/** Merge twee blokkadestatussen; hoogste version wint (last-writer-wins). */
export function mergeBlock(a, b) {
  return b.version >= a.version ? b : a;
}

/** Normaliseer een (van het horloge ontvangen) object naar een volledige blokkade. */
export function blockFromObj(o) {
  const d = emptyBlock();
  if (!o || typeof o !== 'object') return d;
  return {
    chestBlockUntilEpochMs: Number(o.chestBlockUntilEpochMs) || 0,
    painkillerDay: o.painkillerDay != null ? Number(o.painkillerDay) : -1,
    painkillerTaken: !!o.painkillerTaken,
    swingsUnlocked: !!o.swingsUnlocked,
    hrEnabled: !!o.hrEnabled,
    version: Number(o.version) || 0,
  };
}

export const StopCriteria = Object.freeze({
  titel: 'Stop. Ga zitten.',
  tekst: 'Stop de training. Ga zitten en rust. Houdt de pijn op de borst aan? Bel 112.',
  naMelding:
    'Kettlebells staan nu 48 uur op pauze. Alleen rustige mobiliteit. ' +
    "Reset kan bij Instellingen, na 'klachten weg / met arts besproken'.",
  hartslagDisclaimer: 'Alleen ter informatie. Niet gebruiken als medische beoordeling.',
  geenMeting: 'Geen meting',
});
