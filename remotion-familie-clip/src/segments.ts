// Trailer-montage: snelle knip-en-plak edit die tussen de clips heen en weer
// springt om de indruk te geven van één doorgaande nacht zonder einde.
// Elk segment pakt een ander moment uit een clip (trimBefore) met een korte duur.
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Zachte filmische cut tussen shots (cross-dissolve van een paar frames).
export const TRANSITION_FRAMES = 4;

const s = (sec: number) => Math.round(sec * FPS);

export type Item =
  | {
      kind: "shot";
      src: string;
      trimBefore: number; // frames
      durationInFrames: number;
      zoomDir: 1 | -1;
      fadeInFromBlack?: boolean;
      fadeOutToBlack?: boolean;
    }
  | { kind: "black"; durationInFrames: number };

// [clipnummer, start (sec), duur (sec)]
type Cut = [number, number, number];

// ── Akte 1: opbouw, iets rustiger cuts ─────────────────────────────
const act1: Cut[] = [
  [1, 6.0, 2.2],
  [5, 0.6, 2.0],
  [6, 1.5, 1.8],
  [2, 0.4, 1.6],
  [7, 0.8, 1.8],
];
// ── Akte 2: het feest bouwt op, sneller ────────────────────────────
const act2: Cut[] = [
  [1, 16.0, 1.4],
  [3, 1.2, 1.4],
  [4, 0.3, 1.3],
  [5, 3.0, 1.3],
  [6, 4.0, 1.3],
  [1, 26.0, 1.2],
  [7, 2.8, 1.3],
  [2, 2.0, 1.2],
  [3, 3.5, 1.2],
  [5, 5.5, 1.2],
];
// ── Akte 3: piek, flitsende cuts ───────────────────────────────────
const act3: Cut[] = [
  [1, 34.0, 1.0],
  [6, 6.2, 1.0],
  [4, 1.6, 1.0],
  [7, 4.5, 1.0],
  [3, 6.0, 1.0],
  [1, 40.0, 0.9],
  [5, 6.8, 1.0],
  [2, 3.0, 0.9],
  [6, 7.4, 1.0],
  [1, 46.0, 0.9],
];
// ── Akte 4: het gaat door... terug naar eerder, dan fade to black ──
const act4: Cut[] = [
  [7, 5.6, 1.4],
  [1, 12.0, 1.6],
  [6, 2.5, 1.8],
  [1, 50.0, 2.4],
];

function cutsToShots(cuts: Cut[], startIndex: number): Item[] {
  return cuts.map((c, i) => ({
    kind: "shot" as const,
    src: `videos/clip${c[0]}.mp4`,
    trimBefore: s(c[1]),
    durationInFrames: s(c[2]),
    zoomDir: ((startIndex + i) % 2 === 0 ? 1 : -1) as 1 | -1,
  }));
}

const blackDip = (sec: number): Item => ({
  kind: "black",
  durationInFrames: s(sec),
});

// Bouw de tijdlijn met dip-to-black adempauzes op de akte-grenzen.
export const TIMELINE: Item[] = [
  ...cutsToShots(act1, 0),
  blackDip(0.33),
  ...cutsToShots(act2, act1.length),
  blackDip(0.33),
  ...cutsToShots(act3, act1.length + act2.length),
  blackDip(0.4),
  ...cutsToShots(act4, act1.length + act2.length + act3.length),
];

// Markeer eerste shot (fade-in uit zwart) en laatste shot (fade-out naar zwart).
const firstShot = TIMELINE.find((it) => it.kind === "shot");
if (firstShot && firstShot.kind === "shot") firstShot.fadeInFromBlack = true;
for (let i = TIMELINE.length - 1; i >= 0; i--) {
  const it = TIMELINE[i];
  if (it.kind === "shot") {
    it.fadeOutToBlack = true;
    break;
  }
}

export const TOTAL_FRAMES =
  TIMELINE.reduce((sum, it) => sum + it.durationInFrames, 0) -
  (TIMELINE.length - 1) * TRANSITION_FRAMES;
