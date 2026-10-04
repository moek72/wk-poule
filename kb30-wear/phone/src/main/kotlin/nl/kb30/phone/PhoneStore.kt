package nl.kb30.phone

import android.content.Context
import nl.kb30.protocol.BlockState

/** Local persistence for the safety block state on the phone side. */
class PhoneStore(context: Context) {
    private val prefs = context.getSharedPreferences("kb30_phone", Context.MODE_PRIVATE)

    fun loadBlock(): BlockState =
        prefs.getString(KEY_BLOCK, null)?.let(BlockState::fromJson) ?: BlockState()

    fun saveBlock(block: BlockState) {
        prefs.edit().putString(KEY_BLOCK, block.toJson()).apply()
    }

    private companion object {
        const val KEY_BLOCK = "block_state"
    }
}
