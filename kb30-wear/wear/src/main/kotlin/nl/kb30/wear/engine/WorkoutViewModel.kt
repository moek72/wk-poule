package nl.kb30.wear.engine

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import nl.kb30.protocol.BlockState
import nl.kb30.protocol.Catalog
import nl.kb30.protocol.ExerciseRef
import nl.kb30.protocol.PainLocation
import nl.kb30.protocol.PainRating
import nl.kb30.protocol.Rpe
import nl.kb30.protocol.SafetyGate
import nl.kb30.protocol.Segment
import nl.kb30.protocol.SessionSnapshot
import nl.kb30.protocol.SessionSummary
import nl.kb30.protocol.SessionType
import nl.kb30.protocol.StopSymptom
import nl.kb30.protocol.SwingLedger
import nl.kb30.protocol.TalkTest
import nl.kb30.protocol.WearPaths
import nl.kb30.wear.data.ControlEvent
import nl.kb30.wear.data.Haptics
import nl.kb30.wear.data.LocalStore
import nl.kb30.wear.data.SyncBus
import nl.kb30.wear.data.WearSync
import nl.kb30.wear.health.HeartRateController

/** Top-level screen the watch shows. One primary action per screen. */
enum class Screen {
    TODAY, BLOCKED, PLAYER, SWINGS, POST_EXERCISE, PAIN_LOCATION,
    RPE, TALK_TEST, RECOVERY, STOP, SUMMARY, SETTINGS
}

/** Immutable snapshot the UI renders. */
data class UiState(
    val screen: Screen = Screen.TODAY,
    val session: SessionSnapshot? = null,
    val swingCount: Int = 0,
    val block: BlockState = BlockState(),
    val blockedMessage: String = "",
    val hrEnabled: Boolean = false,
    val hrBpm: Int? = null,
    val connected: Boolean = false,
    val summary: SessionSummary? = null,
    val recoveryReason: String = "",
)

/**
 * The watch workout engine.
 *
 * Owns a local ticking timer so the session keeps running with or without the
 * phone (acceptance: "temporary connection loss causes no lost session", and
 * "workout stays usable without the watch/phone"). Control actions are applied
 * locally *and* mirrored to the phone; retained state (session/block/swings)
 * is written to the Data Layer so both sides reconcile.
 */
class WorkoutViewModel(app: Application) : AndroidViewModel(app) {

    private val store = LocalStore(app)
    private val sync = WearSync(app)
    private val haptics = Haptics(app)
    private val hr = HeartRateController(app)

    private val _ui = MutableStateFlow(UiState())
    val ui: StateFlow<UiState> = _ui.asStateFlow()

    private var ledger: SwingLedger = store.loadSwings()
    private var exercises: List<ExerciseRef> = emptyList()
    private var index = 0
    private var remaining = 0
    private var sessionId = ""
    private var sessionType = SessionType.NORMAAL
    private var sessionStartMs = 0L
    private var running = false
    private var isOwner = false
    private var tickJob: Job? = null

    // Feedback accumulators for the end-of-session summary.
    private val rpeValues = mutableListOf<Int>()
    private val painReports = mutableListOf<String>()
    private val doneNames = mutableListOf<String>()
    private var pendingRating: PainRating? = null
    private var midSetPainCheck = false

    init {
        val block = store.loadBlock()
        _ui.value = _ui.value.copy(block = block, hrEnabled = block.hrEnabled)
        observeBus()
    }

    // region lifecycle wiring ------------------------------------------------
    fun onResume() {
        sync.start()
        if (_ui.value.hrEnabled) startHr()
    }

    fun onPause() {
        sync.stop()
        persist()
    }

