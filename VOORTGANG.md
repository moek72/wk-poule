# VOORTGANG.md — WK Poule 2026

> Logboek van fixes en opgeleverd werk. Nieuwste bovenaan.
> Locatie: `G:\Mijn Drive\wk 26\repo\VOORTGANG.md` + GitHub `moek72/wk-poule` (main).
> Laatst bijgewerkt: **7 juli 2026, ochtend**

---

## Actuele status (7 jul)

- **App:** live en gezond op https://moek72.github.io/wk-poule/wkpoule.html
- **Stand (na w94):** 1. Shyam 125 · 2. Moek 123 · 3. Pok 116 · 4. Shamma 115 · 5. Céline 115
- **Vandaag:** laatste twee 8e finales: Argentinië-Egypte (18:00) en Zwitserland-Colombia (22:00)
- **Kwartfinales:** do 9 jul Frankrijk-Marokko · vr 10 jul Spanje-België · za 11 jul Noorwegen-Engeland · zo 12 jul (03:00) winnaars van vandaag
- **Bracket loopt volautomatisch** (resolveBracket + ESPN). Geen handwerk meer nodig t/m de finale.
- Familie is geïnformeerd dat w95/w96/w97 gecorrigeerd zijn; herzien kan tot 18:00 vandaag.

## Fixes 7 juli (commit `50cfcfb`)

**Bracket w95/w96 kruislings fout + w97 gespiegeld.**
- App toonde "Egypte vs Colombia" en "Zwitserland vs Argentinië"; echt zijn het **Argentinië-Egypte** (w95 = W87 vs W86) en **Zwitserland-Colombia** (w96 = W85 vs W88)
- w97 gespiegeld naar **Frankrijk-Marokko** (W90 vs W89), conform tv/ESPN
- Oorzaak: ESPN's placeholder-labels ("Round of 32 14 Winner") bleken NIET chronologisch genummerd. **Les: paringen pas verifiëren als de echte teamnamen bij ESPN staan, elke ronde opnieuw checken.**
- 17 deelnemers hadden al ingevuld met verkeerde tegenstanders in beeld → familie gewaarschuwd vóór deadline

## Fixes 4 juli (commit `5c538f1`)

**KO-uitslagen kwamen omgedraaid binnen (w89 toonde 3-0 i.p.v. 0-3) en punten gingen naar de verkeerde voorspellers (weergave).**
- Race condition: fetchESPN draait parallel voor alle dagen; bij de eerste laadbeurt waren bracket-tokens (W73) nog niet vertaald → naam-match faalde → score blind omgedraaid
- Fix: oriëntatie via `_resolveToken` op de originele tokens + `omgekeerd`-vlag (alleen draaien bij aantoonbare spiegeling; default = ESPN-volgorde waarop de W-array is gelijkgelegd) + tweede verwerkingspass na `resolveBracket()` met dag-cache (`espnRaw`, wordt per poll-cyclus geleegd)
- Doelpuntenmakers (isHome) en teamnamen (thn/uin) draaien mee
- Firebase `_r` was al correct; het was een client-side verwerkings-/weergavefout
- Let op bij lokaal testen: **service worker cachet agressief** → eerst SW unregisteren + caches wissen

## Fixes 2 juli (commits `783dc32` + `79578b7`)

**1. Bracket 8e finales verkeerd bedraad (w89-w91) + w94 gespiegeld.**
- w89 → Canada-Marokko, w90 → Paraguay-Frankrijk, w91 → Brazilië-Noorwegen, w94 → VS thuis
- KF/HF-bedrading was al correct

**2. GitHub Pages deploy faalde structureel ("Page build failed").**
- Oorzaak: `remotion-poule/frames/` (650MB, 1860 render-PNG's) maakte het deploy-artifact 695MB → upload-timeout
- Fix: `_config.yml` sluit remotion-poule/backups/slides/src uit van de Pages-artifact (695MB → 17MB). Niets verwijderd.
- Er was die avond óók een GitHub Pages-storing (degraded performance); na herstel + fix deployt alles weer normaal

## Opgeleverd: weekfilm 3 (2 jul)

**"WK Gazette 3 - De Penalty-Week.mp4"** — 2m27, 720x1280, in `G:\Mijn Drive\wk 26\Film - De Val van Gabbar\`
- V2 na feedback (V1 "De Val van Gabbar" staat er ook nog, afgekeurd: te somber, te veel Moek-vs-Shyam, slides statisch)
- Opbouw: JSN-intro → titel → rouwkaart Oranje (Hazes) → bye-bye-Holland-bus + Geert's couscous → graven → nieuwe stand → kampioenen-check → schuilplaats-knipoog → programma → ranglijst → shirt-muur-outro
- Pipeline (herbruikbaar): edge-tts VO (nl-NL-Maarten) · HTML-slides in 3 lagen (hash `#scene:b`, Chrome headless met `--default-background-color=00000000`; óók `documentElement` transparant zetten anders geen alpha) · ffmpeg zoompan + overlay slide-in per laag · bouwen op lokale SSD (G:/Drive-mount is ~10x trager)
- Bronbestanden: `Film - De Val van Gabbar\werk\` (slides.html, build2.sh, audio2.sh) + `vo\` (alle VO-mp3's) + `SCRIPT.md`

## Vaste weetjes voor elke sessie

- Repo: `moek72/wk-poule`, branch **main** (live via GitHub Pages). Clone: `G:\Mijn Drive\wk 26\repo\`
- Firebase = waarheid voor punten (`v/_r`); NOOIT deelnemersdata verwijderen; filter `k !== '_r' && k !== '_k' && k !== '_bbq' && k !== '_quiz'`
- Stats altijd live uit Firebase, nooit uit statische bestanden
- Auto-backup Action pusht Firebase-exports meermaals per dag naar main
- In de clone kunnen unstaged Codex-bestanden staan (remotion-poule/render.js, CODEX-VIDEO-BRIEFING.md): niet committen, niet weggooien
- Windows blokkeert schrijven in `C:\Users\moek7\Pictures\` (Controlled Folder Access) → opleveren op G:
