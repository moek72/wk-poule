package nl.kb30.protocol

/**
 * Domain model shared by the watch and the phone bridge.
 *
 * IMPORTANT (medical): nothing in this file lets heart rate drive intensity or
 * progression. Intensity is expressed only through [Rpe] and [TalkTest].
 */

/** The kind of session, decided by the daily check-in (on phone or watch). */
enum class SessionType {
    /** Full kettlebell circuit. */
    NORMAAL,

    /** Reduced circuit — skips neck/shoulder-loading exercises. */
    LICHT,

    /** No kettlebell load at all; mobility only. Forced when blocked. */
    ALLEEN_MOBILITEIT;

    companion object {
        fun fromKey(key: String?): SessionType =
            entries.firstOrNull { it.name == key } ?: NORMAAL
    }
}

/** High-level part of the session. */
enum class Phase { WARMING_UP, CIRCUIT, COOLING_DOWN }

/** Where pain is felt. CHEST is special: it forces the stop-criteria screen. */
enum class PainLocation(val labelNl: String) {
    NEK("nek"),
    SCHOUDER("schouder"),
    RUG("rug"),
    BORST("borst"),
    ANDERS("anders");

    companion object {
        fun fromKey(key: String?): PainLocation? = entries.firstOrNull { it.name == key }
    }
}

/** Per-exercise wellbeing rating shown after each exercise. */
enum class PainRating(val emoji: String, val labelNl: String) {
    GOED("😊", "goed"),
    TWIJFEL("😐", "twijfel"),
    PIJN("😣", "pijn");

    companion object {
        fun fromKey(key: String?): PainRating? = entries.firstOrNull { it.name == key }
    }
}

/** Talk test — the primary intensity guardrail alongside RPE. */
enum class TalkTest(val labelNl: String) {
    JA("Ja"),
    MOEILIJK("Moeilijk"),
    NEE("Nee");

    companion object {
        fun fromKey(key: String?): TalkTest? = entries.firstOrNull { it.name == key }
    }
}

/** Borg-style rate of perceived exertion, 0..10. Target band is 4..6. */
@JvmInline
value class Rpe(val value: Int) {
    init { require(value in 0..10) { "RPE moet 0..10 zijn" } }
    val tooHigh: Boolean get() = value >= 8
}

/**
 * A minimal reference to an exercise, enough for the watch to render it.
 * The phone (the source of truth) owns the full library; the watch keeps only
 * this trimmed shape so it can also start a session on its own when offline.
 */
data class ExerciseRef(
    val id: String,
    val naam: String,
    val cue1: String,
    val cue2: String,
    val workSec: Int,
    val restSec: Int,
    val isSwing: Boolean = false,
    val weightKg: Int = 0,
    /** Loads neck/shoulder — skipped in a LICHT session. */
    val neckShoulder: Boolean = false,
    val illustration: String = "generic",
) {
    fun toMap(): Map<String, Any?> = linkedMapOf(
        "id" to id,
        "naam" to naam,
        "cue1" to cue1,
        "cue2" to cue2,
        "workSec" to workSec,
        "restSec" to restSec,
        "isSwing" to isSwing,
        "weightKg" to weightKg,
        "neckShoulder" to neckShoulder,
        "illustration" to illustration,
    )

    companion object {
        fun fromMap(m: Map<String, Any?>): ExerciseRef = ExerciseRef(
            id = m["id"].asStr(),
            naam = m["naam"].asStr(),
            cue1 = m["cue1"].asStr(),
            cue2 = m["cue2"].asStr(),
            workSec = m["workSec"].asInt(40),
            restSec = m["restSec"].asInt(20),
            isSwing = m["isSwing"].asBool(),
            weightKg = m["weightKg"].asInt(),
            neckShoulder = m["neckShoulder"].asBool(),
            illustration = m["illustration"].asStr("generic"),
        )
    }
}
