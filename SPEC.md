# SPEC.md — Familie Club 2000 Gameplay Specificatie

> Gebaseerd op de echte **Bellfruit Club 2000** (BFM90 model, 1989), met familieleden in plaats van fruit.

## 1. Game Modi

### A. Basisspel
- **Inzet:** 1 credit per draai
- **Rollen:** 3 standaard rollen
- **Winlijn:** 1 horizontale lijn in het midden
- **Symbolen:** familieleden + Joker (Criss-Cross / "?")
- **Wins:**
  - **3 op rij** = grote prijs (zie tabel)
  - **2 op rij** voor speciale symbolen = kleine prijs (criss-cross)
  - **Joker (?)** = mystery prijs, random tussen 8-200 punten
  - **3x Moek** = JACKPOT (+200, max club-meter)

### B. Feature-Spel (Clubspel)
- **Inzet:** 4 punten per draai (uit club-meter)
- **Rollen:** dezelfde 3 rollen
- **Verschil:**
  - **Lage tier familieleden tellen als CRISS-CROSS (wild)**
  - Andere prijzentabel — alleen hoge tier symbolen geven prijs
  - Geen "hold" optie
  - Max 200 in club-meter

## 2. Symbolen & Tiers

### 23 Familieleden, ingedeeld in tiers

**Jackpot tier (1 lid, 1% kans):**
- 💎 **Moek** — 3x op rij = +200 (JACKPOT)

**High tier (4 leden, ~5% kans elk):**
- ⭐ **Kawita** — 3x = +50, 2x = +10
- ⭐ **Shreya** — 3x = +50, 2x = +10
- ⭐ **Geetha** — 3x = +50, 2x = +10
- ⭐ **Sindy** — 3x = +50, 2x = +10

**Mid tier (7 leden, ~7% kans elk):**
- ✨ **Roy** — 3x = +20, 2x = +5
- ✨ **Richella** — 3x = +20, 2x = +5
- ✨ **Bella** — 3x = +20, 2x = +5
- ✨ **Naleya** — 3x = +20, 2x = +5
- ✨ **Devan** — 3x = +20, 2x = +5
- ✨ **Jennifer** — 3x = +20, 2x = +5
- ✨ **loek** — 3x = +20, 2x = +5

**Low tier (10 leden, ~9% kans elk):**
- 🎯 **Amaya, Anisa, Armando, Berry, Chella, Chloé, Daan, Ervina, Gaby, Shira, Stich** — 3x = +8 (verplicht gokken!)

**Joker tier (1 symbool, ~10% kans):**
- ❓ **Criss-Cross / "?"** — kris-kras prijs, random tussen 8-200

> **Note:** "Stich" is een typfout voor "Stitch" maar zo staan de bestandsnamen in Moek's collectie.

## 3. Win Detectie

### Algoritme volgorde
```
voor elke spin met symbolen [a, b, c]:
  
  1. JACKPOT check: a == b == c == Moek?
     → +200 punten, jackpot animatie, geen gamble
  
  2. JOKER mystery: bevat de winlijn een Joker?
     → mystery prijs random(8, 200)
     → wel gamble mogelijk
  
  3. 3 op rij check: a == b == c?
     → 3x prijs uit tier tabel
     → optioneel gokken
  
  4. 2 op rij check (alleen high/mid tier):
     → 2x prijs uit tier tabel
     → verplicht gokken (kleine prijs)
  
  5. Geen win:
     → "Helaas" status, geen prijs
```

### Verplicht gokken
- Alle prijzen **< 4 punten** moeten verplicht gegokt worden via kop/munt
- Reden: clubspel kost 4 punten inzet, dus minimaal 4 punten naar club-meter
- **Joker mystery + low tier 2-op-rij** vallen onder verplicht gokken

## 4. Kop/Munt Gamble (CRUCIAAL — werk dit goed uit)

### Hoe het werkt (zoals echte gokkast)
1. **Cursor lichtje** flitst razendsnel tussen "KOP" en "MUNT" indicators
2. Speed: ongeveer **120ms per swap** (heel snel, ziet er bijna onleesbaar uit)
3. Speler drukt **HEADS** of **TAILS** knop:
   - Zodra knop gedrukt → cursor stopt op de knop die gedrukt is
   - Daarna wordt de **echte muntworp** onthuld (50/50 random)
4. Bij **win:**
   - Punten verdubbelen
   - Speler kan opnieuw gokken OF "TO CLUB METER" drukken
   - Max 200 → automatisch naar club-meter
5. Bij **verlies:**
   - Alle pending punten weg
   - Status: "Helaas"
6. Bij **verplicht gokken:**
   - Geen "TO CLUB METER" knop zichtbaar
   - Speler MOET kiezen

### Visuele weergave
```
┌─────────────────────────────────┐
│  KOP OF MUNT — VERDUBBEL!       │
│                                 │
│  [HEADS]  ●═══●  [TAILS]        │  ← cursor flitst
│   👑      lights    ⚪          │
│                                 │
│  Pending: 50 punten             │
│                                 │
│  [TO CLUB METER]  [HEADS] [TAILS]│
└─────────────────────────────────┘
```

## 5. Hold Functie

- 3 HOLD knoppen onder de rollen
- Speler drukt HOLD na een spin → die rol behoudt zijn symbool bij volgende spin
- Hold wordt **automatisch geactiveerd** na een win (machine "tipt" speler)
- Na elke spin worden holds gereset (tenzij win → optioneel gehouden)
- **Niet beschikbaar in Feature spel**

## 6. Cabinet Layout

### Mobiel (verticaal, 360-480px breed)

