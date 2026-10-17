package nl.kb30.protocol

/**
 * Conflict-free swing counter.
 *
 * Acceptance criterion: "swing counter syncs without double counting", and
 * "temporary connection loss causes no lost session". A naive `count += 1` on
 * each side breaks the moment the watch and phone reconnect and re-exchange
 * totals. So instead every tap is a distinct, immutable **event** identified by
 * `"$origin:$seq"`, and the ledger is a small CRDT (an OR/2P-set):
 *
 *  - [added]   : every swing event ever recorded (grow-only).
 *  - [removed] : tombstones for events undone by the user (grow-only).
 *  - count     = |added \ removed|.
 *
 * Merging two ledgers is just the union of both sets on both fields, which is
 * commutative, associative and idempotent — so any order or number of reconnect
 * exchanges converges to the same count, with no double counting and no lost
 * undo. Sequence numbers are monotonic per origin, so an undone event is never
 * resurrected by a later merge.
 */
class SwingLedger private constructor(
    private val added: MutableSet<String>,
    private val removed: MutableSet<String>,
) {
    constructor() : this(LinkedHashSet(), LinkedHashSet())

    /** Current, de-duplicated swing count. */
    val count: Int
        get() = added.count { it !in removed }

    /** Next unused sequence number for [origin]. */
    private fun nextSeq(origin: String): Long {
        var max = 0L
        val prefix = "$origin:"
        for (id in added) {
            if (id.startsWith(prefix)) {
                val seq = id.substring(prefix.length).toLongOrNull() ?: continue
                if (seq > max) max = seq
            }
        }
        return max + 1
    }

    /** Record one swing tap from [origin]. Returns the event id created. */
    fun add(origin: String): String {
        val id = "$origin:${nextSeq(origin)}"
        added.add(id)
        return id
    }

    /**
     * Undo the most recent still-active swing from [origin] (matches the watch's
     * per-device undo button). Returns the tombstoned event id, or null if there
     * was nothing to undo for that origin.
     */
    fun undoLast(origin: String): String? {
        val prefix = "$origin:"
        val candidate = added
            .asSequence()
            .filter { it.startsWith(prefix) && it !in removed }
            .maxByOrNull { it.substring(prefix.length).toLongOrNull() ?: -1 }
            ?: return null
        removed.add(candidate)
        return candidate
    }

    /** Fold another ledger into this one. Commutative / idempotent. */
    fun merge(other: SwingLedger): SwingLedger {
        added.addAll(other.added)
        removed.addAll(other.removed)
        return this
    }

    fun copy(): SwingLedger =
        SwingLedger(LinkedHashSet(added), LinkedHashSet(removed))

    fun toMap(): Map<String, Any?> = linkedMapOf(
        "added" to added.toList(),
        "removed" to removed.toList(),
    )

    fun toJson(): String = Json.encode(toMap())

    companion object {
        @Suppress("UNCHECKED_CAST")
        fun fromMap(m: Map<String, Any?>): SwingLedger {
            val added = (m["added"] as? List<Any?>)?.map { it.asStr() } ?: emptyList()
            val removed = (m["removed"] as? List<Any?>)?.map { it.asStr() } ?: emptyList()
            return SwingLedger(LinkedHashSet(added), LinkedHashSet(removed))
        }

        fun fromJson(json: String): SwingLedger =
            try { fromMap(Json.decodeObject(json)) } catch (_: Exception) { SwingLedger() }
    }
}
