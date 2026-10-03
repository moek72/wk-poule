# KB30 — telefoon-PWA

De hoofdapp van KB30: een offline-first Progressive Web App (vanilla JS, ES
modules, geen framework, geen build). Dit is de bron van waarheid; het horloge
(`../kb30-wear`) is een optionele companion.

## Draaien

Elke statische server volstaat, bijv.:

```bash
cd kb30-pwa && python3 -m http.server 8080   # of: npx serve .
```

Open op je telefoon in Chrome → **"Toevoegen aan startscherm"** → werkt offline,
data blijft lokaal. Je kunt 'm ook hosten op GitHub Pages.

> In de native telefoon-app (`../kb30-wear/phone`) wordt exact deze map in de
> app-assets gebundeld en over een https-origin geserveerd, zodat de koppeling
> met het horloge werkt. De PWA merkt zelf of die brug er is (`bridge.js`) en
> draait anders gewoon standalone.

## Structuur

```
js/
├── safety.js        harde medische gates (spiegel van de Kotlin SafetyGate)
├── swingLedger.js   CRDT-swingteller (geen dubbeltellingen bij resync)
├── gates.js         fase-2 unlock (progressielogica)
├── data/exercises.js  volledige oefenbibliotheek + sessie-opbouw
├── engine.js        workout-state machine (timer, cues, sync)
├── store.js         reactieve state (localStorage) + pub/sub
├── db.js            IndexedDB (sessies, ochtend-checks, metingen, export/import)
├── voice.js         stem (nl-NL) + piepjes + trillen
├── bridge.js        koppeling met het horloge (Wear Data Layer, via native app)
├── illustrations.js inline SVG per oefening
└── screens/         dashboard, check-in, speler, voortgang, bibliotheek, instellingen
```

## Veiligheid (dezelfde regels als het horloge)

- Dagelijkse check-in met pijnstiller-vraag → JA blokkeert de KB-sessie (mobiliteit).
- Borstklacht (noodstop of pijn op de borst) → stopscherm + 48-uurs blokkade,
  lokaal bewaard en naar het horloge gepusht.
- RPE 8–10 of praattest "Nee" → herstel-check.
- Swings op slot tot de progressiegate ze vrijspeelt.
- Hartslag stuurt nergens de intensiteit; die instelling geldt alleen het horloge.

## Getest

Een headless smoke-test (Chromium) doorloopt de kernflows — disclaimer →
check-in → speler (warming-up eerst, WERK-timer, noodstop) → borststop →
48u-blok → gedwongen mobiliteit, alles gepersisteerd — **16/16 groen, 0 JS-fouten**.
Zie `../kb30-wear` voor de watch- en protocol-tests.
