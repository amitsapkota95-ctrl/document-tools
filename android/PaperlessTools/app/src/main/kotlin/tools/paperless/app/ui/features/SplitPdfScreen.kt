package tools.paperless.app.ui.features

import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import tools.paperless.app.services.PdfService
import tools.paperless.app.services.SplitMode
import tools.paperless.app.ui.components.PaperlessTextField
import tools.paperless.app.ui.components.PrimaryButton
import tools.paperless.app.ui.components.PrivacyBadge
import tools.paperless.app.ui.components.ProcessingOverlay
import tools.paperless.app.ui.theme.Cream
import tools.paperless.app.ui.theme.Ink
import tools.paperless.app.ui.theme.Paper
import tools.paperless.app.ui.theme.PaperlessThemeValues
import tools.paperless.app.ui.util.rememberSinglePdfPicker
import tools.paperless.app.ui.util.shareFile

@Composable
fun SplitPdfScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var pdfUri by remember { mutableStateOf<Uri?>(null) }
    var splitMode by remember { mutableStateOf(SplitMode.EVERY_PAGE) }
    var interval by remember { mutableIntStateOf(2) }
    var results by remember { mutableStateOf<List<Pair<String, Uri>>>(emptyList()) }
    var isProcessing by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val pickPdf = rememberSinglePdfPicker { uri ->
        pdfUri = uri
        results = emptyList()
        errorMessage = null
    }

    Box(Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Paper)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            PrimaryButton(title = "Select PDF", onClick = pickPdf)
            pdfUri?.let {
                Text("Selected: ${it.lastPathSegment}", style = MaterialTheme.typography.bodyMedium, color = Ink)
            }

            SplitMode.entries.forEach { mode ->
                FilterChip(
                    selected = splitMode == mode,
                    onClick = { splitMode = mode },
                    label = { Text(mode.label) },
                )
            }

            if (splitMode == SplitMode.BY_INTERVAL) {
                PaperlessTextField(
                    value = interval.toString(),
                    onValueChange = { interval = it.toIntOrNull() ?: 1 },
                    label = "Pages per file",
                )
            }

            errorMessage?.let { Text(it, color = androidx.compose.ui.graphics.Color.Red) }

            PrimaryButton(
                title = "Split PDF",
                icon = Icons.Default.ContentCut,
                isDisabled = pdfUri == null,
                isLoading = isProcessing,
                onClick = {
                    val uri = pdfUri ?: return@PrimaryButton
                    scope.launch {
                        isProcessing = true
                        errorMessage = null
                        try {
                            val files = withContext(Dispatchers.IO) {
                                when (splitMode) {
                                    SplitMode.EVERY_PAGE -> PdfService.splitEveryPage(context, uri, "split")
                                    SplitMode.BY_INTERVAL -> PdfService.splitByInterval(context, uri, interval, "split")
                                    SplitMode.SELECTED_PAGES -> PdfService.splitEveryPage(context, uri, "split")
                                }
                            }
                            results = files.map { (name, data) ->
                                name to PdfService.writeTemporaryFile(context, data, name)
                            }
                        } catch (e: Exception) {
                            errorMessage = e.message
                        } finally {
                            isProcessing = false
                        }
                    }
                },
            )

            results.forEach { (name, uri) ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Cream, RoundedCornerShape(PaperlessThemeValues.CardCornerRadius.dp))
                        .padding(12.dp),
                ) {
                    Text(name, style = MaterialTheme.typography.bodyMedium, color = Ink)
                    PrimaryButton(
                        title = "Share",
                        icon = Icons.Default.Share,
                        onClick = { shareFile(context, uri, "application/pdf") },
                    )
                }
            }

            PrivacyBadge()
        }
        if (isProcessing) ProcessingOverlay("Splitting PDF…")
    }
}
