package nl.kb30.protocol

/**
 * Offline verification harness for the safety-critical shared logic.
 *
 * Runnable without an Android SDK or a test framework:  `gradle :shared:run`.
 * The same assertions live as JUnit tests under src/test, but this main() is the
 * zero-dependency path that always works in a bare JVM sandbox.
 *
 * Exit code 0 = all gates hold, 1 = a gate failed.
 */

private var passed = 0
private var failed = 0

private fun check(name: String, cond: Boolean) {
    if (cond) { passed++; println("  ok   $name") }
    else { failed++; println("  FAIL $name") }
}

fun main() {
    val DAY = 20_000L                 // arbitrary epoch-day
    val NOW = DAY * 86_400_000L       // matching epoch-ms

    println("== JSON round-trips ==")
    run {
        val obj = linkedMapOf<String, Any?>(
            "naam" to "Chloé",           // UTF-8 with accent
            "n" to 42L,
            "f" to 3.5,
            "b" to true,
            "nil" to null,
            "list" to listOf(1L, 2L, 3L),
            "nested" to linkedMapOf("x" to "y\n\"z\""),
        )
        val round = Json.decodeObject(Json.encode(obj))
        check("string with accent survives", round["naam"] == "Chloé")
        check("long survives", round["n"] == 42L)
        check("double survives", round["f"] == 3.5)
        check("bool survives", round["b"] == true)
        check("null survives", round["nil"] == null)
        check("escaped nested string survives",
            (round["nested"] as Map<*, *>)["x"] == "y\n\"z\"")
    }

    println("== SwingLedger dedup & reconnect ==")
    run {
        val watch = SwingLedger()
        watch.add("watch"); watch.add("watch"); watch.add("watch")
        check("three taps count 3", watch.count == 3)
        watch.undoLast("watch")
        check("undo drops to 2", watch.count == 2)

        // Simulate the phone having received an earlier snapshot, then both
        // sides tapping while disconnected, then reconnecting (merge both ways).
        val phoneCopy = SwingLedger.fromJson(watch.toJson())
        watch.add("watch")                 // watch taps offline -> 3
        phoneCopy.add("phone")             // phone taps offline -> its own view 3
        val a = watch.copy().merge(phoneCopy)
        val b = phoneCopy.copy().merge(watch)
        check("merge is commutative", a.count == b.count)
        check("no double counting after reconnect (2+1 new taps = 4)", a.count == 4)

        // Merging repeatedly is idempotent.
        check("merge is idempotent", a.copy().merge(a).merge(phoneCopy).count == a.count)

        // Undo made on one side propagates through merge (tombstone wins).
        val w2 = SwingLedger(); val e = w2.add("watch"); w2.add("watch")
        val p2 = SwingLedger.fromJson(w2.toJson())   // p2 sees both
        w2.undoLast("watch")                          // w2 tombstones latest
        check("tombstone survives merge (no resurrection)",
            p2.merge(w2).count == 1)
        check("undo id was the latest", e == "watch:1")
    }

    println("== BlockState sync ==")
    run {
        val base = BlockState(swingsUnlocked = false, version = 1)
        val newer = base.copy(swingsUnlocked = true, version = 2)
        check("higher version wins", base.mergeWith(newer).swingsUnlocked)
        check("lower version ignored", newer.mergeWith(base).swingsUnlocked)
        val round = BlockState.fromJson(newer.toJson())
        check("blockstate round-trips", round == newer)
    }

    println("== SafetyGate: painkiller day ==")
    run {
        val block = BlockState(painkillerDay = DAY, painkillerTaken = true)
        val d = SafetyGate.evaluateStart(block, NOW, DAY)
        check("painkiller day blocks kettlebells", !d.kettlebellAllowed)
        check("painkiller forces mobility", d.forcedType == SessionType.ALLEEN_MOBILITEIT)
        check("painkiller reason", d.reason == BlockReason.PIJNSTILLER)
        // Different day -> allowed.
        val d2 = SafetyGate.evaluateStart(block, NOW, DAY + 1)
        check("painkiller only blocks that day", d2.kettlebellAllowed)
    }

    println("== SafetyGate: chest 48h block ==")
    run {
        var block = BlockState()
        block = SafetyGate.applyChestEvent(block, NOW)
        check("chest event arms a block", block.chestBlockUntilEpochMs > NOW)
        check("block is exactly 48h", block.chestBlockUntilEpochMs == NOW + SafetyGate.CHEST_BLOCK_MS)
        check("chest event bumps version", block.version == 1L)
        // Still blocked at +47h, free at +49h.
        val h47 = NOW + 47L * 3_600_000L
        val h49 = NOW + 49L * 3_600_000L
        check("blocked at +47h", !SafetyGate.evaluateStart(block, h47, DAY).kettlebellAllowed)
        check("free at +49h", SafetyGate.evaluateStart(block, h49, DAY + 3).kettlebellAllowed)
    }

    println("== SafetyGate: recovery & emergency ==")
    run {
        check("RPE 8 needs recovery", SafetyGate.needsRecoveryCheck(Rpe(8), TalkTest.JA))
        check("RPE 6 does not", !SafetyGate.needsRecoveryCheck(Rpe(6), TalkTest.JA))
        check("talk test Nee needs recovery", SafetyGate.needsRecoveryCheck(Rpe(3), TalkTest.NEE))
        check("no data -> no recovery", !SafetyGate.needsRecoveryCheck(null, null))
        check("chest pain is emergency",
            SafetyGate.isEmergency(emptySet(), PainLocation.BORST))
        check("stop symptom is emergency",
            SafetyGate.isEmergency(setOf(StopSymptom.DUIZELIGHEID), null))
        check("neck pain is not emergency",
            !SafetyGate.isEmergency(emptySet(), PainLocation.NEK))
    }

    println("== Catalog: session shaping ==")
    run {
        val normal = Catalog.buildSession(SessionType.NORMAAL, swingsUnlocked = false)
        check("warm-up is always first", normal.first().id == "warmup")
        check("cool-down is always last", normal.last().id == "cooldown")
        check("no swings when locked", normal.none { it.isSwing })
        check("all loads <= 8kg", normal.all { it.weightKg <= 8 })

        val light = Catalog.buildSession(SessionType.LICHT, swingsUnlocked = false)
        check("light session skips neck/shoulder work",
            light.none { it.neckShoulder })

        val unlocked = Catalog.buildSession(SessionType.NORMAAL, swingsUnlocked = true)
        check("swings appear once unlocked", unlocked.any { it.isSwing })

        val mob = Catalog.buildSession(SessionType.ALLEEN_MOBILITEIT, swingsUnlocked = true)
        check("mobility session never contains swings", mob.none { it.isSwing })
        check("mobility session has no heavy bells (<=4kg)", mob.all { it.weightKg <= 4 })
    }

    println("== SessionSnapshot round-trip ==")
    run {
        val snap = SessionSnapshot(
            sessionId = "s1",
            type = SessionType.NORMAAL,
            segment = Segment.WERK,
            exercises = Catalog.buildSession(SessionType.NORMAAL, false),
            index = 2,
            remainingSec = 37,
            running = true,
            swingCount = 12,
            updatedAtEpochMs = NOW,
            origin = "watch",
        )
        val round = SessionSnapshot.fromJson(snap.toJson())
        check("snapshot round-trips", round == snap)

        val summary = SessionSummary(
            sessionId = "s1", type = SessionType.NORMAAL, durationSec = 1490,
            exerciseNames = listOf("KB Deadlift", "Farmer Carry"),
            totalSwings = 12, averageRpe = 5.5,
            painReports = listOf("Deadlift: rug 😐"),
        )
        check("summary round-trips", SessionSummary.fromJson(summary.toJson()) == summary)
    }

    println()
    println("RESULT: $passed passed, $failed failed")
    if (failed > 0) kotlin.system.exitProcess(1)
}
