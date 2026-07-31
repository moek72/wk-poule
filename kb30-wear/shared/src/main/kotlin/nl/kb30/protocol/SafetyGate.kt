package nl.kb30.protocol

/** Why a kettlebell session cannot start (or is forced to mobility only). */
enum class BlockReason { GEEN, PIJNSTILLER, BORST_48U }

/** Result of the pre-session safety evaluation. */
data class StartDecision(
    val kettlebellAllowed: Boolean,
    val reason: BlockReason,
    /** If not null, the session type the user is forced into. */
    val forcedType: SessionType?,
    val messageNl: String,
)

/**
 * The emergency / stop-criteria symptoms. Any of these — or pain reported at the
 * chest — routes straight to the full stop screen and the 48h block. Heart-rate
 * data is intentionally NOT in this list: a sensor reading may never, on its own,
 * declare an emergency or declare the user safe.
 */
enum class StopSymptom(val labelNl: String) {
    BORST_PIJN("Pijn of druk op de borst"),
    UITSTRALING("Uitstraling naar arm, kaak of rug"),
    DUIZELIGHEID("Duizeligheid"),
    KORTADEMIGHEID("Abnormale kortademigheid"),
    HARTKLOPPINGEN("Hartkloppingen");
}

/**
 * Pure, deterministic safety logic. No Android, no clock access — the caller
 * passes `nowMs` and `todayEpochDay`. This is the module that unit tests pin
 * down, because these gates are code, not advice (see KB30 CLAUDE.md).
 */
object SafetyGate {

    /** 48 hours in millis — the KB block after a chest/stop event. */
    const val CHEST_BLOCK_MS: Long = 48L * 60L * 60L * 1000L

    /**
     * Decide whether a kettlebell session may start.
     *
     * Order of precedence: an active chest block wins, then a painkiller day.
     * In both cases KB is blocked and only mobility is offered.
     */
    fun evaluateStart(
        block: BlockState,
        nowMs: Long,
        todayEpochDay: Long,
    ): StartDecision {
        if (nowMs < block.chestBlockUntilEpochMs) {
            return StartDecision(
                kettlebellAllowed = false,
                reason = BlockReason.BORST_48U,
                forcedType = SessionType.ALLEEN_MOBILITEIT,
                messageNl = "Na een borstklacht rusten de kettlebells 48 uur. " +
                    "Vandaag alleen rustige mobiliteit. Klachten weg of met de arts " +
                    "besproken? Reset dit bij Instellingen.",
            )
        }
        if (block.painkillerDay == todayEpochDay && block.painkillerTaken) {
            return StartDecision(
                kettlebellAllowed = false,
                reason = BlockReason.PIJNSTILLER,
                forcedType = SessionType.ALLEEN_MOBILITEIT,
                messageNl = "Je gaf aan vandaag pijnstillers te hebben genomen. " +
                    "Die maskeren juist de signalen waar we op letten. Vandaag geen " +
                    "kettlebells — alleen mobiliteit.",
            )
        }
        return StartDecision(
            kettlebellAllowed = true,
            reason = BlockReason.GEEN,
            forcedType = null,
            messageNl = "",
        )
    }

    /**
     * A chest complaint (or chest pain report) begins immediately: same stop
     * screen and same 48h block on watch and phone. Returns the updated block
     * state with the block armed and a bumped version so it wins on sync.
     */
    fun applyChestEvent(block: BlockState, nowMs: Long): BlockState =
        block.copy(
            chestBlockUntilEpochMs = nowMs + CHEST_BLOCK_MS,
            version = block.version + 1,
        )

    /**
     * RPE 8–10 or talk test "Nee" must stop the current set and open a recovery
     * check. This does NOT itself declare an emergency — it de-escalates.
     */
    fun needsRecoveryCheck(rpe: Rpe?, talk: TalkTest?): Boolean =
        (rpe != null && rpe.tooHigh) || talk == TalkTest.NEE

    /**
     * True when the reported situation is an emergency stop criterion: any stop
     * symptom selected, or pain located at the chest.
     */
    fun isEmergency(symptoms: Set<StopSymptom>, painLocation: PainLocation?): Boolean =
        symptoms.isNotEmpty() || painLocation == PainLocation.BORST
}
