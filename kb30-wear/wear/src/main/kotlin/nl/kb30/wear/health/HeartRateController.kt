package nl.kb30.wear.health

import android.content.Context
import androidx.health.services.client.HealthServices
import androidx.health.services.client.MeasureCallback
import androidx.health.services.client.data.Availability
import androidx.health.services.client.data.DataPointContainer
import androidx.health.services.client.data.DataType
import androidx.health.services.client.data.DataTypeAvailability
import androidx.health.services.client.data.DeltaDataType
import androidx.health.services.client.unregisterMeasureCallback
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * OPTIONAL, informational heart rate.
 *
 * Hard contract (KB30 medical rules):
 *  - Default OFF. Only ever started after the user enables it AND grants
 *    BODY_SENSORS. Denial must not block the workout.
 *  - The value is display-only. Nothing in the app reads [bpm] to change weight,
 *    rounds, work time, progression, or to declare an emergency / "all clear".
 *  - When no reliable value is available, we surface `null` ("geen meting") and
 *    never interpolate or fabricate a number.
 *
 * The user takes Metoprolol, so exertion HR may be blunted — hence RPE and the
 * talk test are the only intensity signals.
 */
class HeartRateController(context: Context) {

    private val measureClient = HealthServices.getClient(context).measureClient
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    /** Latest bpm, or null for "geen meting". Never a guessed value. */
    private val _bpm = MutableStateFlow<Int?>(null)
    val bpm: StateFlow<Int?> = _bpm.asStateFlow()

    private var registered = false

    private val callback = object : MeasureCallback {
        override fun onAvailabilityChanged(dataType: DeltaDataType<*, *>, availability: Availability) {
            // If the sensor can't produce a trustworthy value, show "geen meting".
            if (availability is DataTypeAvailability && availability != DataTypeAvailability.AVAILABLE) {
                _bpm.value = null
            }
        }

        override fun onDataReceived(data: DataPointContainer) {
            val points = data.getData(DataType.HEART_RATE_BPM)
            val latest = points.lastOrNull()?.value
            // Health Services reports 0.0 when there is no contact/lock — treat as no reading.
            _bpm.value = if (latest != null && latest > 0.0) latest.toInt() else null
        }
    }

    /** Call only when enabled + permission granted. Safe to call twice. */
    fun start() {
        if (registered) return
        registered = true
        measureClient.registerMeasureCallback(DataType.HEART_RATE_BPM, callback)
    }

    fun stop() {
        if (!registered) return
        registered = false
        _bpm.value = null
        scope.launch {
            runCatching { measureClient.unregisterMeasureCallback(DataType.HEART_RATE_BPM, callback) }
        }
    }
}