    private fun observeBus() {
        viewModelScope.launch {
            SyncBus.block.collect { incoming ->
                incoming ?: return@collect
                val merged = store.loadBlock().mergeWith(incoming)
                store.saveBlock(merged)
                _ui.value = _ui.value.copy(block = merged, hrEnabled = merged.hrEnabled)
            }
        }
        viewModelScope.launch {
            SyncBus.swings.collect { incoming ->
                incoming ?: return@collect
                ledger = ledger.copy().merge(incoming)
                store.saveSwings(ledger)
                _ui.value = _ui.value.copy(swingCount = ledger.count)
            }
        }
        viewModelScope.launch {
            SyncBus.session.collect { snap ->
                snap ?: return@collect
                if (!isOwner) adoptPhoneSession(snap)
            }
        }
        viewModelScope.launch {
            SyncBus.control.collect { handleControl(it) }
        }
        viewModelScope.launch {
            hr.bpm.collect { _ui.value = _ui.value.copy(hrBpm = it) }
        }
    }
    // endregion

    // region starting a session --------------------------------------------
    /**
     * Start a session from the watch. Runs the pre-session safety gate first;
     * a chest/painkiller block forces mobility-only (or shows the block screen).
     */
    fun startFromWatch(requestedType: SessionType = SessionType.NORMAAL) {
        val block = store.loadBlock()
        val nowMs = System.currentTimeMillis()
        val today = nowMs / 86_400_000L
        val decision = SafetyGate.evaluateStart(block, nowMs, today)

        if (!decision.kettlebellAllowed) {
            // Build a mobility session but hold behind the block screen until the
            // user acknowledges why (tapping "Alleen mobiliteit" starts it).
            prepareSession(SessionType.ALLEEN_MOBILITEIT, block.swingsUnlocked, owner = true)
            _ui.value = _ui.value.copy(screen = Screen.BLOCKED, blockedMessage = decision.messageNl)
        } else {
            prepareSession(requestedType, block.swingsUnlocked, owner = true)
            enterWork()
        }
    }

    /** Called from the BLOCKED screen to continue into the (mobility) session. */
    fun continueMobility() {
        _ui.value = _ui.value.copy(blockedMessage = "")
        enterWork()
    }

    private fun prepareSession(type: SessionType, swingsUnlocked: Boolean, owner: Boolean) {
        exercises = Catalog.buildSession(type, swingsUnlocked)
        index = 0
        sessionType = type
        sessionId = "w-${System.currentTimeMillis()}"
        sessionStartMs = System.currentTimeMillis()
        isOwner = owner
        rpeValues.clear(); painReports.clear(); doneNames.clear()
    }
    // endregion

    // region the timer -------------------------------------------------------
    private fun enterWork() {
        val ex = exercises.getOrNull(index) ?: run { finish(); return }
        remaining = ex.workSec
        running = true
        haptics.workStart()
        pushSnapshot(Segment.WERK)
        _ui.value = _ui.value.copy(screen = currentPlayerScreen())
        startTicking()
    }

    private fun enterRest() {
        val ex = exercises.getOrNull(index)
        remaining = ex?.restSec ?: 0
        running = true
        if (remaining <= 0) { advanceExercise(); return }
        haptics.restStart()
        pushSnapshot(Segment.RUST)
        _ui.value = _ui.value.copy(screen = Screen.PLAYER)
        startTicking()
    }

    private fun startTicking() {
        tickJob?.cancel()
        tickJob = viewModelScope.launch {
            while (running && remaining > 0) {
                delay(1000)
                if (!running) break
                remaining--
                if (remaining in 1..3) haptics.tick()
                pushSnapshot(currentSegment())
                if (remaining == 0) {
                    onIntervalElapsed()
                    break
                }
            }
        }
    }

    private fun onIntervalElapsed() {
        when (currentSegment()) {
            Segment.WERK -> {
                haptics.setEnd()
                val ex = exercises.getOrNull(index)
                // Warm-up / cool-down have no per-exercise feedback.
                if (ex == null || ex.id == "warmup") { advanceExercise(); return }
                if (ex.id == "cooldown") { finish(); return }
                running = false
                _ui.value = _ui.value.copy(screen = Screen.POST_EXERCISE)
            }
            Segment.RUST -> advanceExercise()
            else -> {}
        }
    }

