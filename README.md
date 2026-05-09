# 🎰 Familie Club 2000 — PWA

Een familie-arcade gokkast in de stijl van de **klassieke Bellfruit Club 2000** uit 1989.
**Geen echt geld** — alleen voor familie plezier. 23 familieleden als symbolen, **Moek = Jackpot**.

## Wat is dit

Een Progressive Web App die werkt als de echte Club 2000 gokkast:
- 3 rollen onderin met winlijn
- Bovenpaneel met prijzentabel rondom de Club Meter cirkel
- 2-op-rij prijzen (criss-cross)
- 3-op-rij grote prijzen
- Joker symbool met mystery prijs (8-200)
- Kop/Munt gamble met flitsende cursor
- Feature spel (clubspel) — 4 punten per draai
- Hold knoppen
- Geluiden en animaties
- Werkt offline (PWA)
- Installable op telefoon

## Snel starten

```bash
# Installeer dependencies (geen, het is vanilla HTML/JS)
# Open index.html in browser, of:
npx serve .

# Of host op GitHub Pages: zie HOSTING.md
```

## Project structuur

```
familie-club2000/
├── index.html              # Hoofdbestand (de PWA shell)
├── manifest.json           # PWA manifest (installable)
├── sw.js                   # Service worker (offline werken)
├── CLAUDE.md               # ⭐ START HIER — instructies voor Claude Code
├── SPEC.md                 # Technische spec van het spel
├── ASSETS.md               # Asset documentatie
├── HOSTING.md              # Hoe op GitHub Pages te zetten
├── README.md               # Dit bestand
├── assets/
│   ├── familie/            # Familielid foto's (PNG, 300x450)
│   ├── icons/              # PWA icons (genereer met script)
│   └── sounds/             # Optioneel — geluidseffecten
├── src/
│   ├── style.css           # Alle styling
│   ├── data/
│   │   ├── symbols.js      # Symbool definities + waardes
│   │   └── characters.js   # Familielid data
│   ├── game/
│   │   ├── engine.js       # Core game logic
│   │   ├── reels.js        # Rol animaties
│   │   ├── gamble.js       # Kop/Munt logic
│   │   ├── feature.js      # Bovenspel logic
│   │   ├── audio.js        # Web Audio synth
│   │   └── state.js        # Game state management
│   └── ui/
│       ├── meters.js       # Credit/Club meter UI
│       ├── upper-panel.js  # Bovenpaneel met cirkel
│       ├── reels-ui.js     # Onderpaneel rollen UI
│       └── controls.js     # Knoppen UI
└── tests/                  # Optionele tests
```

## Voor Claude Code

**Lees eerst `CLAUDE.md`** — daar staat exact wat je moet bouwen, in welke volgorde, en hoe je het moet testen.

## Verdienmodel ideeën (toekomst)

Dit format is verkoopbaar als concept:
- 🍻 **Horeca version** — Cafés/eetcafés vervangen familie door eigen team/menu items. Setup €99 + €19/maand.
- 🎉 **Bedrijfsfeestje variant** — Bedrijf upload eigen team, gokkast voor borrels. Eenmalig €149.
- 👨‍👩‍👧 **DIY family kit** — Mensen uploaden eigen foto's, krijgen eigen Club 2000 link. €9 eenmalig of freemium met Pro features.
