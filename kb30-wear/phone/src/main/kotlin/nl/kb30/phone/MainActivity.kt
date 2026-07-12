package nl.kb30.phone

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.webkit.WebViewAssetLoader
import org.json.JSONObject

/**
 * Hosts the KB30 PWA in a WebView and bridges it to the watch.
 *
 * The PWA is served from bundled assets over an https virtual origin
 * (WebViewAssetLoader), so ES modules, IndexedDB and the service worker all work
 * and the app is fully offline. `window.KB30Bridge` gives the PWA a path to the
 * Wear Data Layer; incoming watch traffic is pushed back in via
 * `window.onKb30Message` / `window.onKb30Connected`.
 */
class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private lateinit var sync: PhoneWearSync
    private lateinit var store: PhoneStore

    private val assetLoader by lazy {
        WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        store = PhoneStore(this)
        sync = PhoneWearSync(this) { path, json -> forwardToPwa(path, json) }

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            @Suppress("DEPRECATION")
            settings.databaseEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.allowFileAccess = false
            settings.allowContentAccess = false

            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView, request: WebResourceRequest,
                ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)

                override fun shouldOverrideUrlLoading(
                    view: WebView, request: WebResourceRequest,
                ): Boolean {
                    val url = request.url
                    // tel: links (Bel 112) open the dialer; never auto-dial.
                    if (url.scheme == "tel") {
                        startActivity(Intent(Intent.ACTION_DIAL, url))
                        return true
                    }
                    return false
                }
            }
            addJavascriptInterface(WebAppBridge(sync, store), "KB30Bridge")
        }
        setContentView(webView)

        webView.loadUrl("https://appassets.androidplatform.net/assets/pwa/index.html")
    }

    private fun forwardToPwa(path: String, json: String) {
        runOnUiThread {
            val p = JSONObject.quote(path)
            val j = JSONObject.quote(json)
            webView.evaluateJavascript(
                "window.onKb30Message && window.onKb30Message($p, $j);", null,
            )
        }
    }

    override fun onResume() {
        super.onResume()
        sync.start()
        webView.evaluateJavascript("window.onKb30Connected && window.onKb30Connected(true);", null)
    }

    override fun onPause() {
        super.onPause()
        sync.stop()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }
}
