package tools.paperless.app.ui.features

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import tools.paperless.app.services.DiffKind
import tools.paperless.app.services.TextDiffService
import tools.paperless.app.ui.components.PaperlessTextField
import tools.paperless.app.ui.components.PrimaryButton
import tools.paperless.app.ui.components.PrivacyBadge
import tools.paperless.app.ui.theme.Cream
import tools.paperless.app.ui.theme.Forest50
import tools.paperless.app.ui.theme.Ink
import tools.paperless.app.ui.theme.Paper
import tools.paperless.app.ui.theme.PaperlessThemeValues
import tools.paperless.app.ui.theme.Sage
import tools.paperless.app.ui.theme.SandLight
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle

@Composable
fun CompareTextScreen() {
    var original by remember { mutableStateOf("") }
    var updated by remember { mutableStateOf("") }
    var showDiff by remember { mutableStateOf(false) }

    val diffResult = remember(original, updated, showDiff) {
        if (showDiff) TextDiffService.diffWords(original, updated) else null
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Paper)
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text("Paste two versions to compare word-by-word.", style = MaterialTheme.typography.bodyMedium, color = Ink)

        PaperlessTextField(
            value = original,
            onValueChange = { original = it },
            label = "Original",
            singleLine = false,
            minLines = 5,
        )

        PaperlessTextField(
            value = updated,
            onValueChange = { updated = it },
            label = "Updated",
            singleLine = false,
            minLines = 5,
        )

        PrimaryButton(
            title = "Compare Texts",
            isDisabled = original.isBlank() && updated.isBlank(),
            onClick = { showDiff = true },
        )

        diffResult?.let { (left, right, stats) ->
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Forest50, RoundedCornerShape(PaperlessThemeValues.CardCornerRadius.dp))
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    text = "${stats.similarity}% similar · +${stats.added} / -${stats.removed} words",
                    style = MaterialTheme.typography.titleMedium,
                    color = Ink,
                )
            }

            DiffPanel(title = "Original", parts = left)
            DiffPanel(title = "Updated", parts = right)
        }

        PrivacyBadge()
    }
}

@Composable
private fun DiffPanel(title: String, parts: List<tools.paperless.app.services.DiffPart>) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Cream, RoundedCornerShape(PaperlessThemeValues.CardCornerRadius.dp))
            .padding(16.dp),
    ) {
        Text(title, style = MaterialTheme.typography.titleMedium, color = Ink, modifier = Modifier.padding(bottom = 8.dp))
        Text(
            text = buildAnnotatedString {
                parts.forEach { part ->
                    val color = when (part.kind) {
                        DiffKind.UNCHANGED -> Ink
                        DiffKind.ADDED -> Sage
                        DiffKind.REMOVED -> Color.Red
                    }
                    val bg = when (part.kind) {
                        DiffKind.UNCHANGED -> Color.Transparent
                        DiffKind.ADDED -> Sage.copy(alpha = 0.15f)
                        DiffKind.REMOVED -> Color.Red.copy(alpha = 0.12f)
                    }
                    withStyle(SpanStyle(color = color, background = bg)) {
                        append(part.text)
                    }
                }
            },
            style = MaterialTheme.typography.bodyMedium,
        )
    }
}
