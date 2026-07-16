// Clip configuratie voor de WK Poule familie-montage.
// Alle waardes in frames bij 30fps. `trimBefore` = startoffset in de bron.
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export type ClipConfig = {
  src: string;
  durationInFrames: number;
  trimBefore?: number;
  label: string;
};

export const CLIPS: ClipConfig[] = [
  { src: "videos/clip1.mp4", durationInFrames: 8 * FPS, trimBefore: 10 * FPS, label: "De aftrap" },
  { src: "videos/clip2.mp4", durationInFrames: Math.round(4.4 * FPS), label: "Op scherp" },
  { src: "videos/clip3.mp4", durationInFrames: 7 * FPS, trimBefore: 15, label: "Vol gas" },
  { src: "videos/clip4.mp4", durationInFrames: Math.round(3.7 * FPS), label: "Kort en fel" },
  { src: "videos/clip5.mp4", durationInFrames: 7 * FPS, label: "Middenveld" },
  { src: "videos/clip6.mp4", durationInFrames: 7 * FPS, label: "De counter" },
  { src: "videos/clip7.mp4", durationInFrames: 7 * FPS, label: "Slotoffensief" },
];

export const INTRO_FRAMES = Math.round(2.6 * FPS);
export const OUTRO_FRAMES = 3 * FPS;
export const TRANSITION_FRAMES = 16;

// Totaal = alle sequences samen minus de overlap van elke transitie.
export const TOTAL_SEQUENCES = CLIPS.length + 2; // intro + clips + outro
export const NUM_TRANSITIONS = TOTAL_SEQUENCES - 1;
export const TOTAL_FRAMES =
  INTRO_FRAMES +
  OUTRO_FRAMES +
  CLIPS.reduce((sum, c) => sum + c.durationInFrames, 0) -
  NUM_TRANSITIONS * TRANSITION_FRAMES;
