pluginManagement {
    repositories {
        gradlePluginPortal()
        google()
        mavenCentral()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "kb30-wear"

// :shared  -> pure-Kotlin/JVM module. Protocol + ALL safety-critical logic.
//             Contains no Android APIs, so it compiles and its tests run on a
//             plain JVM (this is where the medical gates are verified).
// :wear    -> the Wear OS (Android) companion app. Depends on :shared.
include(":shared")
include(":wear")
include(":phone")
