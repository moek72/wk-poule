package nl.kb30.wear.data

import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService
import nl.kb30.protocol.BlockState
import nl.kb30.protocol.Json
import nl.kb30.protocol.WearPaths

/**
 * Receives Data Layer events from the phone even when no KB30 UI is running.
 *
 * The critical job here is safety: if the phone reports a chest event / block
 * while the watch app is closed, we must persist that block immediately so it
 * is enforced the next time the watch is used — regardless of connectivity.
 */
class Kb30WearListenerService : WearableListenerService() {

    private val store by lazy { LocalStore(applicationContext) }

    override fun onDataChanged(buffer: DataEventBuffer) {
        for (event in buffer) {
            if (event.type != DataEvent.TYPE_CHANGED) continue
            val path = event.dataItem.uri.path ?: continue
            val json = DataMapItem.fromDataItem(event.dataItem).dataMap.getString("json") ?: continue

            // Persist safety-relevant state so it survives with no UI up.
            when (path) {
                WearPaths.BLOCK -> {
                    val incoming = BlockState.fromJson(json)
                    store.saveBlock(store.loadBlock().mergeWith(incoming))
                }
                WearPaths.SESSION -> nl.kb30.protocol.SessionSnapshot.fromJson(json)?.let(store::saveSession)
                WearPaths.SWINGS -> store.saveSwings(nl.kb30.protocol.SwingLedger.fromJson(json))
            }
            WearSync.routeState(path, json)
        }
    }

    override fun onMessageReceived(event: MessageEvent) {
        val payload = runCatching { Json.decodeObject(String(event.data)) }.getOrDefault(emptyMap())
        SyncBus.postControl(ControlEvent(event.path, payload))
    }
}
