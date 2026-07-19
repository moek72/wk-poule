package nl.kb30.wear.data

import android.content.Context
import android.util.Log
import com.google.android.gms.wearable.DataClient
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.MessageClient
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.tasks.await
import nl.kb30.protocol.BlockState
import nl.kb30.protocol.Json
import nl.kb30.protocol.SessionSnapshot
import nl.kb30.protocol.SwingLedger
import nl.kb30.protocol.WearPaths

/**
 * Thin wrapper over the Wear OS Data Layer.
 *
 *  - **State** (session, block, swings) travels as retained DataClient items so
 *    it reconciles automatically after a disconnect.
 *  - **Control** (start/pause/skip/emergency/feedback) travels as MessageClient
 *    messages: best-effort, because the retained state is what actually keeps
 *    the two sides consistent.
 *
 * Nothing here sends raw sensor data anywhere; heart rate is never put on the
 * Data Layer.
 */
class WearSync(context: Context) {

    private val dataClient: DataClient = Wearable.getDataClient(context)
    private val messageClient: MessageClient = Wearable.getMessageClient(context)
    private val nodeClient = Wearable.getNodeClient(context)

    private val dataListener = DataClient.OnDataChangedListener { buffer -> handleData(buffer) }
    private val messageListener = MessageClient.OnMessageReceivedListener { msg ->
        handleMessage(msg.path, msg.data)
    }

    /** Attach live listeners while the UI is in the foreground. */
    fun start() {
        dataClient.addListener(dataListener)
        messageClient.addListener(messageListener)
    }

    fun stop() {
        dataClient.removeListener(dataListener)
        messageClient.removeListener(messageListener)
    }

    // --- Outbound state (retained) -----------------------------------------
    suspend fun putSession(snapshot: SessionSnapshot) =
        putJson(WearPaths.SESSION, snapshot.toJson())

    suspend fun putBlock(block: BlockState) =
        putJson(WearPaths.BLOCK, block.toJson())

    suspend fun putSwings(ledger: SwingLedger) =
        putJson(WearPaths.SWINGS, ledger.toJson())

    private suspend fun putJson(path: String, json: String) {
        try {
            val req = PutDataMapRequest.create(path).apply {
                dataMap.putString("json", json)
                // Force a byte change so identical-looking updates still sync.
                dataMap.putLong("ts", System.currentTimeMillis())
            }.asPutDataRequest().setUrgent()
            dataClient.putDataItem(req).await()
        } catch (e: Exception) {
            Log.w(TAG, "putJson($path) failed: ${e.message}")
        }
    }

    // --- Outbound control (best-effort) ------------------------------------
    suspend fun sendControl(path: String, payload: Map<String, Any?> = emptyMap()) {
        val bytes = Json.encode(payload).toByteArray()
        try {
            val nodes = nodeClient.connectedNodes.await()
            for (node in nodes) {
                if (!node.isNearby) continue
                messageClient.sendMessage(node.id, path, bytes).await()
            }
        } catch (e: Exception) {
            Log.w(TAG, "sendControl($path) failed: ${e.message}")
        }
    }

    private fun handleData(buffer: DataEventBuffer) {
        for (event in buffer) {
            if (event.type != DataEvent.TYPE_CHANGED) continue
            val item = event.dataItem
            val json = DataMapItem.fromDataItem(item).dataMap.getString("json") ?: continue
            routeState(item.uri.path ?: "", json)
        }
    }

    private fun handleMessage(path: String, data: ByteArray) {
        if (path.startsWith("/kb30/ctrl") || path == WearPaths.PAIN_REPORT ||
            path == WearPaths.RPE || path == WearPaths.TALK_TEST
        ) {
            val payload = runCatching { Json.decodeObject(String(data)) }.getOrDefault(emptyMap())
            SyncBus.postControl(ControlEvent(path, payload))
        } else {
            routeState(path, String(data))
        }
    }

    companion object {
        private const val TAG = "Kb30WearSync"

        /** Route a retained-state payload to the [SyncBus]. Shared by fg + bg paths. */
        fun routeState(path: String, json: String) {
            when (path) {
                WearPaths.SESSION -> SessionSnapshot.fromJson(json)?.let(SyncBus::postSession)
                WearPaths.BLOCK -> SyncBus.postBlock(BlockState.fromJson(json))
                WearPaths.SWINGS -> SyncBus.postSwings(SwingLedger.fromJson(json))
            }
        }
    }
}
