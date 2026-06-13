# Codex Overdracht — Jaikaran Family WK Poule 2026

## Wat is dit project?

Een single-file web app (`wkpoule.html`) waarmee de Jaikaran familie WK-voorspellingen kan invullen. Live scores komen automatisch van ESPN. Ranglijst en uitslagen zijn real-time via Firebase.

**Live URL:** https://moek72.github.io/familie-club2000-codex-deluxe/wkpoule.html  
**Repo:** https://github.com/moek72/familie-club2000-codex-deluxe  
**Branch:** `main` (alles is gemerged)

---

## Wat is al gedaan ✅

- Single-file PWA in `wkpoule.html` (HTML + CSS + JS, geen build step)
- Firebase Realtime Database integratie (hardcoded credentials, geen login nodig)
- Alle 104 WK 2026 wedstrijden in de app
- ESPN live scores automatisch ophalen (geen API key nodig, CORS open)
- Chronologische weergave per dag (niet per poule)
- Dropdown filter: Alles / Vandaag / Groep A-L / 1/16 / 1/8 / KF / HF / Finale
- Live badge (oranje) voor lopende wedstrijden
- Eindstand badge (groen) voor afgelopen wedstrijden
- Uitslagen-tab met live scores + wie +5 of +2 had
- Ranglijst live via Firebase
- Beheerder admin panel (PIN: 2026) voor handmatige uitslag invoer
- Jaikaran Family logo in header
- Hoofdprijs: "Geheel verzorgde BBQ door Kawita"
- Service worker: `wkpoule.html` altijd vers van netwerk (nooit gecached)

---

## Wat nog gedaan moet worden ⏳

- **GitHub repo hernoemen** van `familie-club2000-codex-deluxe` naar `wk-poule` (of andere naam)
  - Kan alleen via: github.com/moek72/familie-club2000-codex-deluxe/settings
  - Na rename: GitHub Pages URL verandert → pas `manifest.json` `start_url` aan
  - Huidige GitHub Pages is al actief via Settings → Pages → main branch

---

## Technische details

### Firebase config (hardcoded, niet geheim)
```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCeu-e2lUD_xUQESb8rdoYczCVBq8O2Vkk",
  authDomain: "wk-2026-poule-867ae.firebaseapp.com",
  databaseURL: "https://wk-2026-poule-867ae-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "wk-2026-poule-867ae",
  storageBucket: "wk-2026-poule-867ae.firebasestorage.app",
  messagingSenderId: "889661679081",
  appId: "1:889661679081:web:5fce0db1b56b3f90ff9778"
};
```

### Firebase database structuur
```
v/
  {naam}/          ← voorspellingen per speler
    w1: {t:2, u:1}   ← thuis score, uit score
    w2: {t:0, u:0}
    ...
  _r/              ← officiële uitslagen (admin + ESPN auto-save)
    w1: {t:2, u:1}
    w2: {t:1, u:0}
```

### Firebase database rules (permanent instellen!)
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### ESPN API
- Endpoint: `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=YYYYMMDD`
- CORS open, geen auth nodig
- Status: `pre` = nog niet begonnen, `in` = live, `post` = afgelopen
- Ophalen: alle unieke WK-datums die al voorbij zijn + morgen (parallel)
- Auto-save: eindstanden (`post`) worden automatisch naar Firebase `v/_r` geschreven
- Auto-poll: elke 60 seconden als er live wedstrijden zijn

### Puntensysteem
- Exacte score: **+5 punten**
- Juiste winnaar/gelijkspel: **+2 punten**
- Fout: 0 punten

### Admin panel
- Via "Regels" tab → "📝 Uitslagen invoeren"
- PIN: `2026`
- Schrijft naar `v/_r/w{id}` in Firebase

---

## Bestandsstructuur

```
wkpoule.html          ← ALLES zit hierin (HTML + CSS + JS)
sw.js                 ← Service worker (wkpoule.html = network-only)
manifest.json         ← PWA manifest
assets/
  jaikaran-logo.png   ← Familiefoto logo (256x256)
  familie/            ← Foto's van familieleden (voor de Club 2000 gokkast app)
  icons/              ← PWA icons
```

`wkpoule.html` is volledig zelfstandig — alle logica zit daarin.

---

## Bekende issues / aandachtspunten

1. **ESPN team namen**: de mapping Engels→Nederlands zit in `ESPN_NL` object bovenaan het JS-gedeelte. Als een team niet herkend wordt zie je een `[ESPN] geen match:` warning in de console. Voeg dan de juiste vertaling toe aan het object.

2. **Firebase rules verlopen**: Firebase testmode rules verlopen na 30 dagen. Zet permanente rules in de Firebase console (zie boven).

3. **Service worker cache**: bij updates aan `wkpoule.html` krijgen gebruikers altijd de nieuwe versie omdat de SW de pagina nooit cached. Andere assets (de gokkast) gebruiken cache-first met versienummer in `sw.js`.

4. **GitHub Pages**: is ingesteld op `main` branch, root folder. Na repo rename: even 5 minuten wachten voor Pages herstart.

---

## Hoe verder bouwen

```bash
git clone https://github.com/moek72/familie-club2000-codex-deluxe
# werk in wkpoule.html
git add wkpoule.html
git commit -m "beschrijving"
git push origin main
# GitHub Pages deployed automatisch
```

Alle logica zit in één file. Zoek naar functienamen:
- `renW(sd)` — renders wedstrijdenlijst (invullen tab)
- `renRes()` — renders uitslagen tab  
- `renR(sc)` — renders ranglijst
- `laadESPN()` — haalt ESPN scores op + sla op in Firebase
- `startLive()` — Firebase realtime listener (onValue)
- `slaOp()` — slaat gebruikersvoorspellingen op
- `openAdmin()` — admin panel voor handmatige uitslag invoer
