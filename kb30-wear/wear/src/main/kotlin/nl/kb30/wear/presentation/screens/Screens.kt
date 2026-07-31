package nl.kb30.wear.presentation.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Chip
import androidx.wear.compose.material.ChipDefaults
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Stepper
import androidx.wear.compose.material.Text
import nl.kb30.protocol.PainLocation
import nl.kb30.protocol.PainRating
import nl.kb30.protocol.Segment
import nl.kb30.protocol.StopCriteria
import nl.kb30.protocol.TalkTest
import nl.kb30.wear.engine.UiState
import nl.kb30.wear.presentation.components.CenterColumn
import nl.kb30.wear.presentation.components.ExerciseIllustration
import nl.kb30.wear.presentation.components.PrimaryButton
import nl.kb30.wear.presentation.components.TimerRing
import nl.kb30.wear.presentation.components.formatTime
import nl.kb30.wear.presentation.theme.Danger
import nl.kb30.wear.presentation.theme.Good
import nl.kb30.wear.presentation.theme.RestBlue
import nl.kb30.wear.presentation.theme.WorkOrange

@Composable
fun TodayScreen(state: UiState, onStart: () -> Unit, onSettings: () -> Unit) {
    CenterColumn {
        Text("Vandaag", fontWeight = FontWeight.Bold, fontSize = 20.sp, color = Color.White)
        Text(
            "Klaar voor je beweegmoment?",
            fontSize = 13.sp, color = Color(0xFFB0BEC5),
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(vertical = 4.dp),
        )
        if (state.hrEnabled && state.hrBpm != null) {
            Text("♥ ${state.hrBpm}", fontSize = 12.sp, color = Color(0xFFB0BEC5))
        }
        Spacer(Modifier.height(6.dp))
        PrimaryButton("Start training", onStart)
        PrimaryButton("Instellingen", onSettings, color = Color(0xFF263238))
    }
}

@Composable
fun BlockedScreen(message: String, onContinueMobility: () -> Unit, onBack: () -> Unit) {
    val scroll = rememberScrollState()
    Column(
        Modifier.fillMaxSize().verticalScroll(scroll).padding(14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(20.dp))
        Text("Even opletten", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = WorkOrange)
        Text(message, fontSize = 13.sp, color = Color.White, textAlign = TextAlign.Center,
            modifier = Modifier.padding(vertical = 8.dp))
        PrimaryButton("Alleen mobiliteit", onContinueMobility, color = RestBlue)
        PrimaryButton("Terug", onBack, color = Color(0xFF263238))
        Spacer(Modifier.height(20.dp))
    }
}

@Composable
fun PlayerScreen(
    state: UiState,
    onPause: () -> Unit,
    onResume: () -> Unit,
    onSkip: () -> Unit,
    onSetDone: () -> Unit,
    onReportPain: () -> Unit,
    onEmergency: () -> Unit,
    ambient: Boolean = false,
) {
    val session = state.session ?: return
    val ex = session.current ?: return
    val isRest = session.segment == Segment.RUST
    val isPaused = session.segment == Segment.PAUZE
    val total = if (isRest) ex.restSec else ex.workSec
    val ringColor = if (isRest) RestBlue else WorkOrange
    val scroll = rememberScrollState()

    // Always-on Display: only the timer + exercise name, no health data, no buttons.
    if (ambient) {
        CenterColumn {
            TimerRing(session.remainingSec, total, Color.White,
                if (isRest) "RUST" else "WERK", ambient = true)
            Text(ex.naam, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color.White,
                textAlign = TextAlign.Center)
        }
        return
    }

    Column(
        Modifier.fillMaxSize().verticalScroll(scroll).padding(horizontal = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(6.dp))
        TimerRing(session.remainingSec, total, ringColor, if (isRest) "RUST" else "WERK")
        if (!isRest) ExerciseIllustration(ex.illustration, Modifier.padding(top = 2.dp))
        Text(ex.naam, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color.White,
            textAlign = TextAlign.Center)
        Text(ex.cue1, fontSize = 12.sp, color = Color(0xFFB0BEC5), textAlign = TextAlign.Center)
        Text(ex.cue2, fontSize = 12.sp, color = Color(0xFFB0BEC5), textAlign = TextAlign.Center)
        session.next?.let {
            Text("Straks: ${it.naam}", fontSize = 11.sp, color = Color(0xFF78909C),
                modifier = Modifier.padding(top = 2.dp))
        }
        if (state.hrEnabled) {
            Text(state.hrBpm?.let { "♥ $it" } ?: "♥ ${StopCriteria.geenMeting}",
                fontSize = 11.sp, color = Color(0xFF78909C))
        }
        Spacer(Modifier.height(6.dp))
        if (isPaused) PrimaryButton("Hervat", onResume, color = Good)
        else PrimaryButton("Pauze", onPause, color = Color(0xFF37474F))
        if (!isRest) PrimaryButton("Set klaar", onSetDone, color = Good)
        PrimaryButton("Overslaan", onSkip, color = Color(0xFF37474F))
        PrimaryButton("Pijn melden", onReportPain, color = Color(0xFF5D4037))
        EmergencyButton(onEmergency)
        Spacer(Modifier.height(10.dp))
    }
}