```
┌──────────────────────────────────┐
│  ★ FAMILIE CLUB 2000 ★            │  ← marquee header
├──────────────────────────────────┤
│                                  │
│   BOVENPANEEL                    │
│   ┌─────────────────────────┐   │
│   │ ⭐X 100   100  X⭐         │   │  ← criss-cross symbolen
│   │ ⭐X     ┌───┐    X⭐       │   │
│   │ ✨X 40 │ ●●●│ 40 X✨      │   │  ← Club Meter cirkel
│   │ ✨X    │ ●●●│    X✨      │   │     met 9 lights
│   │ ✨X 20 │ ●●●│ 20 X✨      │   │
│   │  ?  ┌──┴───┴──┐  ?        │   │
│   │     │   128   │            │   │  ← LED display
│   │     └─────────┘            │   │
│   │  Max 200 Punten            │   │
│   │                            │   │
│   │ [2-op-rij prijzen tabel]   │   │
│   └────────────────────────────┘   │
│                                  │
│   ONDERPANEEL                    │
│   ┌─────────────────────────┐   │
│   │ ┌────┐ ┌────┐ ┌────┐    │   │
│   │ │Moek│ │Roy │ │Bella│   │   │  ← 3 rollen
│   │ │═══ │ │═══ │ │═══ │   │   │  ← winlijn
│   │ │Roy │ │Bella│ │Moek│   │   │
│   │ └────┘ └────┘ └────┘    │   │
│   │ [HOLD] [HOLD] [HOLD]    │   │
│   └─────────────────────────┘   │
│                                  │
│   STATUS DISPLAY                 │
│   "★ DRUK OP DRAAI ★"            │
│                                  │
│   KNOPPEN:                       │
│   [HEADS] [TAILS] [CANCEL/COLLECT]│
│   [TO CLUB METER]  [START]       │
│                                  │
│   Credit: 10        Club: 0      │
└──────────────────────────────────┘
```

## 7. Game Flow Diagrammen

### Hoofdflow
```
START
  ↓
[Player heeft credits?] —no→ [Insert coin] (in dev: button "+€5")
  ↓ yes
[Press DRAAI] → -1 credit
  ↓
[Reels spinning...]
  ↓
[Reels stop, evaluate win]
  ↓
[Win detected?] —no→ [Status: "Helaas"] → loop
  ↓ yes
[Auto-hold winning symbols]
[Show pending win]
  ↓
[Verplicht gokken?] —yes→ [Force gamble flow]
  ↓ no
[Player chooses:]
  - GAMBLE → kop/munt flow
  - TO CLUB METER → punten naar club-meter
  - START → nieuwe spin (verlies pending)
```

### Gamble flow
```
[Pending win = X punten]
  ↓
[Cursor flitst KOP ↔ MUNT (120ms)]
  ↓
[Player drukt HEADS of TAILS]
  ↓
[Cursor stopt op gekozen kant]
  ↓
[Reveal coin: random 50/50]
  ↓
[Match?] —no→ [Pending lost, status "Helaas"] → loop
  ↓ yes
[Pending = X * 2]
  ↓
[Pending >= 200?] —yes→ [Force club-meter]
  ↓ no
[Player chooses gamble again or collect]
```

### Feature spel flow
```
[Club-meter >= 4 punten?]
  ↓ yes
[Player drukt CLUB SPEL knop]
  ↓
[-4 punten van club-meter]
  ↓
[Reels spinning... (low tier = wild!)]
  ↓
[Evaluate met aangepaste regels]
  ↓
[Win → club-meter (max 200)]
[Geen win → status "geen feature win"]
  ↓
[Player kan opnieuw of stop]
```

## 8. Audio Specs

### Synth tones (Web Audio API, geen audio files)

| Event | Frequencies | Duration | Wave |
|-------|-------------|----------|------|
| Reel tick | 150-250Hz random | 20ms | square |
| Reel stop | 400Hz | 100ms | square |
| Cursor flit | 700-900Hz random | 15ms | square |
| Win jingle | 523, 659, 784, 1046 | 180ms each | square |
| Jackpot | 8 stijgende tonen + 5 dalende | 130ms each | square+sawtooth |
| Lose | 220Hz → 165Hz | 200ms | sawtooth |
| Coin insert | 800Hz | 40ms | square |

## 9. Edge Cases

- **Speler heeft 0 credits:** START knop disabled, status "Insert coins"
- **Club-meter al 200:** kleine wins gaan direct naar credits, geen gamble
- **Gamble win zou over 200 brengen:** automatisch capped op 200, ga naar club-meter
- **Speler drukt START tijdens gamble:** popup "Pending win wordt verloren, doorgaan?"
- **Speler refresht pagina:** state reset (geen save in v1)
- **Visibility change (telefoon lock):** reels animeren rustig door, audio pauzeert

## 10. Versies

### v1.0 — MVP (deze build)
- Basisspel met 3-op-rij + 2-op-rij + Joker mystery
- Kop/Munt gamble met cursor
- Feature spel
- Hold knoppen
- 23 familieleden + Moek jackpot
- PWA installable, offline werkend

### v1.1 — Polish (later)
- Save state in localStorage
- Statistics: meeste wins, jackpots, langste streak
- Achievements: "10 jackpots", "Win 1000 punten", etc.

### v2.0 — Builder Mode (verdienmodel)
- User uploads eigen foto's
- Configureerbare titel + kleuren
- Genereert eigen Club 2000 link
- Pro features: custom geluiden, meer rollen, etc.

---

**Klaar om te bouwen!** Begin bij Fase 1 in `CLAUDE.md`.
