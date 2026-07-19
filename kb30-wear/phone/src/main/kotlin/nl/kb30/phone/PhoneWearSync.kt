package nl.kb30.phone

import android.content.Context
import android.util.Log
import com.google.android.gms.wearable.DataClient
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.MessageClient
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

/**
 * Phone-side Data Layer wrapper. Mirrors the watch's WearSync: retained state
 * items (session/block/swings) via DataClient, control/feedback via MessageClient.
 *
 * Incoming watch traffic is delivered to [onIncoming] as (path, jsonString) so
 * MainActivity can forward it straight into the PWA (window.onKb30Message).
 */
class PhoneWearSync(
    context: Context,
    private val onIncoming: (path: String, json: String) -> Unit,
) {
    private val dataClient: DataClient = Wearable.getDataClient(context)
    private val messageClient: MessageClient = Wearable.getMessageClient(context)
    private val nodeClient = Wearable.getNodeClient(context)
    private val scope = CoroutineScope(Dispatchers.Main.immediate)

    private val dataListener = DataClient.OnDataChangedListener { buffer -> handleData(buffer) }
    private val messageListener = MessageClient.OnMessageReceivedListener { msg ->
        onIncoming(msg.path, String(msg.data))
    }

    fun start() {
        dataClient.addListener(dataListener)
        messageClient.addListener(messageListener)
    }

    fun stop() {
        dataClient.removeListener(dataListener)
        messageClient.removeListener(messageListener)
    }

    /** Retained state (session/block/swings) from the PWA -> watch. */
    fun putState(path: String, json: String) {
        scope.launch {
            try {
                val req = PutDataMapRequest.create(path).apply {
                    dataMap.putString("json", json)
                    dataMap.putLong("ts", System.currentTimeMillis())
                }.asPutDataRequest().setUrgent()
                dataClient.putDataItem(req).await()
            } catch (e: Exception) {
                Log.w(TAG, "putState($path): ${e.message}")
            }
        }
    }

    /** Control/feedback messages from the PWA -> watch (best effort). */
    fun sendMessage(path: String, json: String) {
        scope.launch {
            try {
                val bytes = json.toByteArray()
                for (node in nodeClient.connectedNodes.await()) {
                    if (node.isNearby) messageClient.sendMessage(node.id, path, bytes).await()
                }
            } catch (e: Exception) {
                Log.w(TAG, "sendMessage($path): ${e.message}")
            }
        }
    }

    private fun handleData(buffer: DataEventBuffer) {
        for (event in buffer) {
            if (event.type != DataEvent.TYPE_CHANGED) continue
            val path = event.dataItem.uri.path ?: continue
            val json = DataMapItem.fromDataItem(event.dataItem).dataMap.getString("json") ?: continue
            onIncoming(path, json)
        }
    }

    private companion object { const val TAG = "Kb30PhoneSync" }
}