@Composable
fun SwingScreen(
    state: UiState,
    onTap: () -> Unit,
    onUndo: () -> Unit,
    onSetDone: () -> Unit,
    onEmergency: () -> Unit,
    ambient: Boolean = false,
) {
    val session = state.session
    val remaining = session?.remainingSec ?: 0
    if (ambient) {
        CenterColumn {
            Text("SWINGS", fontSize = 13.sp, color = Color.White, fontWeight = FontWeight.Bold)
            Text("${state.swingCount}", fontSize = 56.sp, color = Color.White,
                fontWeight = FontWeight.Bold)
            Text(formatTime(remaining), fontSize = 14.sp, color = Color.White)
        }
        return
    }
    Box(Modifier.fillMaxSize()) {
        // The whole screen is the tap target: tap = +1 swing.
        Box(
            Modifier.fillMaxSize().background(Color(0xFF0E1B2A)).clickable(onClick = onTap),
            contentAlignment = Alignment.Center,
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("SWINGS", fontSize = 13.sp, color = RestBlue, fontWeight = FontWeight.Bold)
                Text("${state.swingCount}", fontSize = 64.sp, color = Color.White,
                    fontWeight = FontWeight.Bold)
                Text("tik = +1   •   ${formatTime(remaining)}", fontSize = 11.sp,
                    color = Color(0xFF90A4AE))
            }
        }
        // Small, non-tap-area controls at the edges.
        Row(
            Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(bottom = 6.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
        ) {
            EdgeChip("Terug", onUndo, Color(0xFF37474F))
            EdgeChip("Klaar", onSetDone, Good)
            EdgeChip("STOP", onEmergency, Danger)
        }
    }
}

@Composable
private fun EdgeChip(label: String, onClick: () -> Unit, color: Color) {
    Chip(
        onClick = onClick,
        colors = ChipDefaults.chipColors(backgroundColor = color),
        label = { Text(label, fontSize = 11.sp, color = Color.White) },
    )
}

@Composable
fun PostExerciseScreen(onRating: (PainRating) -> Unit) {
    CenterColumn {
        Text("Hoe ging het?", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.White)
        Spacer(Modifier.height(4.dp))
        Row(horizontalArrangement = Arrangement.SpaceEvenly, modifier = Modifier.fillMaxWidth()) {
            EmojiButton("😊", Good) { onRating(PainRating.GOED) }
            EmojiButton("😐", Color(0xFF616161)) { onRating(PainRating.TWIJFEL) }
            EmojiButton("😣", Color(0xFF8D6E63)) { onRating(PainRating.PIJN) }
        }
    }
}

@Composable
private fun EmojiButton(emoji: String, color: Color, onClick: () -> Unit) {
    Box(
        Modifier
            .background(color, androidx.compose.foundation.shape.CircleShape)
            .clickable(onClick = onClick)
            .padding(14.dp),
        contentAlignment = Alignment.Center,
    ) { Text(emoji, fontSize = 26.sp) }
}

@Composable
fun PainLocationScreen(onLocation: (PainLocation) -> Unit) {
    val scroll = rememberScrollState()
    Column(
        Modifier.fillMaxSize().verticalScroll(scroll).padding(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(18.dp))
        Text("Waar?", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.White)
        PainLocation.entries.forEach { loc ->
            // Chest is intentionally styled as an alert — it goes straight to Stop.
            val col = if (loc == PainLocation.BORST) Danger else Color(0xFF37474F)
            PrimaryButton(loc.labelNl.replaceFirstChar { it.uppercase() }, { onLocation(loc) }, color = col)
        }
        Spacer(Modifier.height(18.dp))
    }
}