    private fun advanceExercise() {
        exercises.getOrNull(index)?.let { doneNames.add(it.naam) }
        index++
        if (index >= exercises.size) { finish(); return }
        enterWork()
    }
    // endregion

    // region controls (local + mirrored) ------------------------------------
    fun pause() {
        running = false
        tickJob?.cancel()
        pushSnapshot(Segment.PAUZE)
        mirror(WearPaths.CTRL_PAUSE)
    }

    fun resume() {
        if (running) return
        running = true
        pushSnapshot(currentSegment())
        startTicking()
        mirror(WearPaths.CTRL_RESUME)
    }

    fun skipExercise() {
        mirror(WearPaths.CTRL_SKIP)
        tickJob?.cancel()
        running = false
        advanceExercise()
    }

    /** "Set klaar" — end the current work interval early and go to feedback. */
    fun setDone() {
        mirror(WearPaths.CTRL_SET_DONE)
        tickJob?.cancel()
        remaining = 0
        running = false
        onIntervalElapsed()
    }

    /** The always-visible emergency stop. Triggers the stop screen + 48h block. */
    fun emergencyStop() {
        triggerChestStop(local = true)
    }

    /** "Pijn melden" during a set: pause and open the pain-location check. */
    fun reportPainNow() {
        running = false
        tickJob?.cancel()
        midSetPainCheck = true
        pushSnapshotSilently(Segment.PAUZE)
        _ui.value = _ui.value.copy(screen = Screen.PAIN_LOCATION)
    }
    // endregion

    // region swings ----------------------------------------------------------
    fun addSwing() {
        ledger.add("watch")
        haptics.swingTick()
        persistSwings()
    }

    fun undoSwing() {
        ledger.undoLast("watch")
        persistSwings()
    }

    private fun persistSwings() {
        store.saveSwings(ledger)
        _ui.value = _ui.value.copy(swingCount = ledger.count)
        viewModelScope.launch { sync.putSwings(ledger) }
    }
    // endregion

    // region post-exercise feedback -----------------------------------------
    fun submitRating(rating: PainRating) {
        pendingRating = rating
        val ex = exercises.getOrNull(index)
        if (rating == PainRating.PIJN) {
            _ui.value = _ui.value.copy(screen = Screen.PAIN_LOCATION)
        } else {
            _ui.value = _ui.value.copy(screen = Screen.RPE)
        }
        ex?.let { mirror(WearPaths.PAIN_REPORT, mapOf("exerciseId" to it.id, "rating" to rating.name)) }
    }

    fun submitPainLocation(location: PainLocation) {
        val ex = exercises.getOrNull(index)
        // Chest pain is an immediate emergency: stop screen + 48h block.
        if (location == PainLocation.BORST) { triggerChestStop(local = true); return }
        painReports.add("${ex?.naam ?: "Oefening"}: ${location.labelNl} 😣")
        ex?.let { mirror(WearPaths.PAIN_REPORT, mapOf("exerciseId" to it.id, "location" to location.name)) }
        if (midSetPainCheck) {
            // Mid-set report (not chest): resume the set where we paused.
            midSetPainCheck = false
            resume()
            _ui.value = _ui.value.copy(screen = currentPlayerScreen())
        } else {
            _ui.value = _ui.value.copy(screen = Screen.RPE)
        }
    }

    fun submitRpe(value: Int) {
        val rpe = Rpe(value.coerceIn(0, 10))
        rpeValues.add(rpe.value)
        val ex = exercises.getOrNull(index)
        ex?.let { mirror(WearPaths.RPE, mapOf("exerciseId" to it.id, "value" to rpe.value)) }
        // Defer the recovery decision until after the talk test so both are known.
        _ui.value = _ui.value.copy(screen = Screen.TALK_TEST)
    }

