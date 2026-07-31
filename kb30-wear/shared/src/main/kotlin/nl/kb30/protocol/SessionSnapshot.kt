package nl.kb30.protocol

/** Which sub-screen of the player the session is currently in. */
enum class Segment {
    WERK,           // active work interval
    RUST,           // rest interval
    PAUZE,          // user-paused
    NA_OEFENING,    // post-exercise emoji feedback
    HERSTEL_CHECK,  // recovery check (RPE 8-10 or talk test "Nee")
    KLAAR,          // session finished (summary)
    STOP;           // emergency stop screen

    companion object {
        fun fromKey(key: String?): Segment = entries.firstOrNull { it.name == key } ?: WERK
    }
}

/**
 * The authoritative, retained session state. Whichever device owns the running
 * session writes this; the other renders from it. On reconnect the newer
 * [updatedAtEpochMs] wins, so a brief disconnect never loses the session — both
 * sides keep their local timer running and then reconcile to this snapshot.
 */
data class SessionSnapshot(
    val sessionId: String,
    val type: SessionType,
    val segment: Segment,
    val exercises: List<ExerciseRef>,
    val index: Int,
    /** Seconds remaining on the current work/rest interval. */
    val remainingSec: Int,
    val running: Boolean,
    val swingCount: Int,
    val updatedAtEpochMs: Long,
    /** "watch" or "phone" — who last wrote this. */
    val origin: String,
) {
    val current: ExerciseRef? get() = exercises.getOrNull(index)
    val next: ExerciseRef? get() = exercises.getOrNull(index + 1)
    val isFinished: Boolean get() = segment == Segment.KLAAR || index >= exercises.size

    fun toMap(): Map<String, Any?> = linkedMapOf(
        "sessionId" to sessionId,
        "type" to type.name,
        "segment" to segment.name,
        "exercises" to exercises.map { it.toMap() },
        "index" to index,
        "remainingSec" to remainingSec,
        "running" to running,
        "swingCount" to swingCount,
        "updatedAtEpochMs" to updatedAtEpochMs,
        "origin" to origin,
    )

    fun toJson(): String = Json.encode(toMap())

    companion object {
        @Suppress("UNCHECKED_CAST")
        fun fromMap(m: Map<String, Any?>): SessionSnapshot {
            val ex = (m["exercises"] as? List<Any?>)?.mapNotNull {
                (it as? Map<String, Any?>)?.let(ExerciseRef::fromMap)
            } ?: emptyList()
            return SessionSnapshot(
                sessionId = m["sessionId"].asStr(),
                type = SessionType.fromKey(m["type"].asStr()),
                segment = Segment.fromKey(m["segment"].asStr()),
                exercises = ex,
                index = m["index"].asInt(),
                remainingSec = m["remainingSec"].asInt(),
                running = m["running"].asBool(),
                swingCount = m["swingCount"].asInt(),
                updatedAtEpochMs = m["updatedAtEpochMs"].asLong(),
                origin = m["origin"].asStr(),
            )
        }

        fun fromJson(json: String): SessionSnapshot? =
            try { fromMap(Json.decodeObject(json)) } catch (_: Exception) { null }
    }
}

/** End-of-session summary sent to the phone for permanent local storage. */
data class SessionSummary(
    val sessionId: String,
    val type: SessionType,
    val durationSec: Int,
    val exerciseNames: List<String>,
    val totalSwings: Int,
    val averageRpe: Double?,        // null when no RPE was entered
    val painReports: List<String>,  // human-readable, e.g. "Deadlift: nek 😣"
) {
    fun toMap(): Map<String, Any?> = linkedMapOf(
        "sessionId" to sessionId,
        "type" to type.name,
        "durationSec" to durationSec,
        "exerciseNames" to exerciseNames,
        "totalSwings" to totalSwings,
        "averageRpe" to averageRpe,
        "painReports" to painReports,
    )

    fun toJson(): String = Json.encode(toMap())

    companion object {
        @Suppress("UNCHECKED_CAST")
        fun fromMap(m: Map<String, Any?>): SessionSummary = SessionSummary(
            sessionId = m["sessionId"].asStr(),
            type = SessionType.fromKey(m["type"].asStr()),
            durationSec = m["durationSec"].asInt(),
            exerciseNames = (m["exerciseNames"] as? List<Any?>)?.map { it.asStr() } ?: emptyList(),
            totalSwings = m["totalSwings"].asInt(),
            averageRpe = (m["averageRpe"] as? Double) ?: (m["averageRpe"] as? Long)?.toDouble(),
            painReports = (m["painReports"] as? List<Any?>)?.map { it.asStr() } ?: emptyList(),
        )

        fun fromJson(json: String): SessionSummary? =
            try { fromMap(Json.decodeObject(json)) } catch (_: Exception) { null }
    }
}