@Composable
fun RpeScreen(onRpe: (Int) -> Unit) {
    var value by remember { mutableStateOf(5) }
    Column(Modifier.fillMaxSize().padding(8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Hoe zwaar? (0–10)", fontSize = 13.sp, color = Color.White, textAlign = TextAlign.Center)
        Stepper(
            value = value,
            onValueChange = { value = it },
            valueProgression = 0..10,
            decreaseIcon = { Text("−", fontSize = 22.sp, color = Color.White) },
            increaseIcon = { Text("+", fontSize = 22.sp, color = Color.White) },
            modifier = Modifier.weight(1f),
        ) {
            Text("$value", fontSize = 34.sp, fontWeight = FontWeight.Bold, color = Color.White)
        }
        PrimaryButton("Bevestig", { onRpe(value) }, color = Good)
    }
}

@Composable
fun TalkTestScreen(onResult: (TalkTest) -> Unit) {
    val scroll = rememberScrollState()
    Column(
        Modifier.fillMaxSize().verticalScroll(scroll).padding(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(16.dp))
        Text("Kun je nog een hele zin zeggen?", fontSize = 13.sp, color = Color.White,
            textAlign = TextAlign.Center)
        Spacer(Modifier.height(6.dp))
        PrimaryButton("Ja", { onResult(TalkTest.JA) }, color = Good)
        PrimaryButton("Moeilijk", { onResult(TalkTest.MOEILIJK) }, color = WorkOrange)
        PrimaryButton("Nee", { onResult(TalkTest.NEE) }, color = Danger)
        Spacer(Modifier.height(16.dp))
    }
}

@Composable
fun RecoveryScreen(reason: String, onContinue: () -> Unit, onStop: () -> Unit) {
    val scroll = rememberScrollState()
    Column(
        Modifier.fillMaxSize().verticalScroll(scroll).padding(14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(18.dp))
        Text("Even rustig", fontWeight = FontWeight.Bold, fontSize = 17.sp, color = WorkOrange)
        Text(
            (if (reason.isNotBlank()) "$reason\n\n" else "") +
                "We nemen gas terug. Rust uit en ga pas door als het weer goed voelt.",
            fontSize = 13.sp, color = Color.White, textAlign = TextAlign.Center,
            modifier = Modifier.padding(vertical = 8.dp),
        )
        PrimaryButton("Rust & ga door", onContinue, color = RestBlue)
        PrimaryButton("Sessie stoppen", onStop, color = Color(0xFF37474F))
        Spacer(Modifier.height(18.dp))
    }
}

@Composable
fun StopScreen(onCall112: () -> Unit, onAcknowledge: () -> Unit) {
    val scroll = rememberScrollState()
    Column(
        Modifier.fillMaxSize().background(Color(0xFF2A0000)).verticalScroll(scroll).padding(14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(18.dp))
        Text(StopCriteria.titel, fontWeight = FontWeight.Bold, fontSize = 20.sp, color = Color.White,
            textAlign = TextAlign.Center)
        Text(StopCriteria.tekst, fontSize = 14.sp, color = Color.White, textAlign = TextAlign.Center,
            modifier = Modifier.padding(vertical = 8.dp))
        PrimaryButton("Bel 112", onCall112, color = Danger)
        Text(StopCriteria.naMeldingNl, fontSize = 11.sp, color = Color(0xFFEF9A9A),
            textAlign = TextAlign.Center, modifier = Modifier.padding(top = 8.dp))
        PrimaryButton("Begrepen", onAcknowledge, color = Color(0xFF37474F))
        Spacer(Modifier.height(18.dp))
    }
}

@Composable
fun SummaryScreen(state: UiState, onDismiss: () -> Unit) {
    val s = state.summary ?: return
    val scroll = rememberScrollState()
    Column(
        Modifier.fillMaxSize().verticalScroll(scroll).padding(14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(18.dp))
        Text("Sessie klaar 🎉", fontWeight = FontWeight.Bold, fontSize = 17.sp, color = Good)
        SummaryRow("Duur", formatTime(s.durationSec))
        SummaryRow("Oefeningen", "${s.exerciseNames.size}")
        SummaryRow("Swings", "${s.totalSwings}")
        SummaryRow("Gem. RPE", s.averageRpe?.let { "%.1f".format(it) } ?: "—")
        if (s.painReports.isNotEmpty()) {
            SummaryRow("Pijnmeldingen", "${s.painReports.size}")
        }
        Spacer(Modifier.height(6.dp))
        PrimaryButton("Klaar", onDismiss, color = Good)
        Spacer(Modifier.height(18.dp))
    }
}

@Composable
private fun SummaryRow(label: String, value: String) {
    Row(
        Modifier.fillMaxWidth().padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, fontSize = 13.sp, color = Color(0xFFB0BEC5))
        Text(value, fontSize = 13.sp, color = Color.White, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun SettingsScreen(
    state: UiState,
    onToggleHr: (Boolean) -> Unit,
    onResetBlock: () -> Unit,
    onBack: () -> Unit,
) {
    val scroll = rememberScrollState()
    Column(
        Modifier.fillMaxSize().verticalScroll(scroll).padding(14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(18.dp))
        Text("Instellingen", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.White)

        Text("Hartslag tonen", fontSize = 13.sp, color = Color.White,
            modifier = Modifier.padding(top = 8.dp))
        Text(StopCriteria.hartslagDisclaimer, fontSize = 10.sp, color = Color(0xFF90A4AE),
            textAlign = TextAlign.Center)
        PrimaryButton(
            if (state.hrEnabled) "Hartslag: AAN" else "Hartslag: UIT",
            { onToggleHr(!state.hrEnabled) },
            color = if (state.hrEnabled) Good else Color(0xFF37474F),
        )

        Spacer(Modifier.height(8.dp))
        val blocked = System.currentTimeMillis() < state.block.chestBlockUntilEpochMs
        if (blocked) {
            Text("Kettlebells 48u geblokkeerd", fontSize = 11.sp, color = Danger,
                textAlign = TextAlign.Center)
            PrimaryButton("Klachten weg — reset", onResetBlock, color = WorkOrange)
        }

        PrimaryButton("Terug", onBack, color = Color(0xFF263238))
        Spacer(Modifier.height(18.dp))
    }
}

@Composable
fun EmergencyButton(onEmergency: () -> Unit) {
    // Always visible during training. Big and red (hard rule #9).
    PrimaryButton("● NOODSTOP", onEmergency, color = Danger)
}
