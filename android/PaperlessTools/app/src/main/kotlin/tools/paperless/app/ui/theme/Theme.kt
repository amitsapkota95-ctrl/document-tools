package tools.paperless.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = Forest,
    onPrimary = Color.White,
    primaryContainer = Forest50,
    onPrimaryContainer = Ink,
    secondary = ForestMuted,
    onSecondary = Color.White,
    background = Paper,
    onBackground = Ink,
    surface = Cream,
    onSurface = Ink,
    surfaceVariant = Cream200,
    onSurfaceVariant = SandLight,
    outline = Forest.copy(alpha = 0.15f),
)

@Composable
fun PaperlessTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = PaperlessTypography,
        content = content,
    )
}
