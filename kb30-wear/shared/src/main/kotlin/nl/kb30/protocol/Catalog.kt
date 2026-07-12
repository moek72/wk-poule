package nl.kb30.protocol

/**
 * A small, offline catalog so the watch can build a default session on its own
 * (acceptance criterion: "training can be started from phone AND watch").
 *
 * This mirrors — but never replaces — the phone's exercise library. When the
 * phone is connected it pushes the authoritative session; this catalog is only
 * the fallback for a stand-alone watch start.
 *
 * Every exercise here obeys KB30's hard medical rules: standing only, no deep
 * squats, no deep forward bends, no overhead loading, max 8 kg. The forbidden
 * exercises simply do not exist here.
 */
object Catalog {

    // --- Phase 1 exercises (always available, no swings) --------------------
    private val deadlift = ExerciseRef(
        id = "kb_deadlift", naam = "KB Deadlift", cue1 = "Rug neutraal",
        cue2 = "Kracht uit de heupen", workSec = 40, restSec = 20, weightKg = 8,
        illustration = "deadlift",
    )
    private val boxSquat = ExerciseRef(
        id = "box_squat", naam = "Goblet Box Squat", cue1 = "Naar de stoel",
        cue2 = "Niet dieper", workSec = 40, restSec = 20, weightKg = 8,
        illustration = "squat",
    )
    private val farmerCarry = ExerciseRef(
        id = "farmer_carry", naam = "Farmer Carry", cue1 = "Schouders laag",
        cue2 = "Rustig lopen", workSec = 40, restSec = 20, weightKg = 8,
        illustration = "carry",
    )
    private val suitcaseCarry = ExerciseRef(
        id = "suitcase_carry", naam = "Suitcase Carry", cue1 = "Rechtop blijven",
        cue2 = "Niet zijwaarts hangen", workSec = 40, restSec = 20, weightKg = 8,
        illustration = "carry",
    )
    private val frontRackMarch = ExerciseRef(
        id = "front_rack_march", naam = "Front Rack March", cue1 = "Rechtop",
        cue2 = "Rustig tempo", workSec = 40, restSec = 20, weightKg = 4,
        illustration = "march",
    )
    private val shoulderPress = ExerciseRef(
        id = "shoulder_press", naam = "Shoulder Press", cue1 = "Pijnvrije baan",
        cue2 = "Niet omhoog kijken", workSec = 40, restSec = 20, weightKg = 4,
        neckShoulder = true, illustration = "press",
    )
    private val gobletMarch = ExerciseRef(
        id = "goblet_march", naam = "Goblet Standing March", cue1 = "Knie rustig omhoog",
        cue2 = "Rechtop", workSec = 40, restSec = 20, weightKg = 4,
        illustration = "march",
    )
    private val calfRaises = ExerciseRef(
        id = "calf_raises", naam = "Calf Raises", cue1 = "Hand aan de muur",
        cue2 = "Rustig omhoog", workSec = 40, restSec = 20, weightKg = 4,
        illustration = "calf",
    )
    private val woodChop = ExerciseRef(
        id = "wood_chop", naam = "Wood Chop hoog-midden", cue1 = "Klein bereik",
        cue2 = "Nooit naar de grond", workSec = 40, restSec = 20, weightKg = 4,
        illustration = "chop",
    )

    // --- Phase 2 (locked until unlocked) ------------------------------------
    val russianSwing = ExerciseRef(
        id = "russian_swing", naam = "Russian Swing", cue1 = "Kracht uit heupen",
        cue2 = "Max tot borsthoogte", workSec = 30, restSec = 30, isSwing = true,
        weightKg = 8, illustration = "swing",
    )

    // --- Mobility (recovery days) -------------------------------------------
    private val marchInPlace = ExerciseRef(
        id = "mob_march", naam = "Marcheren op de plaats", cue1 = "Rustig tempo",
        cue2 = "Adem door", workSec = 40, restSec = 20, weightKg = 0,
        illustration = "march",
    )
    private val shoulderRolls = ExerciseRef(
        id = "mob_shoulder", naam = "Schouderrolletjes", cue1 = "Klein rondje",
        cue2 = "Ontspannen", workSec = 30, restSec = 15, weightKg = 0,
        illustration = "generic",
    )
    private val hipCircles = ExerciseRef(
        id = "mob_hip", naam = "Heupcirkels", cue1 = "Kleine cirkel",
        cue2 = "Rug neutraal", workSec = 30, restSec = 15, weightKg = 0,
        illustration = "generic",
    )
    private val lightSuitcase = ExerciseRef(
        id = "mob_suitcase", naam = "Lichte Suitcase Carry", cue1 = "4 kg",
        cue2 = "Rechtop", workSec = 30, restSec = 20, weightKg = 4,
        illustration = "carry",
    )

    /** The 5 circuit exercises for a normal Phase-1 session. */
    private val phase1Circuit = listOf(
        deadlift, boxSquat, farmerCarry, gobletMarch, woodChop,
    )

    private val warmup = ExerciseRef(
        id = "warmup", naam = "Warming-up", cue1 = "Marcheren + armcirkels",
        cue2 = "Losmaken", workSec = 300, restSec = 0, weightKg = 0,
        illustration = "march",
    )
    private val cooldown = ExerciseRef(
        id = "cooldown", naam = "Cooling-down", cue1 = "Rustig marcheren",
        cue2 = "Staande stretches", workSec = 300, restSec = 0, weightKg = 0,
        illustration = "march",
    )

    /**
     * Build the ordered exercise list for a default watch-started session.
     *
     * @param type NORMAAL / LICHT / ALLEEN_MOBILITEIT.
     * @param swingsUnlocked whether Phase-2 swings may appear.
     * @param rounds circuit rounds (Phase-1 default is 3).
     */
    fun buildSession(
        type: SessionType,
        swingsUnlocked: Boolean,
        rounds: Int = 3,
    ): List<ExerciseRef> {
        if (type == SessionType.ALLEEN_MOBILITEIT) {
            // No warm-up gate needed for pure mobility, but keep it gentle & ordered.
            return listOf(marchInPlace, shoulderRolls, hipCircles, lightSuitcase, marchInPlace)
        }

        var circuit = phase1Circuit
        if (type == SessionType.LICHT) {
            // Light day: drop neck/shoulder-loading work.
            circuit = circuit.filterNot { it.neckShoulder }
        }
        if (swingsUnlocked) {
            // Swings replace at most ~1 of 5 slots (max ~20% of the circuit).
            circuit = listOf(russianSwing) + circuit.drop(1)
        }

        val out = ArrayList<ExerciseRef>()
        out += warmup // always first; cannot be silently skipped (enforced by engine)
        repeat(rounds.coerceIn(1, 4)) { out += circuit }
        out += cooldown
        return out
    }
}
