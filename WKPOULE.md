# WK Poule 2026 — Context voor Claude Code

> Lees dit bestand **altijd eerst** als je aan de WK Poule werkt.

## Wat is dit project

Een **single-file PWA** (`wkpoule.html`) voor een WK 2026 voetbalpoule binnen de Jaikaran-familie. 20 deelnemers voorspellen scores, live Firebase backend.

- **Live app:** `https://moek72.github.io/wk-poule/wkpoule.html`
- **Firebase:** `https://wk-2026-poule-867ae-default-rtdb.europe-west1.firebasedatabase.app`
- **Firebase pad:** `v/` (alles zit hieronder)
- **Repo:** `moek72/familie-club2000-codex-deluxe` (branch: `claude/nieuwsbrief`) → gemerged naar `moek72/wk-poule`
- **GitHub Pages branch:** `main` van `moek72/wk-poule`

## ⚠️ KRITISCHE VEILIGHEIDSREGEL

**VERWIJDER NOOIT deelnemersdata uit Firebase.** Er zijn echte deelnemers die voorspellingen hebben ingevoerd. Alleen `_k` (kampioen-keuzes) is schrijfbaar. Nooit participant-voorspellingen aanpassen of verwijderen.

Veilige filter voor deelnemers (gebruik dit altijd):
```javascript
k !== '_r' && k !== '_k' && k !== '_bbq' && k !== '_quiz'
```

## Firebase structuur

```
v/
  _r/          ← uitslagen (alleen admin schrijft hier)
    w1: {t:2, u:0}   ← wedstrijd 1: thuis 2, uit 0
    w2: {t:2, u:1}
    ...
    kampioen: ""     ← winnend land (leeg = nog niet bekend)
  _k/          ← kampioen-keuzes per deelnemer
    Pok: "Mexico"
    Shamma: "Frankrijk"
    ...
  _bbq/        ← BBQ-aankondigingen (negeer)
  _quiz/       ← Quiz-data (negeer)
  Pok/         ← deelnemer-data
    w1: {t:1, u:0}   ← voorspelling wedstrijd 1
    w2: {t:3, u:1}
    ...
  Shamma/
    ...
  [18 andere deelnemers]/
```

## Puntensysteem

| Resultaat | Punten |
|-----------|--------|
| Exacte score | +5 pt |
| Juiste winnaar/gelijkspel | +2 pt |
| Fout | 0 pt |
| Kampioen correct geraden | +10 pt |

**JavaScript scoringsfunctie (gebruik exact deze logica):**
```javascript
if (v.t === e.t && v.u === e.u) { pt += 5; ex++; }
else if ((v.t > v.u && e.t > e.u) || (v.t < v.u && e.t < e.u) || (v.t === v.u && e.t === e.u)) { pt += 2; goed++; }
else { fout++; }
```

## Huidige stand (check live via Firebase voor actuele cijfers)

Data ophalen vanuit terminal:
```bash
curl -s "https://wk-2026-poule-867ae-default-rtdb.europe-west1.firebasedatabase.app/v.json" | python3 -c "
import json,sys
data=json.load(sys.stdin)
res=data.get('_r',{})
kamp_keuze=data.get('_k',{})
echte_kamp=res.get('kampioen','')
scores=[]
for naam,sd in data.items():
    if naam.startswith('_'): continue
    pt=0;ex=0;goed=0;fout=0;inv=0
    for k,r in res.items():
        if not k.startswith('w'): continue
        v=sd.get(k)
        if v and v.get('t') is not None: inv+=1
        if v is None or v.get('t') is None: continue
        if v['t']==r['t'] and v['u']==r['u']: pt+=5;ex+=1
        elif (v['t']>v['u'] and r['t']>r['u']) or (v['t']<v['u'] and r['t']<r['u']) or (v['t']==v['u'] and r['t']==r['u']): pt+=2;goed+=1
        else: fout+=1
    kv=kamp_keuze.get(naam,'')
    if echte_kamp and kv==echte_kamp: pt+=10
    scores.append({'naam':naam,'pt':pt,'ex':ex,'goed':goed,'fout':fout,'inv':inv})
scores.sort(key=lambda x: (-x['pt'],-x['ex']))
for i,s in enumerate(scores):
    print(f'{i+1:2}. {s[\"naam\"]:<25} {s[\"pt\"]:3}pt  ex:{s[\"ex\"]}  goed:{s[\"goed\"]}  fout:{s[\"fout\"]}  inv:{s[\"inv\"]}')
"
```

## Deelnemers (20 stuks)

Chanine Jaikaran, Céline Jaikaran, Duup, Geert Wilders, KOEKIEE 🦅, Kandratiki, Kawita, Moek, Oetra, Pok, Rinaldo Jaikaran, SeanJay, Shamma, Shyam Asarfi, Sunaina, Sunita, Surya (Raghni) Jaika, Totomaster, Vinay, ikke

## Technische details

- **Single file:** alles zit in `wkpoule.html` (HTML + CSS + JS, geen build step)
- **Geen externe dependencies** buiten Firebase SDK en Google Fonts
- **ESPN API** voor live wedstrijdscores (polling): `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard`
- **104 wedstrijden** in de array `W` (groepsfase t/m finale)
- **Backups:** `backups/backup-YYYY-MM-DD.json` — dagelijkse GitHub Actions exports
- **Kampioen deadline:** 2026-06-22T22:00:00Z (daarna niet meer aanpassen)
- **Poedelprijs:** laagste score die ≥ 75% wedstrijden invulde én kampioen koos

## Eerder gebouwde features (ONTDEK-tegels)

- Spelerskaart, Speler van de dag, Streaks, Voorspeller-types
- Meest voorkomende uitslagen, Meest gekozen voorspellingen
- Kampioen gekozen, Durf-score, Head-to-head
- Beste per wedstrijd, Oranje-kenner, Poedel hall of fame, Achterlopers

## Belangrijke bestanden

| Bestand | Wat |
|---------|-----|
| `wkpoule.html` | De volledige app (single file) |
| `wk-gazette-presentatie.html` | HTML slideshow (13 slides) voor nieuwsbrief |
| `backups/` | Dagelijkse Firebase backups als JSON |
| `remotion-poule/` | Video-generator scripts (puppeteer + ffmpeg) |
| `remotion-poule/render-html.js` | HTML → MP4 via puppeteer screenshots |

## Veelgemaakte fout

**Gebruik NOOIT hardgecodeerde data uit `wk-gazette-presentatie.html` of andere statische bestanden voor statistieken.** Haal altijd live data op via de Firebase REST API. De presentatie bevat handmatig ingevoerde, mogelijk onjuiste cijfers.
