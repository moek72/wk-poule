package nl.kb30.wear.data

import android.content.Context
import nl.kb30.protocol.BlockState
import nl.kb30.protocol.SessionSnapshot
import nl.kb30.protocol.SwingLedger

/**
 * Local, on-watch persistence. The watch never stores full training history
 * (that lives on the phone), but it MUST persist:
 *  - the safety [BlockState], so a chest/painkiller block is enforced even if
 *    the app is killed and the phone is away;
 *  - the in-flight session + swing ledger, so a crash or a temporary disconnect
 *    mid-set never loses the session.
 *
 * Plain SharedPreferences is enough — the payloads are tiny JSON strings.
 */
class LocalStore(context: Context) {

    private val prefs = context.getSharedPreferences("kb30", Context.MODE_PRIVATE)

    // --- Safety block state -------------------------------------------------
    fun loadBlock(): BlockState =
        prefs.getString(KEY_BLOCK, null)?.let(BlockState::fromJson) ?: BlockState()

    fun saveBlock(block: BlockState) {
        prefs.edit().putString(KEY_BLOCK, block.toJson()).apply()
    }

    // --- In-flight session (crash / disconnect recovery) --------------------
    fun loadSession(): SessionSnapshot? =
        prefs.getString(KEY_SESSION, null)?.let(SessionSnapshot::fromJson)

    fun saveSession(snapshot: SessionSnapshot?) {
        prefs.edit().apply {
            if (snapshot == null) remove(KEY_SESSION) else putString(KEY_SESSION, snapshot.toJson())
        }.apply()
    }

    // --- Swing ledger -------------------------------------------------------
    fun loadSwings(): SwingLedger =
        prefs.getString(KEY_SWINGS, null)?.let(SwingLedger::fromJson) ?: SwingLedger()

    fun saveSwings(ledger: SwingLedger) {
        prefs.edit().putString(KEY_SWINGS, ledger.toJson()).apply()
    }

    private companion object {
        const val KEY_BLOCK = "block_state"
        const val KEY_SESSION = "session_snapshot"
        const val KEY_SWINGS = "swing_ledger"
    }
}
