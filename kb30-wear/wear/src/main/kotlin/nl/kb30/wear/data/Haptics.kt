package nl.kb30.wear.data

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

/**
 * Distinct vibration cues. The spec requires haptics at: work start, the last
 * 3 seconds, rest start, end of set, and any safety alert. Each gets its own
 * pattern so they're distinguishable without looking at the watch.
 */
class Haptics(context: Context) {

    private val vibrator: Vibrator? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
    } else {
        @Suppress("DEPRECATION")
        context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }

    private fun play(timings: LongArray, amplitudes: IntArray? = null) {
        val v = vibrator ?: return
        if (!v.hasVibrator()) return
        val effect = if (amplitudes != null && v.hasAmplitudeControl()) {
            VibrationEffect.createWaveform(timings, amplitudes, -1)
        } else {
            VibrationEffect.createWaveform(timings, -1)
        }
        v.vibrate(effect)
    }

    /** Firm single buzz — a work interval begins. */
    fun workStart() = play(longArrayOf(0, 220))

    /** Three short ticks — final 3-second countdown (call once per second). */
    fun tick() = play(longArrayOf(0, 60))

    /** Two soft buzzes — rest begins. */
    fun restStart() = play(longArrayOf(0, 120, 100, 120))

    /** Rising double — the set is done. */
    fun setEnd() = play(longArrayOf(0, 150, 80, 250))

    /** One tap — a swing was counted. */
    fun swingTick() = play(longArrayOf(0, 35))

    /** Long, urgent triple — a safety alert (recovery check / stop screen). */
    fun safetyAlert() = play(longArrayOf(0, 400, 150, 400, 150, 400))
}
