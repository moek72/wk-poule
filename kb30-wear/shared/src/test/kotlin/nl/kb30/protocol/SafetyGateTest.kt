package nl.kb30.protocol

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/** The medical gates are code, not advice — so they get pinned down here. */
class SafetyGateTest {

    private val day = 20_000L
    private val now = day * 86_400_000L

    @Test fun painkillerDayBlocksKettlebells() {
        val block = BlockState(painkillerDay = day, painkillerTaken = true)
        val d = SafetyGate.evaluateStart(block, now, day)
        assertFalse(d.kettlebellAllowed)
        assertEquals(SessionType.ALLEEN_MOBILITEIT, d.forcedType)
        assertEquals(BlockReason.PIJNSTILLER, d.reason)
    }

    @Test fun painkillerOnlyBlocksThatDay() {
        val block = BlockState(painkillerDay = day, painkillerTaken = true)
        assertTrue(SafetyGate.evaluateStart(block, now, day + 1).kettlebellAllowed)
    }

    @Test fun chestEventArms48hBlock() {
        val block = SafetyGate.applyChestEvent(BlockState(), now)
        assertEquals(now + SafetyGate.CHEST_BLOCK_MS, block.chestBlockUntilEpochMs)
        assertFalse(SafetyGate.evaluateStart(block, now + 47L * 3_600_000L, day).kettlebellAllowed)
        assertTrue(SafetyGate.evaluateStart(block, now + 49L * 3_600_000L, day + 3).kettlebellAllowed)
    }

    @Test fun rpe8OrTalkTestNeeTriggersRecovery() {
        assertTrue(SafetyGate.needsRecoveryCheck(Rpe(8), TalkTest.JA))
        assertTrue(SafetyGate.needsRecoveryCheck(Rpe(3), TalkTest.NEE))
        assertFalse(SafetyGate.needsRecoveryCheck(Rpe(6), TalkTest.JA))
        assertFalse(SafetyGate.needsRecoveryCheck(null, null))
    }

    @Test fun chestPainAndStopSymptomsAreEmergencies() {
        assertTrue(SafetyGate.isEmergency(emptySet(), PainLocation.BORST))
        assertTrue(SafetyGate.isEmergency(setOf(StopSymptom.HARTKLOPPINGEN), null))
        assertFalse(SafetyGate.isEmergency(emptySet(), PainLocation.NEK))
    }

    @Test fun heartRateIsNeverAnEmergencyInput() {
        // There is deliberately no StopSymptom or API that turns a HR reading into
        // an emergency or an "all clear". This test documents that contract.
        assertFalse(StopSymptom.entries.any { it.name.contains("HART", ignoreCase = true) && it.name.contains("SLAG", ignoreCase = true) })
    }
}
