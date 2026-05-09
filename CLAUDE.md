# CLAUDE.md — Instructies voor Claude Code

> **Voor Claude Code:** Dit bestand bevat alle instructies om de Familie Club 2000 PWA te bouwen.
> Lees ook `SPEC.md` (gameplay regels) en `ASSETS.md` (bestanden) voor je begint.

## 🎯 Wat ga je bouwen

Een **Progressive Web App** die de **klassieke Bellfruit Club 2000 gokkast (BFM90 model)** nabootst, met **23 familieleden als symbolen** in plaats van fruit. Moek = Jackpot symbool. **Geen echt geld** — pure familie fun.

De PWA moet:
- ✅ Offline werken (service worker)
- ✅ Installable zijn op iOS/Android
- ✅ Werken op kleine mobiele schermen (360px breed)
- ✅ De echte Club 2000 mechanics correct nabootsen (zie SPEC.md)
- ✅ Performant zijn (60fps animaties)
- ✅ Zonder externe dependencies werken (vanilla JS)

## 🏗️ Bouw volgorde

Bouw in deze volgorde, test elke stap voor je verder gaat:

### Fase 1: Foundation (1-2 uur)
1. `index.html` — basis HTML structuur + meta tags voor PWA
2. `manifest.json` — PWA manifest (naam, icons, theme)
3. `sw.js` — service worker (cache-first strategy)
4. `src/style.css` — base styles, CSS variables voor kleuren
5. `src/data/characters.js` — familielid data array
6. `src/data/symbols.js` — symbool waardes + tier configuratie
7. PWA icons genereren (zie ASSETS.md)

### Fase 2: Layout (2-3 uur)
8. **Bovenpaneel** (`src/ui/upper-panel.js`):
   - Cirkel in midden met "CLUB METER" + 3-cijferig display
   - 9 dots binnen de cirkel (3x3 grid) — feature lights
   - **Linker zijde:** symbolen kolom met "X" = criss-cross prijzen (kris-kras)
   - **Rechter zijde:** symbolen kolom met "X" = criss-cross prijzen
   - **Onder de cirkel:** 2-op-rij prijzentabel ("Symbols on Win Line")
   - **Bovenkant:** 100/40/20 punten indicators rond cirkel
   - Joker (?) symbolen met mystery prijs labels (8-200, 2-100)

9. **Onderpaneel** (`src/ui/reels-ui.js`):
   - 3 rollen naast elkaar
   - Winlijn in midden (horizontale streep door alle 3)
   - HOLD knoppen onder elke rol
   - HEADS / TAILS / CANCEL/COLLECT / TO CLUB METER / START knoppenbalk

10. **Meters** (`src/ui/meters.js`):
    - Credit-meter (links onder)
    - Club-meter (binnen de cirkel)
    - 7-segment LED stijl display

### Fase 3: Game Engine (3-4 uur)
11. `src/game/state.js` — Game state object + getters/setters
12. `src/game/reels.js` — Reel spinning logic met physics-based stop
13. `src/game/engine.js` — Win evaluation:
    - 3-op-rij detection
    - 2-op-rij detection (kris-kras voor speciale symbolen)
    - Joker mystery prijs (random 8-200)
    - Moek jackpot (drie Moeks = +200 + speciale animatie)

### Fase 4: Gamble & Feature (2 uur)
14. `src/game/gamble.js` — Kop/Munt:
    - **Cursor flitst razendsnel** tussen KOP en MUNT lichten (zoals echte machine, ~120ms)
    - Speler drukt STOP-equivalent (HEADS of TAILS knop)
    - 50/50 reveal van de echte uitkomst
    - Bij win: speler kan opnieuw verdubbelen, of TO CLUB METER drukken
    - Max 200 punten in club-meter
    - Verplicht bij prijzen onder de inzet (bv. 2 punten win)

15. `src/game/feature.js` — Bovenspel/Clubspel:
    - Inzet 4 punten per draai
    - Speelt op dezelfde 3 rollen
    - Andere prijzentabel (zie SPEC.md)
    - Familieleden tellen als criss-cross/wild
    - Max 200 in club-meter

### Fase 5: Audio + Animaties (2 uur)
16. `src/game/audio.js` — Web Audio API synth:
    - Reel tick (per voorbij flitsend symbool)
    - Reel stop (zware "klunk")
    - Win jingle (klassiek 4-tonen)
    - Jackpot sequence (8+ tonen)
    - Cursor flits (kort hoog tikje)
    - Lose sad sound

