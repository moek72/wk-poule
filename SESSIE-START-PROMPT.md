# Sessie-startprompt voor WK Poule

## Waar zijn de bestanden te vinden?

| Bestand | Locatie | Waarvoor |
|---------|---------|----------|
| `WKPOULE.md` | repo root → `moek72/familie-club2000-codex-deluxe/WKPOULE.md` (branch: claude/nieuwsbrief) | Volledige project-context, Firebase structuur, puntensysteem |
| `SESSIE-START-PROMPT.md` | repo root → `moek72/familie-club2000-codex-deluxe/SESSIE-START-PROMPT.md` (branch: claude/nieuwsbrief) | Dit bestand — kopieer de prompt hieronder |
| `wkpoule.html` | repo root | De volledige app (single file, alles erin) |
| `wk-gazette-presentatie.html` | repo root | HTML nieuwsbrief slideshow (13 slides) |
| `backups/` | repo root | Dagelijkse Firebase backups als JSON |
| `remotion-poule/` | repo root | Video-generator (puppeteer + ffmpeg) |
| `remotion-poule/render-html.js` | — | HTML → MP4 via puppeteer |
| `remotion-poule/bgm.wav` | — | Gegenereerde achtergrondmuziek (55s) |
| `assets/shirts/` | repo root | 20 voetbalshirt PNG's per deelnemer (nog aan te maken) |

**GitHub URL naar deze bestanden:**
`https://github.com/moek72/wk-poule/blob/claude/nieuwsbrief/SESSIE-START-PROMPT.md`
`https://github.com/moek72/wk-poule/blob/claude/nieuwsbrief/WKPOULE.md`

---

## Kopieer dit als sessie-startprompt

