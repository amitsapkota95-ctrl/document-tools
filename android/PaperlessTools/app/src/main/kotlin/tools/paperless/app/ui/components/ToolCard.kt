package tools.paperless.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import tools.paperless.app.models.ToolDefinition
import tools.paperless.app.ui.theme.Cream
import tools.paperless.app.ui.theme.Forest
import tools.paperless.app.ui.theme.Ink
import tools.paperless.app.ui.theme.PaperlessThemeValues
import tools.paperless.app.ui.theme.SandLight

@Composable
fun ToolCard(
    tool: ToolDefinition,
    modifier: Modifier = Modifier,
    isAvailable: Boolean = true,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(PaperlessThemeValues.CardCornerRadius.dp))
            .background(Cream)
            .border(1.dp, Forest.copy(alpha = if (isAvailable) 0.15f else 0.08f), RoundedCornerShape(PaperlessThemeValues.CardCornerRadius.dp))
            .padding(14.dp),
    ) {
        Text(
            text = tool.title,
            style = MaterialTheme.typography.titleMedium,
            color = if (isAvailable) Ink else SandLight,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )
        Text(
            text = tool.description,
            style = MaterialTheme.typography.labelMedium,
            color = SandLight,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.padding(top = 4.dp),
        )
    }
}
