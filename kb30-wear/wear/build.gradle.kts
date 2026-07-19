plugins {
    id("com.android.application")
    kotlin("android")
}

android {
    namespace = "nl.kb30.wear"
    compileSdk = 34

    defaultConfig {
        applicationId = "nl.kb30.wear"
        minSdk = 30            // Wear OS 3 (Galaxy Watch 4+)
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }

    buildFeatures { compose = true }
    composeOptions { kotlinCompilerExtensionVersion = "1.5.14" } // matches Kotlin 1.9.24
    packaging { resources.excludes += "/META-INF/{AL2.0,LGPL2.1}" }
}

dependencies {
    implementation(project(":shared"))

    // Wear + Compose
    implementation(platform("androidx.compose:compose-bom:2024.06.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.wear.compose:compose-material:1.3.1")
    implementation("androidx.wear.compose:compose-foundation:1.3.1")
    implementation("androidx.wear.compose:compose-navigation:1.3.1")
    implementation("androidx.activity:activity-compose:1.9.0")
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.2")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.2")

    // Always-on Display (ambient) support
    implementation("androidx.wear:wear:1.3.0")

    // Phone <-> watch Data Layer
    implementation("com.google.android.gms:play-services-wearable:18.2.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.8.1")

    // Optional, informational heart rate only (default OFF).
    // We use the coroutine (suspend) extensions rather than the *Async APIs, so
    // no Guava ListenableFuture leaks onto the compile classpath.
    implementation("androidx.health:health-services-client:1.0.0-rc02")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1")

    debugImplementation("androidx.compose.ui:ui-tooling")
}