    fun submitTalkTest(result: TalkTest) {
        val ex = exercises.getOrNull(index)
        ex?.let { mirror(WearPaths.TALK_TEST, mapOf("exerciseId" to it.id, "result" to result.name)) }
        val lastRpe = rpeValues.lastOrNull()?.let { Rpe(it) }
        if (SafetyGate.needsRecoveryCheck(lastRpe, result)) {
            haptics.safetyAlert()
            val reason = buildString {
                if (lastRpe?.tooHigh == true) append("RPE ${lastRpe.value} is hoog. ")
                if (result == TalkTest.NEE) append("Praten lukte niet meer. ")
            }.trim()
            _ui.value = _ui.value.copy(screen = Screen.RECOVERY, recoveryReason = reason)
        } else {
            enterRest()
        }
    }

    /** From the recovery screen: the user chooses to rest and continue gently. */
    fun recoveryContinue() = enterRest()

    /** From the recovery screen: the user chooses to end the session. */
    fun recoveryStopSession() = finish()
    // endregion

    // region emergency / block ----------------------------------------------
    private fun triggerChestStop(local: Boolean) {
        tickJob?.cancel()
        running = false
        haptics.safetyAlert()
        val nowMs = System.currentTimeMillis()
        val block = SafetyGate.applyChestEvent(store.loadBlock(), nowMs)
        store.saveBlock(block)
        _ui.value = _ui.value.copy(screen = Screen.STOP, block = block)
        viewModelScope.launch { sync.putBlock(block) }        // enforce on phone too
        if (local) mirror(WearPaths.CTRL_EMERGENCY, mapOf("kind" to "chest"))
        pushSnapshot(Segment.STOP)
    }

    fun reportSymptoms(symptoms: Set<StopSymptom>, painLocation: PainLocation?) {
        if (SafetyGate.isEmergency(symptoms, painLocation)) triggerChestStop(local = true)
    }

    fun acknowledgeStop() {
        // Stop screen dismissed -> back to Today. The 48h block stays armed.
        resetSessionState()
        _ui.value = _ui.value.copy(screen = Screen.TODAY)
    }
    // endregion

    // region finishing -------------------------------------------------------
    private fun finish() {
        tickJob?.cancel()
        running = false
        val durationSec = ((System.currentTimeMillis() - sessionStartMs) / 1000).toInt()
        val summary = SessionSummary(
            sessionId = sessionId,
            type = sessionType,
            durationSec = durationSec,
            exerciseNames = doneNames.toList(),
            totalSwings = ledger.count,
            averageRpe = rpeValues.takeIf { it.isNotEmpty() }?.average(),
            painReports = painReports.toList(),
        )
        _ui.value = _ui.value.copy(screen = Screen.SUMMARY, summary = summary)
        // The watch keeps no history; hand the finished session to the phone.
        viewModelScope.launch { sync.sendControl(WearPaths.SUMMARY, summary.toMap()) }
        store.saveSession(null)
    }

    fun dismissSummary() {
        resetSessionState()
        _ui.value = _ui.value.copy(screen = Screen.TODAY)
    }

    private fun resetSessionState() {
        isOwner = false
        running = false
        exercises = emptyList()
        index = 0
        remaining = 0
        _ui.value = _ui.value.copy(session = null, summary = null)
    }
    // endregion

    // region settings --------------------------------------------------------
    /** Enable/disable informational HR. Denied permission is handled by the UI. */
    fun setHrEnabled(enabled: Boolean, permissionGranted: Boolean) {
        val block = store.loadBlock().copy(hrEnabled = enabled && permissionGranted)
        val bumped = block.copy(version = block.version + 1)
        store.saveBlock(bumped)
        _ui.value = _ui.value.copy(block = bumped, hrEnabled = bumped.hrEnabled)
        if (bumped.hrEnabled) startHr() else hr.stop()
        viewModelScope.launch { sync.putBlock(bumped) }
    }