```
Lees eerst WKPOULE.md in de repo — dat bevat de basis-context.
Pad: moek72/familie-club2000-codex-deluxe, branch: claude/nieuwsbrief

Dit is een WK 2026 poule-app voor de Jaikaran-familie.
Repo: moek72/familie-club2000-codex-deluxe
Branch: claude/nieuwsbrief
Live app: https://moek72.github.io/wk-poule/wkpoule.html
Firebase: https://wk-2026-poule-867ae-default-rtdb.europe-west1.firebasedatabase.app (pad: v/)

⚠️ NOOIT deelnemersdata verwijderen uit Firebase.
Filter altijd: k !== '_r' && k !== '_k' && k !== '_bbq' && k !== '_quiz'

════════════════════════════════════
WAT ER GEDAAN IS (vorige sessies)
════════════════════════════════════

1. WKPOULE.md aangemaakt — volledige project-context
2. SESSIE-START-PROMPT.md aangemaakt — dit bestand
3. wk-gazette-presentatie.html gebouwd — 13-slide HTML nieuwsbrief presentatie
4. render-html.js gebouwd — puppeteer script dat HTML-presentatie naar MP4 omzet
5. bgm.wav gegenereerd — achtergrondmuziek (remotion-poule/)
6. Slides geëxporteerd als PNG — remotion-poule/frames/ en /slides/
7. Diverse stats-tegels toegevoegd aan de app (ONTDEK-sectie):
   Spelerskaart, Speler van de dag, Streaks, Voorspeller-types,
   Meest voorkomende uitslagen, Meest gekozen voorspellingen,
   Kampioen gekozen, Durf-score, Head-to-head, Beste per wedstrijd,
   Oranje-kenner, Poedel hall of fame, Achterlopers
8. Google Drive map aangemaakt: "WK Gazette Slides" (ID: 1z1j3bk-Yq5XEksukXcehm5GDgRojQYaQ)
9. ChatGPT-prompts gemaakt voor 20 voetbalshirt-afbeeldingen per deelnemer

⚠️ BELANGRIJKE FOUT UIT VORIGE SESSIE:
WhatsApp-bericht had VERKEERDE scores (Pok 61pt, Shamma 61pt etc.)
Die kwamen uit hardgecodeerde HTML-presentatie, niet Firebase.
ALTIJD live data ophalen via Firebase REST API, nooit uit statische bestanden.

Juiste stand (na 40 wedstrijden, check Firebase voor actueel):
1. Shyam Asarfi — 53pt
2. Pok — 49pt
3. Shamma — 45pt
4. Céline Jaikaran — 45pt
5. Moek — 43pt

════════════════════════════════════
WAT NOG GEDAAN MOET WORDEN
════════════════════════════════════

🔴 PRIORITEIT — SHIRT AVATARS IN DE APP:

De app gebruikt nu emoji als avatar (AVT array in wkpoule.html).
Die moeten vervangen worden door voetbalshirt-afbeeldingen per deelnemer.

Gebruiker genereert via ChatGPT 20 losse shirt-PNG's.
Bestandsnamen en mapping:

  assets/shirts/shirt-shyam.png        → Shyam Asarfi    (oranje, Nederland, #1)
  assets/shirts/shirt-pok.png          → Pok             (groen, Mexico, #2)
  assets/shirts/shirt-shamma.png       → Shamma          (blauw, Frankrijk, #3)
  assets/shirts/shirt-celine.png       → Céline Jaikaran (blauw, Frankrijk, #4)
  assets/shirts/shirt-moek.png         → Moek            (oranje, Nederland, #5)
  assets/shirts/shirt-sunaina.png      → Sunaina         (blauw, Frankrijk, #6)
  assets/shirts/shirt-kawita.png       → Kawita          (wit, Duitsland, #7)
  assets/shirts/shirt-geert.png        → Geert Wilders   (oranje, Nederland, #8)
  assets/shirts/shirt-sunita.png       → Sunita          (oranje, Nederland, #9)
  assets/shirts/shirt-totomaster.png   → Totomaster      (rood, Marokko, #10)
  assets/shirts/shirt-kandratiki.png   → Kandratiki      (blauw, Frankrijk, #11)
  assets/shirts/shirt-surya.png        → Surya (Raghni)  (blauw, Frankrijk, #12)
  assets/shirts/shirt-chanine.png      → Chanine         (rood, Marokko, #13)
  assets/shirts/shirt-seanjay.png      → SeanJay         (blauw, Frankrijk, #14)
  assets/shirts/shirt-oetra.png        → Oetra           (oranje, Nederland, #15)
  assets/shirts/shirt-koekiee.png      → KOEKIEE         (geel, Brazilië, #16)
  assets/shirts/shirt-rinaldo.png      → Rinaldo         (geel, Brazilië, #17)
  assets/shirts/shirt-vinay.png        → Vinay           (groen, Mexico, #18)
  assets/shirts/shirt-duup.png         → Duup            (groen, Mexico, #19)
  assets/shirts/shirt-ikke.png         → ikke            (groen, Mexico, #20)

Stap 1: Gebruiker uploadt 20 shirt-PNG's naar assets/shirts/ in de repo
Stap 2: AVT emoji-array in wkpoule.html vervangen door shirt-images
Stap 3: Overal waar avatar getoond wordt → <img> tag ipv emoji
Stap 4: CSS aanpassen voor goede schaling
Stap 5: Testen, committen, pushen

════════════════════════════════════
TECHNISCHE DETAILS
════════════════════════════════════

Huidige avatar-code (zoek hierop in wkpoule.html):
const AVT=["⚽","🏃","👑","🦁","🐯","🦅","🌟","🎯","💪","🔥","🎲","🌍","🦊","🐉","🎪","🚀"];

Deelnemers-filter (gebruik altijd exact dit):
k !== '_r' && k !== '_k' && k !== '_bbq' && k !== '_quiz'

Puntensysteem:
- Exacte score: +5pt
- Juiste winnaar/gelijkspel: +2pt
- Kampioen correct: +10pt

Standaard git workflow:
git add [bestanden]
git commit -m "beschrijving"
git push -u origin claude/nieuwsbrief

════════════════════════════════════
WAT IK NU WIL DOEN
════════════════════════════════════

[VUL HIER IN — bijv: "De 20 shirt-PNG's staan klaar in assets/shirts/ —
zet ze als avatars in de app"]
```
