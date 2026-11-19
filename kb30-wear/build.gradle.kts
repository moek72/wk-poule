// Root build file. Plugin versions are declared here with `apply false`
// and applied in the module build files.
plugins {
    kotlin("jvm") version "1.9.24" apply false
    id("com.android.application") version "8.5.2" apply false
    kotlin("android") version "1.9.24" apply false
}
