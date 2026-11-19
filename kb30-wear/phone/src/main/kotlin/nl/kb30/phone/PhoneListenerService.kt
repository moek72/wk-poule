package nl.kb30.phone

import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService
import nl.kb30.protocol.BlockState
import nl.kb30.protocol.PainLocation
import nl.kb30.protocol.SafetyGate
import nl.kb30.protocol.Json
import nl.kb30.protocol.WearPaths

/**
 * Background relay: keeps the safety block state correct even when the KB30 UI
 * is not up. A chest complaint from the watch must arm the 48h block on the
 * phone immediately, regardless of whether the WebView is alive.
 */
class PhoneListenerService : WearableListenerService() {

    private val store by lazy { PhoneStore(applicationContext) }

    override fun onDataChanged(buffer: DataEventBuffer) {
        for (event in buffer) {
            if (event.type != DataEvent.TYPE_CHANGED) continue
            val path = event.dataItem.uri.path ?: continue
            if (path != WearPaths.BLOCK) continue
            val json = DataMapItem.fromDataItem(event.dataItem).dataMap.getString("json") ?: continue
            val merged = store.loadBlock().mergeWith(BlockState.fromJson(json))
            store.saveBlock(merged)
        }
    }

    override fun onMessageReceived(event: MessageEvent) {
        val payload = runCatching { Json.decodeObject(String(event.data)) }.getOrDefault(emptyMap())
        val isChest = event.path == WearPaths.CTRL_EMERGENCY ||
            (event.path == WearPaths.PAIN_REPORT &&
                PainLocation.fromKey(payload["location"]?.toString()) == PainLocation.BORST)
        if (isChest) {
            val blocked = SafetyGate.applyChestEvent(store.loadBlock(), System.currentTimeMillis())
            store.saveBlock(blocked)
        }
    }
}
