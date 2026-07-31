# KB30 phone bridge (PWA ↔ watch)

The watch talks to the phone over the **Wear OS Data Layer API**. That API is
native Android — a PWA (JavaScript running in the browser / installed web app)
**cannot call it directly**. So the phone needs a tiny native bridge that:

1. hosts (or sits next to) the KB30 PWA, and
2. relays the same messages/state this watch module uses.

This folder documents the contract and gives a reference `WearableListenerService`
sketch. It is intentionally *not* wired into the Gradle build here — it belongs
in the phone app, and how you host the PWA is your choice. Two options:

- **A: TWA / WebView host.** Wrap the existing KB30 PWA in a thin Android app
  (Trusted Web Activity or a WebView). Add the `WearableListenerService` below.
  Bridge the web layer with a `@JavascriptInterface` (WebView) or `postMessage`
  so the PWA can send/receive the JSON payloads.
- **B: Keep the PWA as-is** and run a minimal standalone "KB30 Bridge" phone app
  whose only job is the Data Layer relay + a shared local store the PWA reads via
  a small content provider. Heavier; only worth it if you cannot repackage the PWA.

Either way the wire format is identical and defined once in `:shared`
(`nl.kb30.protocol`), so the watch and the bridge never drift.

## The contract (mirror of `nl.kb30.protocol.WearPaths`)

Retained **DataClient** items (auto-reconcile after a disconnect):

| Path            | Payload (`dataMap["json"]`)              |
|-----------------|------------------------------------------|
| `/kb30/session` | `SessionSnapshot` JSON                    |
| `/kb30/block`   | `BlockState` JSON (safety gates)          |
| `/kb30/swings`  | `SwingLedger` JSON (CRDT)                 |

Fire-and-forget **MessageClient** messages (control + feedback):

| Path                  | Payload JSON                          |
|-----------------------|---------------------------------------|
| `/kb30/ctrl/pause`    | `{}`                                  |
| `/kb30/ctrl/resume`   | `{}`                                  |
| `/kb30/ctrl/skip`     | `{}`                                  |
| `/kb30/ctrl/set_done` | `{}`                                  |
| `/kb30/ctrl/emergency`| `{ "kind": "chest" }`                 |
| `/kb30/pain`          | `{ "exerciseId", "location"|"rating" }`|
| `/kb30/rpe`           | `{ "exerciseId", "value" }`           |
| `/kb30/talktest`      | `{ "exerciseId", "result" }`          |
| `/kb30/summary`       | `SessionSummary` JSON                  |

### Safety invariants the bridge MUST honour
- `/kb30/block` is the shared truth for the painkiller day, the 48-hour chest
  block, the swing unlock, and the HR-enabled flag. Merge by the higher `version`
  (last-writer-wins) — see `BlockState.mergeWith`.
- A `/kb30/ctrl/emergency` or a `/kb30/pain` with `location = "BORST"` must trigger
  the phone's stop screen **and** arm the 48h block immediately, exactly like the
  watch does.
- Never forward raw heart-rate values across the Data Layer; HR stays on-device.
- The phone remains the source of truth and the only place full history is stored.
