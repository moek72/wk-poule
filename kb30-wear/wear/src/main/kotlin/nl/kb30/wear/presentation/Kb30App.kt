package nl.kb30.wear.presentation

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.wear.compose.material.Scaffold
import androidx.wear.compose.material.TimeText
import androidx.wear.compose.material.Vignette
import androidx.wear.compose.material.VignettePosition
import nl.kb30.wear.engine.Screen
import nl.kb30.wear.engine.WorkoutViewModel
import nl.kb30.wear.presentation.screens.BlockedScreen
import nl.kb30.wear.presentation.screens.PainLocationScreen
import nl.kb30.wear.presentation.screens.PlayerScreen
import nl.kb30.wear.presentation.screens.PostExerciseScreen
import nl.kb30.wear.presentation.screens.RecoveryScreen
import nl.kb30.wear.presentation.screens.RpeScreen
import nl.kb30.wear.presentation.screens.SettingsScreen
import nl.kb30.wear.presentation.screens.StopScreen
import nl.kb30.wear.presentation.screens.SummaryScreen
import nl.kb30.wear.presentation.screens.SwingScreen
import nl.kb30.wear.presentation.screens.TalkTestScreen
import nl.kb30.wear.presentation.screens.TodayScreen
import nl.kb30.wear.presentation.theme.Kb30Theme

/**
 * Single-activity router. Each [Screen] maps to exactly one composable with one
 * primary action, per the round-screen design rules.
 */
@Composable
fun Kb30App(
    vm: WorkoutViewModel,
    onEnableHrRequest: () -> Unit,
    onCall112: () -> Unit,
    ambient: Boolean = false,
) {
    val state by vm.ui.collectAsStateWithLifecycle()

    Kb30Theme {
        Scaffold(
            modifier = Modifier.fillMaxSize(),
            timeText = { if (state.screen != Screen.SWINGS) TimeText() },
            vignette = { Vignette(vignettePosition = VignettePosition.TopAndBottom) },
        ) {
            when (state.screen) {
                Screen.TODAY -> TodayScreen(
                    state = state,
                    onStart = { vm.startFromWatch() },
                    onSettings = { vm.openSettings() },
                )

                Screen.BLOCKED -> BlockedScreen(
                    message = state.blockedMessage,
                    onContinueMobility = { vm.continueMobility() },
                    onBack = { vm.backToToday() },
                )

                Screen.PLAYER -> PlayerScreen(
                    state = state,
                    ambient = ambient,
                    onPause = { vm.pause() },
                    onResume = { vm.resume() },
                    onSkip = { vm.skipExercise() },
                    onSetDone = { vm.setDone() },
                    onReportPain = { vm.reportPainNow() },
                    onEmergency = { vm.emergencyStop() },
                )

                Screen.SWINGS -> SwingScreen(
                    state = state,
                    ambient = ambient,
                    onTap = { vm.addSwing() },
                    onUndo = { vm.undoSwing() },
                    onSetDone = { vm.setDone() },
                    onEmergency = { vm.emergencyStop() },
                )

                Screen.POST_EXERCISE -> PostExerciseScreen(onRating = { vm.submitRating(it) })
                Screen.PAIN_LOCATION -> PainLocationScreen(onLocation = { vm.submitPainLocation(it) })
                Screen.RPE -> RpeScreen(onRpe = { vm.submitRpe(it) })
                Screen.TALK_TEST -> TalkTestScreen(onResult = { vm.submitTalkTest(it) })

                Screen.RECOVERY -> RecoveryScreen(
                    reason = state.recoveryReason,
                    onContinue = { vm.recoveryContinue() },
                    onStop = { vm.recoveryStopSession() },
                )

                Screen.STOP -> StopScreen(
                    onCall112 = onCall112,
                    onAcknowledge = { vm.acknowledgeStop() },
                )

                Screen.SUMMARY -> SummaryScreen(state = state, onDismiss = { vm.dismissSummary() })

                Screen.SETTINGS -> SettingsScreen(
                    state = state,
                    onToggleHr = { enable ->
                        if (enable) onEnableHrRequest() else vm.setHrEnabled(false, permissionGranted = false)
                    },
                    onResetBlock = { vm.resetChestBlock() },
                    onBack = { vm.backToToday() },
                )
            }
        }
    }
}
