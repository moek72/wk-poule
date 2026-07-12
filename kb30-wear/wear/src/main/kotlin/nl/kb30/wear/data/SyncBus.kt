package nl.kb30.wear.data

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import nl.kb30.protocol.BlockState
import nl.kb30.protocol.SessionSnapshot
import nl.kb30.protocol.SwingLedger

/** A control message received from the phone (path + decoded payload). */
data class ControlEvent(val path: String, val payload: Map<String, Any?>)

/**
 * Process-wide bridge between the background [Kb30WearListenerService] (which
 * receives Data Layer events even when no UI is up) and the foreground
 * ViewModel. Both push here; the ViewModel observes. Keeping one bus means an
 * event delivered while the app was backgrounded is not lost when the UI
 * re-attaches — the latest retained state is always readable from these flows.
 */
object SyncBus {

    private val _session = MutableStateFlow<SessionSnapshot?>(null)
    val session: StateFlow<SessionSnapshot?> = _session.asStateFlow()

    private val _block = MutableStateFlow<BlockState?>(null)
    val block: StateFlow<BlockState?> = _block.asStateFlow()

    private val _swings = MutableStateFlow<SwingLedger?>(null)
    val swings: StateFlow<SwingLedger?> = _swings.asStateFlow()

    private val _control = MutableSharedFlow<ControlEvent>(extraBufferCapacity = 16)
    val control: SharedFlow<ControlEvent> = _control.asSharedFlow()

    fun postSession(s: SessionSnapshot) { _session.value = s }
    fun postBlock(b: BlockState) { _block.value = b }
    fun postSwings(l: SwingLedger) { _swings.value = l }
    fun postControl(e: ControlEvent) { _control.tryEmit(e) }
}
