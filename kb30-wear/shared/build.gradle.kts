plugins {
    kotlin("jvm")
    application
}

// The shared module is deliberately dependency-free (Kotlin stdlib only).
// That keeps the safety-critical logic portable AND lets its tests run on any
// plain JVM without downloading Android or a test framework.
dependencies {
    testImplementation(kotlin("test"))
}

kotlin {
    jvmToolchain(17)
}

// `gradle :shared:run` executes the offline self-test harness (nl.kb30.protocol.VerifyKt).
// This is used to verify the medical gates without an Android SDK present.
application {
    mainClass.set("nl.kb30.protocol.VerifyKt")
}

tasks.test {
    useJUnitPlatform()
}