17. Animaties:
    - Lampjes lopen rond cabinet rand
    - Win-lijn glow bij hit
    - Confetti bij jackpot
    - Cabinet trillen bij Moek-jackpot

### Fase 6: PWA polish (1 uur)
18. Service worker offline test
19. "Install app" prompt
20. Splash screen
21. Theme color in manifest
22. Touch interactions (tap, hold, long-press)

### Fase 7: Deploy
23. Push naar GitHub
24. Activate GitHub Pages
25. Test op echte telefoon

## 🎨 Design specs

### Kleurenpalet (CSS variables)
```css
:root {
  --gold: #FFD700;
  --gold-deep: #B8860B;
  --pink: #FF1493;
  --pink-deep: #C71585;
  --cyan: #00FFE5;
  --red-dark: #8B0000;
  --bg-dark: #0a0000;
  --bg-cabinet: linear-gradient(180deg, #1a0000, #000 50%, #0a0000);
  --led-on: #FF4500;
  --led-off: #2a0500;
  --text-display: #FFD700;
}
```

### Typografie
- Titel: `Bungee` (Google Fonts)
- LED displays: `VT323` (Google Fonts) of monospace
- UI: `Audiowide` of `Impact`

### Layout principes
- **Mobile-first** — design voor 360px breed, schaal omhoog
- **Vertical scroll** als nodig — bovenpaneel bovenaan, rollen, knoppen onder
- **Geen externe libraries** — vanilla JS, alle stijlen in CSS
- Cabinet heeft **gele border met flickerende lampjes** (CSS animation)

## 🔧 Technische beslissingen

### Geen build step
Alle JavaScript is vanilla ES modules. Geen webpack/vite nodig. Imports werken native:
```javascript
import { CHARACTERS } from './data/characters.js';
```

### State management
Eén state object in `src/game/state.js`. Geen Redux. Pub/sub patroon voor updates:
```javascript
state.subscribe('credit', (val) => updateMeter(val));
```

### Service worker strategie
**Cache-first** voor alle assets. Update strategie: nieuwe versie? Update bij volgende laad.

### Responsive
CSS Grid + flexbox. Geen media queries onder 768px (alles fluid). Boven 768px max-width 480px container.

## ✅ Definition of Done

- [ ] Werkt op iPhone Safari, Android Chrome
- [ ] Installeerbaar als PWA (Add to Home Screen)
- [ ] Werkt offline na eerste laad
- [ ] Geen console errors
- [ ] Lighthouse PWA score >= 90
- [ ] Alle 23 familieleden zichtbaar in rollen
- [ ] Moek-jackpot voelt speciaal (animatie + geluid)
- [ ] Kop/Munt cursor flitst echt zoals beschreven
- [ ] Hold knoppen werken (symbool blijft staan)
- [ ] Club-meter cap op 200
- [ ] Feature spel werkt (4 punten inzet)
- [ ] Geluiden werken op iOS (na user gesture)

## 📚 Referenties

- **Originele Club 2000 spelbeschrijving:** zie SPEC.md
- **Bellfruit BFM90 cabinet:** Google Images "Club 2000 Bellfruit BFM90"
- **Eurocoin Interactive online versie:** voor visuele inspiratie van het bovenpaneel layout
- **Familielid foto's:** `assets/familie/` — 23 PNG bestanden, 300x450 px

## 🐛 Bekende valkuilen

1. **iOS audio:** Web Audio context moet starten ná user gesture. Init pas bij eerste tap.
2. **Service worker scope:** Als je het op `/familie-club2000/` host (GitHub Pages subpath), zorg dat manifest `start_url` en sw scope kloppen.
3. **Memory:** 23 PNG's à 100KB = 2.3MB. Cache ze ALLE in service worker.
4. **Touch vs click:** Gebruik `touchstart` + `click` beide voor responsiveness, met debounce.
5. **Naam encoding:** "Chloé" met é — UTF-8 in alle bestanden, ook in JS strings.

## 🚀 Verdienmodel hooks

Bouw vanaf het begin in dat dit later customizable wordt:
- Hardcoded familielid data zit in `src/data/characters.js` — los te vervangen
- Branding (titel, kleuren) zit in CSS variables — los te theme-en
- Tier configuratie (welk symbool = jackpot) zit in `src/data/symbols.js`

Later wil je een **builder mode** waar mensen eigen foto's kunnen uploaden en een eigen versie genereren. Houd hier rekening mee in de architectuur.

---

**Vragen?** Lees `SPEC.md` voor exacte gameplay regels. Lees `ASSETS.md` voor wat er in de assets folder zit.
