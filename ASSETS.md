# ASSETS.md — Familie Club 2000 Assets

## 📂 Folder structuur

```
assets/
├── familie/         # 23 familielid PNG bestanden
├── icons/           # PWA icons (genereer met script hieronder)
└── sounds/          # Optioneel — geen audio files nodig (Web Audio synth)
```

## 👨‍👩‍👧 Familielid foto's

**Totaal: 23 bestanden** in `assets/familie/`

| Naam | Bestand | Tier | 3x Win | 2x Win |
|------|---------|------|--------|--------|
| Moek | `Moek.png` | 💎 Jackpot | +200 | (n.v.t.) |
| Kawita | `Kawita.png` | ⭐ High | +50 | +10 |
| Shreya | `Shreya.png` | ⭐ High | +50 | +10 |
| Geetha | `Geetha.png` | ⭐ High | +50 | +10 |
| Sindy | `Sindy.png` | ⭐ High | +50 | +10 |
| Roy | `Roy.png` | ✨ Mid | +20 | +5 |
| Richella | `Richella.png` | ✨ Mid | +20 | +5 |
| Bella | `Bella.png` | ✨ Mid | +20 | +5 |
| Naleya | `Naleya.png` | ✨ Mid | +20 | +5 |
| Devan | `Devan.png` | ✨ Mid | +20 | +5 |
| Jennifer | `Jennifer.png` | ✨ Mid | +20 | +5 |
| loek | `loek.png` | ✨ Mid | +20 | +5 |
| Amaya | `Amaya.png` | 🎯 Low | +8 | (verplicht) |
| Anisa | `Anisa.png` | 🎯 Low | +8 | (verplicht) |
| Armando | `Armando.png` | 🎯 Low | +8 | (verplicht) |
| Berry | `Berry.png` | 🎯 Low | +8 | (verplicht) |
| Chella | `Chella.png` | 🎯 Low | +8 | (verplicht) |
| Chloé | `Chloé.png` | 🎯 Low | +8 | (verplicht) |
| Daan | `Daan.png` | 🎯 Low | +8 | (verplicht) |
| Ervina | `Ervina.png` | 🎯 Low | +8 | (verplicht) |
| Gaby | `Gaby.png` | 🎯 Low | +8 | (verplicht) |
| Shira | `Shira.png` | 🎯 Low | +8 | (verplicht) |
| Stich | `Stich.png` | 🎯 Low | +8 | (verplicht) |

### Eigenschappen van de foto's
- **Formaat:** PNG met transparante achtergrond
- **Resolutie:** 300x450 px (2:3 aspect ratio)
- **Stijl:** Portretten/headshots in vergelijkbare stijl
- **Gewicht:** ~50-150 KB per stuk
- **Encoding:** UTF-8 voor "Chloé" (let op de é!)

## 🎰 PWA Icons

Genereer iconen vanuit Moek.png (of een eigen logo). Script:

```bash
# Installeer ImageMagick eerst
# Vereiste sizes voor PWA:

# 192x192 (Android)
convert assets/familie/Moek.png -resize 192x192 -background "#1a0000" \
  -gravity center -extent 192x192 assets/icons/icon-192.png

# 512x512 (Android groot)
convert assets/familie/Moek.png -resize 512x512 -background "#1a0000" \
  -gravity center -extent 512x512 assets/icons/icon-512.png

# 180x180 (iOS)
convert assets/familie/Moek.png -resize 180x180 -background "#1a0000" \
  -gravity center -extent 180x180 assets/icons/apple-touch-icon.png

# 32x32 + 16x16 (favicon)
convert assets/familie/Moek.png -resize 32x32 assets/icons/favicon-32.png
convert assets/familie/Moek.png -resize 16x16 assets/icons/favicon-16.png

# Maskable icon (Android adaptive)
convert assets/familie/Moek.png -resize 432x432 \
  -background "#FFD700" -gravity center -extent 512x512 \
  assets/icons/maskable-512.png
```

Of gebruik online: https://maskable.app om een goede maskable icon te maken.

## 🔊 Audio

**Geen audio files nodig.** Alle geluiden worden gegenereerd met de Web Audio API. Zie `src/game/audio.js` voor de synth implementatie.

Optioneel later kunnen echte samples toegevoegd worden in `assets/sounds/`:
- `reel-stop.mp3` — zware metalen klunk
- `jackpot.mp3` — klassieke arcade jingle
- `moek-special.mp3` — opname van Moek's stem die "JACKPOT!" zegt 😄

