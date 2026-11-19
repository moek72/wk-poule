package nl.kb30.wear.presentation.theme

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.wear.compose.material.Colors
import androidx.wear.compose.material.MaterialTheme

// High-contrast palette. Work = orange, rest = blue (parity with the phone player).
val WorkOrange = Color(0xFFFF7A00)
val RestBlue = Color(0xFF1E88E5)
val Danger = Color(0xFFD32F2F)
val Good = Color(0xFF2E7D32)
val OnDark = Color(0xFFFFFFFF)
val SurfaceDark = Color(0xFF101314)

private val Kb30Colors = Colors(
    primary = Color(0xFF0E9C82),
    onPrimary = Color(0xFF00110D),
    secondary = RestBlue,
    onSecondary = OnDark,
    error = Danger,
    onError = OnDark,
    background = Color(0xFF000000),
    onBackground = OnDark,
    surface = SurfaceDark,
    onSurface = OnDark,
)

@Composable
fun Kb30Theme(content: @Composable () -> Unit) {
    MaterialTheme(colors = Kb30Colors, content = content)
}
