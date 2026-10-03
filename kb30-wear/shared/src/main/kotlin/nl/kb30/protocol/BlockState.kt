package nl.kb30.protocol

/**
 * Shared safety/gate state. This is the one piece of state that MUST be
 * identical on phone and watch, because either device can trigger a block and
 * both must then enforce it — even while disconnected. It is small and syncs as
 * a single Data Layer item.
 *
 * All timestamps are epoch-millis; days are epoch-day (days since 1970-01-01,
 * caller-provided so this stays clock/timezone-agnostic and testable).
 */
data class BlockState(
    /** KB sessions blocked until this instant after a chest event (0 = none). 48h rule. */
    val chestBlockUntilEpochMs: Long = 0L,

    /** Epoch-day on which painkillers were reported taken (-1 = none recorded). */
    val painkillerDay: Long = -1L,

    /** Whether painkillers were taken on [painkillerDay]. */
    val painkillerTaken: Boolean = false,

    /** Phase-2 swings unlocked? Mirrors the phone's progression gate. */
    val swingsUnlocked: Boolean = false,

    /** Optional heart-rate registration. Default OFF and never drives intensity. */
    val hrEnabled: Boolean = false,

    /** Monotonic version for last-writer-wins conflict resolution on sync. */
    val version: Long = 0L,
) {
    fun toMap(): Map<String, Any?> = linkedMapOf(
        "chestBlockUntilEpochMs" to chestBlockUntilEpochMs,
        "painkillerDay" to painkillerDay,
        "painkillerTaken" to painkillerTaken,
        "swingsUnlocked" to swingsUnlocked,
        "hrEnabled" to hrEnabled,
        "version" to version,
    )

    fun toJson(): String = Json.encode(toMap())

    /** Merge two block states; the higher [version] wins outright. */
    fun mergeWith(other: BlockState): BlockState =
        if (other.version >= version) other else this

    companion object {
        fun fromMap(m: Map<String, Any?>): BlockState = BlockState(
            chestBlockUntilEpochMs = m["chestBlockUntilEpochMs"].asLong(),
            painkillerDay = m["painkillerDay"].asLong(-1L),
            painkillerTaken = m["painkillerTaken"].asBool(),
            swingsUnlocked = m["swingsUnlocked"].asBool(),
            hrEnabled = m["hrEnabled"].asBool(),
            version = m["version"].asLong(),
        )

        fun fromJson(json: String): BlockState =
            try { fromMap(Json.decodeObject(json)) } catch (_: Exception) { BlockState() }
    }
}
