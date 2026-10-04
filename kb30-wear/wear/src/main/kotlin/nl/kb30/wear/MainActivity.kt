package nl.kb30.wear

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.content.ContextCompat
import androidx.wear.ambient.AmbientLifecycleObserver
import nl.kb30.wear.engine.WorkoutViewModel
import nl.kb30.wear.presentation.Kb30App

class MainActivity : ComponentActivity() {

    private val vm: WorkoutViewModel by viewModels()

    // Recomposes the tree when ambient (Always-on Display) toggles.
    private var ambient by mutableStateOf(false)

    // BODY_SENSORS is requested ONLY when the user turns on informational HR.
    private val requestHrPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            // Denial must not block the workout — we just leave HR off.
            vm.setHrEnabled(enabled = granted, permissionGranted = granted)
        }

    private val ambientObserver = AmbientLifecycleObserver(
        this,
        object : AmbientLifecycleObserver.AmbientLifecycleCallback {
            override fun onEnterAmbient(ambientDetails: AmbientLifecycleObserver.AmbientDetails) {
                ambient = true
            }

            override fun onExitAmbient() {
                ambient = false
            }
        },
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        lifecycle.addObserver(ambientObserver)
        // Screen stays on during training (parity with the PWA Wake Lock).
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        setContent {
            Kb30App(
                vm = vm,
                ambient = ambient,
                onEnableHrRequest = ::enableHeartRate,
                onCall112 = ::dial112,
            )
        }
    }

    override fun onResume() {
        super.onResume()
        vm.onResume()
    }

    override fun onPause() {
        super.onPause()
        vm.onPause()
    }

    private fun enableHeartRate() {
        val granted = ContextCompat.checkSelfPermission(this, Manifest.permission.BODY_SENSORS) ==
            PackageManager.PERMISSION_GRANTED
        if (granted) vm.setHrEnabled(enabled = true, permissionGranted = true)
        else requestHrPermission.launch(Manifest.permission.BODY_SENSORS)
    }

    private fun dial112() {
        // Never auto-dials; opens the dialer pre-filled so the user confirms.
        runCatching {
            startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:112")))
        }
    }
}
