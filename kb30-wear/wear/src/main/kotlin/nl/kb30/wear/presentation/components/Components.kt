package nl.kb30.wear.presentation.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.ButtonDefaults
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text
import nl.kb30.wear.R

/** Round-screen centred content column. */
@Composable
fun CenterColumn(
    modifier: Modifier = Modifier,
    content: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        content = content,
    )
}

/** Large, high-contrast primary action — big tap target for sweaty hands. */
@Composable
fun PrimaryButton(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    color: Color = MaterialTheme.colors.primary,
    textColor: Color = Color.White,
) {
    Button(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        colors = ButtonDefaults.buttonColors(backgroundColor = color),
    ) {
        Text(
            label,
            color = textColor,
            fontWeight = FontWeight.Bold,
            fontSize = 16.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(vertical = 6.dp),
        )
    }
}

/** A progress ring with a big mm:ss timer in the centre. Also used on AOD. */
@Composable
fun TimerRing(
    remainingSec: Int,
    totalSec: Int,
    ringColor: Color,
    label: String,
    modifier: Modifier = Modifier,
    ambient: Boolean = false,
) {
    val fraction = if (totalSec > 0) remainingSec.toFloat() / totalSec else 0f
    Box(contentAlignment = Alignment.Center, modifier = modifier.size(140.dp)) {
        if (!ambient) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val stroke = 10.dp.toPx()
                val arcSize = Size(size.width - stroke, size.height - stroke)
                drawArc(
                    color = Color(0x33FFFFFF),
                    startAngle = -90f, sweepAngle = 360f, useCenter = false,
                    topLeft = androidx.compose.ui.geometry.Offset(stroke / 2, stroke / 2),
                    size = arcSize, style = Stroke(width = stroke, cap = StrokeCap.Round),
                )
                drawArc(
                    color = ringColor,
                    startAngle = -90f, sweepAngle = -360f * fraction, useCenter = false,
                    topLeft = androidx.compose.ui.geometry.Offset(stroke / 2, stroke / 2),
                    size = arcSize, style = Stroke(width = stroke, cap = StrokeCap.Round),
                )
            }
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                label,
                color = if (ambient) Color.White else ringColor,
                fontWeight = FontWeight.Bold, fontSize = 14.sp,
            )
            Text(
                formatTime(remainingSec),
                color = Color.White, fontWeight = FontWeight.Bold, fontSize = 40.sp,
            )
        }
    }
}

@Composable
fun ExerciseIllustration(key: String, modifier: Modifier = Modifier) {
    val res = when (key) {
        "swing" -> R.drawable.fig_swing
        "carry" -> R.drawable.fig_carry
        else -> R.drawable.fig_generic
    }
    Image(
        painter = painterResource(res),
        contentDescription = null,
        modifier = modifier
            .size(56.dp)
            .clip(androidx.compose.foundation.shape.CircleShape),
    )
}

fun formatTime(sec: Int): String {
    val s = sec.coerceAtLeast(0)
    return "%d:%02d".format(s / 60, s % 60)
}
