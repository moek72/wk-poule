---
name: remotion
description: Maak en bewerk de WK Poule "WK Gazette" videos met Remotion (React compositions in remotion-poule/). Gebruik deze skill zodra de gebruiker vraagt om een weekfilm, video, animatie, ranglijst-clip, of iets te renderen/aanpassen in remotion-poule.
---

# Remotion — WK Gazette videopijplijn

De weekvideo's ("WK Gazette") worden gemaakt met **Remotion**: video's als
React-componenten. Alles staat in `remotion-poule/`.

## Projectstructuur

```
remotion-poule/
  src/
    index.ts              # registerRoot — entrypoint, niet aankomen
    Root.tsx              # <Composition> registratie (id, fps, breedte/hoogte, defaultProps)
    WKGazette.tsx         # hoofdcomposition, opgebouwd uit <Sequence> scenes
    components/           # Background, Title, Leaderboard, Avatar, ...
    data/players.ts       # ranglijst-data (per week vervangen)
  remotion.config.ts      # render-config, entrypoint = src/index.ts
  package.json            # scripts: dev, render, still, upgrade
```

Formaat: **1080×1920 (verticaal), 30 fps** — zelfde als de oude films.

## Workflow (zoals in de setup-video)

1. Eenmalig: `cd remotion-poule && npm install`
2. Preview live in de browser: `npm run dev` (opent **Remotion Studio**).
   Studio herlaadt bij elke opslag — bouw en check scenes hier visueel.
3. Renderen naar mp4: `npm run render`
   → schrijft `out/wk-gazette.mp4` (codec h264, 1080×1920).
   Losse frame als PNG: `npm run still`.

## Compositions maken / aanpassen

- Nieuwe scene? Voeg een `<Sequence from={...} durationInFrames={...}>` toe in
  `WKGazette.tsx`. Elke scene is gewoon een React-component.
- Animeer met `useCurrentFrame()` + `interpolate()` / `spring()` uit `remotion`.
  Gebruik **nooit** `Date.now()`, `Math.random()` of CSS-animaties met echte tijd —
  Remotion rendert frame-voor-frame, dus alles moet een functie van `frame` zijn.
- Nieuwe video (los van WK Gazette)? Voeg een extra `<Composition>` toe in
  `Root.tsx` met een eigen `id`; die verschijnt dan vanzelf in Studio.
- Ranglijst-data staat los in `src/data/players.ts` — vervang de `PLAYERS`-array
  per week (of vul later live uit Firebase). Vorm: `{ pos, naam, pt, ex, color, km? }`.
- Assets (foto's, logo's) staan in de repo-root `assets/`. Zet bestanden die je in
  een composition wilt gebruiken in `remotion-poule/public/` en laad ze met
  `staticFile('bestand.png')`.

## Belangrijk

- Frames zijn deterministisch: zelfde `frame` = zelfde beeld. Geen side-effects.
- `durationInFrames` in `Root.tsx` bepaalt de totale lengte; check dat je scenes
  binnen die lengte passen (fps × seconden).
- Emoji/UTF-8 (vlaggen, é in namen) werken direct in JSX-strings.

## Oude pijplijn (fallback)

`render.js` (node-canvas) en `render-html.js` (puppeteer-screenshots van
`wk-gazette-presentatie.html`) blijven bestaan als fallback:
`npm run render:canvas` / `npm run render:html`. Voor nieuw werk: gebruik Remotion.