## 📋 Data files

### `src/data/characters.js`
```javascript
export const CHARACTERS = [
  { name: 'Moek',     image: 'assets/familie/Moek.png',     tier: 'jackpot' },
  { name: 'Kawita',   image: 'assets/familie/Kawita.png',   tier: 'high' },
  { name: 'Shreya',   image: 'assets/familie/Shreya.png',   tier: 'high' },
  { name: 'Geetha',   image: 'assets/familie/Geetha.png',   tier: 'high' },
  { name: 'Sindy',    image: 'assets/familie/Sindy.png',    tier: 'high' },
  { name: 'Roy',      image: 'assets/familie/Roy.png',      tier: 'mid' },
  { name: 'Richella', image: 'assets/familie/Richella.png', tier: 'mid' },
  { name: 'Bella',    image: 'assets/familie/Bella.png',    tier: 'mid' },
  { name: 'Naleya',   image: 'assets/familie/Naleya.png',   tier: 'mid' },
  { name: 'Devan',    image: 'assets/familie/Devan.png',    tier: 'mid' },
  { name: 'Jennifer', image: 'assets/familie/Jennifer.png', tier: 'mid' },
  { name: 'loek',     image: 'assets/familie/loek.png',     tier: 'mid' },
  { name: 'Amaya',    image: 'assets/familie/Amaya.png',    tier: 'low' },
  { name: 'Anisa',    image: 'assets/familie/Anisa.png',    tier: 'low' },
  { name: 'Armando',  image: 'assets/familie/Armando.png',  tier: 'low' },
  { name: 'Berry',    image: 'assets/familie/Berry.png',    tier: 'low' },
  { name: 'Chella',   image: 'assets/familie/Chella.png',   tier: 'low' },
  { name: 'Chloé',    image: 'assets/familie/Chloé.png',    tier: 'low' },
  { name: 'Daan',     image: 'assets/familie/Daan.png',     tier: 'low' },
  { name: 'Ervina',   image: 'assets/familie/Ervina.png',   tier: 'low' },
  { name: 'Gaby',     image: 'assets/familie/Gaby.png',     tier: 'low' },
  { name: 'Shira',    image: 'assets/familie/Shira.png',    tier: 'low' },
  { name: 'Stich',    image: 'assets/familie/Stich.png',    tier: 'low' },
];
```

### `src/data/symbols.js`
```javascript
export const TIERS = {
  jackpot: { 
    label: '💎 JACKPOT', 
    threeOfKind: 200, 
    twoOfKind: null, 
    weight: 1,
    forceJackpotAnim: true
  },
  high:    { 
    label: '⭐ HIGH', 
    threeOfKind: 50,  
    twoOfKind: 10, 
    weight: 4 
  },
  mid:     { 
    label: '✨ MID', 
    threeOfKind: 20,  
    twoOfKind: 5,  
    weight: 7 
  },
  low:     { 
    label: '🎯 LOW', 
    threeOfKind: 8,   
    twoOfKind: null, 
    weight: 11,
    forceGamble: true  // Verplicht gokken bij win
  },
};

// Joker / Criss-Cross — wildcard symbool
export const JOKER = {
  name: 'Joker',
  symbol: '?',
  weight: 5,
  mysteryMin: 8,
  mysteryMax: 200,
};

// Build de pool: gewogen kans per symbool op de rol
export function buildSymbolPool(characters) {
  const pool = [];
  characters.forEach(c => {
    const w = TIERS[c.tier].weight;
    for (let i = 0; i < w; i++) pool.push({ type: 'character', ...c });
  });
  for (let i = 0; i < JOKER.weight; i++) pool.push({ type: 'joker', ...JOKER });
  return pool;
}
```

## 🌍 GitHub upload

```bash
cd familie-club2000
git init
git add .
git commit -m "Initial Familie Club 2000 build"
git branch -M main
git remote add origin git@github.com:moekclaw72/familie-club2000.git
git push -u origin main
```

Daarna in GitHub Settings > Pages → enable Pages from `main` branch, root folder.

URL wordt: `https://moekclaw72.github.io/familie-club2000/`

## ⚠️ Belangrijk

- **Nooit echt geld** koppelen aan dit spel
- Vermeld duidelijk: "FOR FUN ONLY · NO REAL MONEY"
- Niet voor minderjarigen positioneren als gokspel — het is een familiespel, geen casino
