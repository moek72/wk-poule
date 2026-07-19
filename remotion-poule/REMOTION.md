# Remotion voor de WK Gazette — video review & setup

> Naar aanleiding van de video **"How to setup and use Remotion with Claude Code
> (Super Simple)"** van Sam Cotterill (`youtu.be/l9ybcAeeM2A`). Hieronder: wat de
> video laat zien, hoe het zich verhoudt tot onze pijplijn, en wat er nu gebouwd is.

## Wat de video laat zien

De canonieke manier om met Claude Code video's te maken via **Remotion** (video =
React-componenten):

1. `npx create-video` → kies een **blank** starter, ja tegen Tailwind (optioneel).
2. **Installeer de Remotion Agent Skill** → hierdoor weet Claude Code hoe het
   compositions moet bouwen en renderen. Dit is de belangrijkste stap.
3. `npm run dev` opent **Remotion Studio** in de browser — live preview die
   herlaadt bij elke opslag.
4. Prompt Claude om scenes te bouwen; render met `npm run render` naar mp4.

Kernidee: je beschrijft de video, de agent schrijft de React-code, Studio geeft
directe visuele feedback. Geen frame-voor-frame handwerk meer.

## Hoe stond onze pijplijn ervoor?

`remotion-poule/` had Remotion wél in `package.json` staan, maar:

- **Geen `src/` en geen enkele composition** — `src/` stond zelfs in `.gitignore`,
  dus er was niets om te tracken.
- Het `build`-script wees naar een niet-bestaand `src/index.tsx WKPoule`.
- De echte video's werden gemaakt met **`render.js`** (node-canvas, 1650 frames
  handmatig getekend) en **`render-html.js`** (puppeteer-screenshots van
  `wk-gazette-presentatie.html`). Bruikbaar, maar bewerkelijk en niet agent-vriendelijk —
  precies waar de video vanaf stapt.

## Wat is er nu gebouwd

Een echt Remotion-project, volgens de video, met de bestaande WK Gazette-look
(donkergroene radial achtergrond, gouden gloeiende rand, avatars, medailles):

```
remotion-poule/
  src/
    index.ts              registerRoot (entrypoint)
    Root.tsx              <Composition> WKGazette (1080×1920, 30fps)
    WKGazette.tsx         scenes als <Sequence>: Titel → De Stand
    components/           Background · Title · Leaderboard · Avatar
    data/players.ts       ranglijst-data (per week vervangen)
  remotion.config.ts
  tsconfig.json
  public/                 assets voor staticFile()
```

- De **Remotion Agent Skill** staat in `.agents/skills/remotion/SKILL.md` (naast de
  bestaande higgsfield-skills), zodat elke Claude Code-sessie weet hoe deze
  pijplijn werkt.
- De oude scripts blijven als fallback: `npm run render:canvas` / `npm run render:html`.

Geverifieerd: `npx tsc --noEmit` is schoon, en zowel een still als de volledige
20s-video renderen zonder fouten (Remotion haalt zelf zijn headless Chrome op).

## Gebruik

```bash
cd remotion-poule
npm install
npm run dev      # Remotion Studio — live preview in de browser
npm run render   # → out/wk-gazette.mp4  (1080×1920, h264)
npm run still    # los frame → out/wk-gazette.png
```

Nieuwe scene toevoegen? Zet een `<Sequence>` in `WKGazette.tsx`. Nieuwe video?
Voeg een `<Composition>` toe in `Root.tsx`. Ranglijst updaten? Vervang de
`PLAYERS`-array in `src/data/players.ts` (later evt. live uit Firebase).
