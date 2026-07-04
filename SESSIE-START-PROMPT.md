# Sessie-startprompt voor WK Poule

> **LAATSTE UPDATE: 4 juli 2026 (avond)** — lees dit blok eerst.

## ⚡ ACTUELE STAND (waar zijn we gebleven)

| Onderdeel | Status |
|-----------|--------|
| **Leidende/live branch** | `main` van `moek72/wk-poule` (NIET meer `claude/nieuwsbrief`) |
| **Lokale clone** | `G:\Mijn Drive\wk 26\repo\` — staat op `main`, push-rechten werken |
| **Live app** | https://moek72.github.io/wk-poule/wkpoule.html (GitHub Pages volgt `main`) |
| **Bracket 1/8 finales** | ✅ GEFIXT & LIVE (2 jul): w89-w91 juiste paringen (Canada-Marokko etc.), w94 thuis/uit gelijkgelegd met ESPN |
| **Pages deploy-timeout** | ✅ GEFIXT (2 jul): `_config.yml` sluit remotion-frames/backups uit; artifact 695MB → 17MB |
| **KO-score orientatie** | ✅ GEFIXT & LIVE (4 jul, commit 5c538f1): race condition die uitslagen omdraaide (w89 3-0 i.p.v. 0-3) + punten aan verkeerde mensen gaf |
| **Weekfilm 3** | ✅ KLAAR: "WK Gazette 3 - De Penalty-Week.mp4" (2m27) in `G:\Mijn Drive\wk 26\Film - De Val van Gabbar\` |
| **Auto-backup** | ✅ Draait automatisch (GitHub Action → `main`, meermaals per dag) |

**Stand na w89 (4 jul):** 1. Shyam 125 · 2. Moek 123 · 3. Pok 116 · 4. Shamma 115 · 5. Céline 115. Moek was 1 dag koploper, Shyam heroverde de leiding.

### 🔴 VOLGENDE TAAK — niets handmatigs, wel monitoren
De bracket loopt volledig automatisch (resolveBracket + ESPN advance). Kwartfinale-teams verschijnen vanzelf zodra de 1/8 finales gespeeld zijn (t/m 7 jul). **Monitortaak:** na elke KO-wedstrijd even checken of de uitslag in de app de juiste orientatie heeft (er kunnen 4 jul nog telefoons met de oude gecachte app-versie rondlopen die verkeerd naar `_r` schrijven; de nieuwe versie herstelt dat zelf, maar controleer bij twijfel `_r` tegen ESPN).

**Werkwijze bij twijfel over een uitslag:** vergelijk `v/_r/wNN` in Firebase met ESPN scoreboard van die dag. Firebase = waarheid voor punten. Weergave-bugs zitten in espnScores (client-side).

---

## Waar zijn de bestanden te vinden?

| Bestand | Locatie | Waarvoor |
|---------|---------|----------|
| `WKPOULE.md` | repo root (`moek72/wk-poule`, branch `main`) | Volledige project-context, Firebase structuur, puntensysteem |
| `SESSIE-START-PROMPT.md` | repo root | Dit bestand |
| `wkpoule.html` | repo root | De volledige app (single file, alles erin) |
| `wk-gazette-presentatie.html` | repo root | HTML nieuwsbrief slideshow (13 slides) |
| `assets/shirts/` | repo root | 20 voetbalshirt PNG's per deelnemer (KLAAR) |
| `backups/` | repo root | Firebase backups als JSON (auto + handmatig) |
| `remotion-poule/` | repo root | Video-generator (puppeteer + ffmpeg) |

**Lokaal werken:** open `G:\Mijn Drive\wk 26\repo\` (op `main`). Daar staat alles, push werkt.

⚠️ **Valkuil:** `C:\Games\familie-club2000-codex-deluxe` lijkt de poule maar is een ÁNDER project (remote = `familie-runner`). Niet gebruiken.

---

## Kopieer dit als sessie-startprompt

```
Lees eerst WKPOULE.md én de "ACTUELE STAND" bovenin SESSIE-START-PROMPT.md.

Dit is de WK 2026 poule-app voor de Jaikaran-familie.
Repo: moek72/wk-poule — LEIDENDE/LIVE branch: main
Lokale clone: G:\Mijn Drive\wk 26\repo (staat op main, push werkt)
Live app: https://moek72.github.io/wk-poule/wkpoule.html
Firebase: https://wk-2026-poule-867ae-default-rtdb.europe-west1.firebasedatabase.app (pad: v/)

⚠️ NOOIT deelnemersdata verwijderen uit Firebase.
Filter altijd: k !== '_r' && k !== '_k' && k !== '_bbq' && k !== '_quiz'
⚠️ Stats/scores ALTIJD live uit Firebase REST API halen, nooit uit statische bestanden.

GEDAAN (t/m 25 jun 2026):
- Shirt-avatars: 20 stuks live in app (assets/shirts/), Shyam+Oetra gefixt
- Stats-tegels (ONTDEK-sectie): spelerskaart, speler v/d dag, streaks, etc.
- WK Gazette: HTML-presentatie + MP4-pipeline + slides
- 8e finale w73 ingevuld & live: Zuid-Afrika vs Canada

VOLGENDE TAAK (vanaf 27 jun): rest van de 8e finales (w74-w88) invullen
zodra groepen D-L klaar zijn. Standen uit Firebase _r berekenen.

Puntensysteem: exacte score +5pt | juiste winnaar +2pt | kampioen +10pt

WAT IK NU WIL DOEN:
[VUL HIER IN]
```
