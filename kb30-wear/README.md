# KB30 — Wear OS companion (Galaxy Watch / Wear OS)

An **optional** smartwatch companion for the KB30 kettlebell coaching PWA. The
phone PWA stays the main app and the source of truth; the watch is a hands-free
remote + timer + swing counter that works even when the phone is away.

> Language in the UI is Dutch (B1), matching the phone app.

## Why this is a native module (and not "the PWA on the watch")

Two hard requirements from the brief are **native Android APIs** that a PWA
cannot call:

- **Wear OS Data Layer API** for local phone ↔ watch messaging.
- **Health Services** for the optional, informational heart rate.

So the watch app is a native Kotlin / Jetpack-Compose-for-Wear-OS app. The phone
side needs a thin native **bridge** to relay Data Layer traffic to/from the PWA —
see [`phone-bridge/`](phone-bridge/README.md). The wire format is defined once in
`:shared`, so the watch and the bridge can never drift.

## Modules

```
kb30-wear/
├── shared/        Pure Kotlin/JVM. Protocol + ALL safety-critical logic.
│                  No Android — so it compiles and its tests run on a bare JVM.
│   └── nl/kb30/protocol/
│        ├── SafetyGate.kt     painkiller block, 48h chest block, recovery, emergency
│        ├── BlockState.kt     shared gate state (version-merged)
│        ├── SwingLedger.kt    CRDT swing counter (no double counting on reconnect)
│        ├── SessionSnapshot   retained session state (auto-reconciles)
│        ├── Catalog.kt        offline default session (obeys every medical rule)
│        ├── Model.kt / WearPaths.kt / Json.kt
│        └── Verify.kt         zero-dependency self-test (`gradle :shared:run`)
├── wear/          The Wear OS app (Compose). Depends on :shared.
│   └── nl/kb30/wear/
│        ├── MainActivity.kt              Compose host, HR permission, 112, AOD, wake
│        ├── engine/WorkoutViewModel.kt   timer state machine + sync + safety wiring
│        ├── data/  WearSync, SyncBus, ListenerService, LocalStore, Haptics
│        ├── health/HeartRateController   optional, informational HR (default OFF)
│        └── presentation/  Kb30App router + screens + components + theme
├── phone/         The native PHONE app: hosts the KB30 PWA in a WebView (served
│                  over an https virtual origin so ES modules / IndexedDB / the
│                  service worker all work) and bridges it to the watch via the
│                  Data Layer. The PWA lives in ../kb30-pwa and is synced into
│                  assets at build time (syncPwa task).
└── phone-bridge/  Original contract notes + sketch. The real, buildable
                   implementation now lives in :phone above.
```

The full system is three parts: the **PWA** (`../kb30-pwa`, the phone app / source
of truth), the **:phone** app (WebView host + Data Layer bridge), and the **:wear**
app. `:shared` defines the wire protocol + safety gates once for all three.

## Build

Needs the Android SDK (SDK 34, Wear OS 3 / minSdk 30). In `local.properties`:

```
sdk.dir=/path/to/Android/sdk
```

Then:

```bash
./gradlew :wear:assembleDebug     # build the watch APK
./gradlew :shared:test            # JUnit tests for the safety logic
./gradlew :shared:run             # zero-dependency self-test harness (42 checks)
```

> The `:shared` module has **no Android dependency**, which is deliberate: the
> medical gates can be verified anywhere, with or without an SDK. The self-test
> harness was run green (42/42) during development; the JUnit suite (`SafetyGateTest`,
> `SwingLedgerTest`) covers the same invariants.

## Screens (one primary action each, round-friendly)

Today → (daily gate) → Player (work/rest timer, illustration, ≤2 cues) →
Swings (full-screen tap = +1, undo) → 😊/😐/😣 → pain location → RPE (0–10) →
talk test (Ja/Moeilijk/Nee) → recovery check → session summary. Settings holds
the HR toggle and the 48h-block reset. NOODSTOP is on every training screen.

## Safety model (the important part)

These are code, not advice — and they live in `:shared` so both devices share them:

- **Painkiller day → mobility only.** Reported on phone *or* watch; applies to both.
- **Chest complaint (button, or pain located at the chest) → immediate stop screen
  + 48-hour KB block**, armed locally and pushed to the phone. Enforced even when
  disconnected, and even when the watch app was closed (the listener service
  persists the block).
- **RPE 8–10 or talk test "Nee" → stop the set, open a recovery check.**
- **Heart rate never drives anything.** Default OFF. Display-only, with the
  disclaimer *"Alleen ter informatie. Niet gebruiken als medische beoordeling."*
  No HR zones, no max-HR formulas, no calorie advice, no auto-progression, no
  auto-emergency, and never an "all clear". No reading → *"geen meting"* (never
  interpolated). Rationale: the user takes Metoprolol, so exertion HR is blunted —
  intensity is steered only by RPE + talk test.
- **Swings stay locked** until the phone's progression gate unlocks them
  (`BlockState.swingsUnlocked`), then appear as ≤20% of the circuit.

## Resilience

- The watch runs its **own** ticking timer, so a disconnect never freezes or
  loses the session; on reconnect the newer `SessionSnapshot` reconciles both sides.
- Swings use a **CRDT ledger**: taps on either device merge by union, undos are
  tombstoned, so reconnecting never double-counts and never resurrects an undo.
- Session + swings + block state are persisted on-watch, so a crash mid-set
  recovers. The watch keeps **no** full history — finished sessions are sent to
  the phone (`/kb30/summary`) for permanent local storage.

## Battery

- Heart rate is the only continuous sensor and it is **OFF by default**, so a
  normal session costs almost nothing beyond the screen.
- Always-on Display renders a stripped frame (timer + exercise name only), which
  keeps the ambient refresh cheap and avoids showing health data on the dim screen.
- The 1 Hz timer is a single coroutine; control/state sync is event-driven
  (`setUrgent` only on real changes), not polled.

## Privacy

No account, no cloud, no backend. All data local. Sensor permission is requested
only when the user turns HR on, and denying it never blocks the workout. Raw
sensor data is never shared or sent off-device. Works without Samsung Health.

## Acceptance criteria → where they live

| Criterion | Where |
|---|---|
| Start from phone **and** watch | `WorkoutViewModel.startFromWatch` + `adoptPhoneSession` |
| Pause/resume/skip/noodstop sync both ways | `mirror()` + `handleControl()` |
| Swing counter syncs, no double counting | `SwingLedger` (CRDT) + tests |
| Temporary disconnect loses no session | local timer + retained `SessionSnapshot` + `LocalStore` |
| Usable without the watch | phone PWA is standalone (this module is optional) |
| Usable without HR permission | HR default OFF; denial doesn't block |
| HR never affects progression/intensity | `HeartRateController` is display-only; no reads in engine |
| Chest complaint → stop + block | `SafetyGate.applyChestEvent` + `triggerChestStop` + listener persists |
| Haptics on work/rest/safety | `Haptics` (distinct patterns per event) |
