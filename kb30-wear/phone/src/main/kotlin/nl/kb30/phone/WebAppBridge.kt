package nl.kb30.phone

import android.webkit.JavascriptInterface
import nl.kb30.protocol.BlockState
import nl.kb30.protocol.WearPaths

/**
 * The object exposed to the PWA as `window.KB30Bridge`. The PWA calls these to
 * push state / control to the watch. Safety-relevant state (the block) is also
 * persisted natively so it survives with no WebView up.
 *
 * Note: methods are invoked on a WebView binder thread, not the UI thread.
 */
class WebAppBridge(
    private val sync: PhoneWearSync,
    private val store: PhoneStore,
) {
    @JavascriptInterface
    fun putData(path: String, json: String) {
        if (path == WearPaths.BLOCK) {
            // Persist + merge so a block set in the PWA is enforced natively too.
            runCatching {
                val incoming = BlockState.fromJson(json)
                store.saveBlock(store.loadBlock().mergeWith(incoming))
            }
        }
        sync.putState(path, json)
    }

    @JavascriptInterface
    fun sendMessage(path: String, json: String) {
        sync.sendMessage(path, json)
    }
}
