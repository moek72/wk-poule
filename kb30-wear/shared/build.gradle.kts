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

// Target Java 17 bytecode using whatever JDK runs Gradle (>= 17), rather than
// pinning a 17 toolchain that would need to be downloaded/provisioned.
java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}
tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
    kotlinOptions.jvmTarget = "17"
}

// `gradle :shared:run` executes the offline self-test harness (nl.kb30.protocol.VerifyKt).
// This is used to verify the medical gates without an Android SDK present.
application {
    mainClass.set("nl.kb30.protocol.VerifyKt")
}

tasks.test {
    useJUnitPlatform()
}
