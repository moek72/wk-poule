plugins {
    id("com.android.application")
    kotlin("android")
}

android {
    namespace = "nl.kb30.phone"
    compileSdk = 34

    defaultConfig {
        applicationId = "nl.kb30.phone"
        minSdk = 26
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
}

dependencies {
    implementation(project(":shared"))
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity:1.9.0")
    implementation("androidx.webkit:webkit:1.11.0")
    implementation("com.google.android.gms:play-services-wearable:18.2.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.8.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}

// Bundle the KB30 PWA (kept in the repo at ../kb30-pwa) into the app assets so
// the phone app works fully offline. Served via WebViewAssetLoader over an https
// origin, so ES modules, IndexedDB and the service worker all function.
val pwaSrc = rootProject.projectDir.parentFile.resolve("kb30-pwa")
val syncPwa = tasks.register<Sync>("syncPwa") {
    from(pwaSrc)
    into(layout.projectDirectory.dir("src/main/assets/pwa"))
    exclude("**/.DS_Store")
}
tasks.named("preBuild") { dependsOn(syncPwa) }
