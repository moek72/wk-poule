# HOSTING.md — GitHub Pages Deploy Guide

## 🚀 Stappen om live te krijgen

### 1. GitHub repo aanmaken

```bash
cd familie-club2000
git init
git add .
git commit -m "Initial build: Familie Club 2000"
git branch -M main
```

Maak een nieuwe repo aan op https://github.com/new (naam bv. `familie-club2000`, public).

```bash
git remote add origin git@github.com:moekclaw72/familie-club2000.git
git push -u origin main
```

### 2. GitHub Pages activeren

1. Ga naar je repo op github.com
2. **Settings** → **Pages**
3. Source: `Deploy from a branch`
4. Branch: `main`, folder: `/ (root)`
5. Save

Je app komt nu online op: `https://moekclaw72.github.io/familie-club2000/`

### 3. PWA werkend maken op subpath

GitHub Pages serveert je app op `/familie-club2000/` (subpath). Dat betekent:

**In `manifest.json`:**
```json
{
  "name": "Familie Club 2000",
  "short_name": "Club 2000",
  "start_url": "/familie-club2000/",
  "scope": "/familie-club2000/",
  "display": "standalone",
  "theme_color": "#FFD700",
  "background_color": "#1a0000",
  "orientation": "portrait",
  "icons": [
    { "src": "assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "assets/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**In `index.html`:**
- Gebruik **relatieve paths** voor alle assets (`./assets/...` of `assets/...`)
- Voor service worker registratie: `navigator.serviceWorker.register('./sw.js')`

**In `sw.js`:**
```javascript
const CACHE_NAME = 'familie-club2000-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/style.css',
  // ... alle JS bestanden
  // ... alle 23 familielid PNG's
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
```

### 4. Testen op echte telefoon

**iPhone (Safari):**
1. Open `https://moekclaw72.github.io/familie-club2000/` in Safari
2. Tap **Share** → **Add to Home Screen**
3. Open vanaf homescreen → werkt fullscreen als app

**Android (Chrome):**
1. Open URL in Chrome
2. Browser toont automatisch "Install app" banner
3. Tap installeren → app komt op homescreen

### 5. Custom domein (optioneel, later)

Als je later een domein wil zoals `club2000.familiejagroep.nl`:

1. Koop domein bij TransIP / Strato / Cloudflare
2. Maak `CNAME` record: `club2000` → `moekclaw72.github.io`
3. In repo: maak bestand `CNAME` met inhoud `club2000.familiejagroep.nl`
4. GitHub Pages → custom domain instellen

## 🔄 Updates pushen

```bash
# Wijzig code...
git add .
git commit -m "Fix: kop/munt cursor sneller"
git push

# Wacht 1-2 min, GitHub Pages bouwt automatisch
```

**LET OP:** Service worker cached oude versies. Update versienummer in `sw.js` bij elke release:
```javascript
const CACHE_NAME = 'familie-club2000-v2'; // bump dit nummer!
```

## 📊 Lighthouse score testen

```bash
# In Chrome DevTools:
# 1. Open je app URL
# 2. F12 → Lighthouse tab
# 3. Categorie: Progressive Web App
# 4. Generate report
```

Doel: **alle PWA checks green**. Veelvoorkomende fixes:
- Splash screen color in manifest
- Apple-touch-icon ontbrekend
- Service worker scope niet correct
- HTTPS — GitHub Pages doet dit automatisch ✅

## 🎯 Promotie

Als de app live is, deel:
- WhatsApp familie groep met een leuke tekst
- "Tap op de link, voeg toe aan beginscherm, en speel!"
- Maak een korte screencast (iPhone screen record)

## 💰 Verdienmodel implementatie (later)

Als dit goed werkt en je wilt het verkopen:

1. **Customizable build:** Splits hardcoded data van engine
2. **Builder UI:** Aparte pagina waar mensen foto's uploaden
3. **Stripe payment:** €9 eenmalig voor eigen versie, of €19/maand voor horeca
4. **Auto-deploy:** Bij betaling → genereer custom subdomain + deploy

Eerste klant testen: **De Rotterdammer** — vervang familiefoto's door menu items, gokkast voor in het café. €99 setup + €19/maand voor maintenance + updates.
