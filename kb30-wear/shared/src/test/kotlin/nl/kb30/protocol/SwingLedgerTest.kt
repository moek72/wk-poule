package nl.kb30.protocol

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class SwingLedgerTest {

    @Test fun tapsAndUndo() {
        val l = SwingLedger()
        l.add("watch"); l.add("watch"); l.add("watch")
        assertEquals(3, l.count)
        l.undoLast("watch")
        assertEquals(2, l.count)
        l.undoLast("watch"); l.undoLast("watch")
        assertNull(l.undoLast("watch")) // nothing left to undo
        assertEquals(0, l.count)
    }

    @Test fun reconnectDoesNotDoubleCount() {
        val watch = SwingLedger()
        repeat(2) { watch.add("watch") }
        val phone = SwingLedger.fromJson(watch.toJson()) // phone has the 2
        watch.add("watch")  // offline tap on watch
        phone.add("phone")  // offline tap on phone
        val merged = watch.copy().merge(phone)
        assertEquals(4, merged.count)
        // Order-independent and idempotent.
        assertEquals(4, phone.copy().merge(watch).count)
        assertEquals(4, merged.copy().merge(watch).merge(phone).count)
    }

    @Test fun undoSurvivesMerge() {
        val a = SwingLedger(); a.add("watch"); a.add("watch")
        val b = SwingLedger.fromJson(a.toJson()) // b sees both
        a.undoLast("watch")                       // a tombstones the second
        assertEquals(1, b.merge(a).count)         // tombstone wins, no resurrection
    }
}
