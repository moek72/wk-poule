package nl.kb30.protocol

/**
 * Wear OS Data Layer paths.
 *
 * Two transport styles are used:
 *  - **DataClient items** (retained, syncing state): the current [SessionSnapshot],
 *    the [BlockState], and the [SwingLedger]. These survive disconnects and
 *    reconcile automatically when the link returns.
 *  - **MessageClient messages** (fire-and-forget control): pause/resume/skip/etc.
 *    Timers keep running locally on both sides regardless of delivery, so a lost
 *    control message never loses the session — the retained snapshot corrects it.
 */
object WearPaths {

    // Retained, reconciling state (DataClient).
    const val SESSION = "/kb30/session"        // SessionSnapshot
    const val BLOCK = "/kb30/block"            // BlockState (safety gates)
    const val SWINGS = "/kb30/swings"          // SwingLedger (CRDT)

    // Fire-and-forget control messages (MessageClient).
    const val CTRL_START = "/kb30/ctrl/start"
    const val CTRL_PAUSE = "/kb30/ctrl/pause"
    const val CTRL_RESUME = "/kb30/ctrl/resume"
    const val CTRL_SKIP = "/kb30/ctrl/skip"
    const val CTRL_SET_DONE = "/kb30/ctrl/set_done"
    const val CTRL_EMERGENCY = "/kb30/ctrl/emergency"    // noodstop / chest event

    // Post-set feedback and summaries.
    const val PAIN_REPORT = "/kb30/pain"       // { location, rating, exerciseId }
    const val RPE = "/kb30/rpe"                // { value, exerciseId }
    const val TALK_TEST = "/kb30/talktest"     // { result, exerciseId }
    const val SUMMARY = "/kb30/summary"        // end-of-session summary -> phone stores it

    // Capability advertised by a phone that hosts the KB30 bridge.
    const val CAP_PHONE_BRIDGE = "kb30_phone_bridge"
}