    /** Manual reset of the 48h chest block ("klachten weg / met arts besproken"). */
    fun resetChestBlock() {
        val block = store.loadBlock().copy(chestBlockUntilEpochMs = 0L)
        val bumped = block.copy(version = block.version + 1)
        store.saveBlock(bumped)
        _ui.value = _ui.value.copy(block = bumped)
        viewModelScope.launch { sync.putBlock(bumped) }
    }

    private fun startHr() = hr.start()

    fun openSettings() { _ui.value = _ui.value.copy(screen = Screen.SETTINGS) }
    fun backToToday() { _ui.value = _ui.value.copy(screen = Screen.TODAY) }
    // endregion

    // region phone mirroring -------------------------------------------------
    private fun handleControl(event: ControlEvent) {
        when (event.path) {
            WearPaths.CTRL_PAUSE -> if (running) { running = false; tickJob?.cancel(); pushSnapshotSilently(Segment.PAUZE) }
            WearPaths.CTRL_RESUME -> if (!running && exercises.isNotEmpty()) { running = true; startTicking() }
            WearPaths.CTRL_SKIP -> if (exercises.isNotEmpty()) { tickJob?.cancel(); running = false; advanceExercise() }
            WearPaths.CTRL_EMERGENCY -> triggerChestStop(local = false)
        }
    }

    private fun adoptPhoneSession(snap: SessionSnapshot) {
        // Render the phone-owned session read-only-ish; the phone drives the timer.
        exercises = snap.exercises
        index = snap.index
        remaining = snap.remainingSec
        running = snap.running
        sessionType = snap.type
        sessionId = snap.sessionId
        val screen = when (snap.segment) {
            Segment.STOP -> Screen.STOP
            Segment.KLAAR -> Screen.SUMMARY
            else -> currentPlayerScreen()
        }
        _ui.value = _ui.value.copy(screen = screen, session = snap, swingCount = ledger.count)
    }
    // endregion

    // region helpers ---------------------------------------------------------
    private fun currentSegment(): Segment =
        when (_ui.value.session?.segment) {
            Segment.RUST -> Segment.RUST
            else -> if (running) Segment.WERK else Segment.PAUZE
        }

    private fun currentPlayerScreen(): Screen =
        if (exercises.getOrNull(index)?.isSwing == true &&
            (_ui.value.session?.segment ?: Segment.WERK) == Segment.WERK
        ) Screen.SWINGS else Screen.PLAYER

    private fun snapshotNow(segment: Segment) = SessionSnapshot(
        sessionId = sessionId,
        type = sessionType,
        segment = segment,
        exercises = exercises,
        index = index,
        remainingSec = remaining,
        running = running,
        swingCount = ledger.count,
        updatedAtEpochMs = System.currentTimeMillis(),
        origin = "watch",
    )

    private fun pushSnapshot(segment: Segment) {
        val snap = snapshotNow(segment)
        _ui.value = _ui.value.copy(
            session = snap,
            swingCount = ledger.count,
            screen = if (segment == Segment.WERK) currentPlayerScreen() else _ui.value.screen,
        )
        store.saveSession(snap)
        if (isOwner) viewModelScope.launch { sync.putSession(snap) }
    }

    private fun pushSnapshotSilently(segment: Segment) {
        val snap = snapshotNow(segment)
        _ui.value = _ui.value.copy(session = snap)
        store.saveSession(snap)
    }

    private fun mirror(path: String, payload: Map<String, Any?> = emptyMap()) {
        viewModelScope.launch { sync.sendControl(path, payload) }
    }

    private fun persist() {
        store.saveSwings(ledger)
        _ui.value.session?.let { store.saveSession(it) }
    }
    // endregion

    override fun onCleared() {
        super.onCleared()
        tickJob?.cancel()
        hr.stop()
        sync.stop()
    }
}
