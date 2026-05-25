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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.outlined.MergeType
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
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
import tools.paperless.app.ui.components.PrimaryButton
import tools.paperless.app.ui.components.PrivacyBadge
import tools.paperless.app.ui.components.ProcessingOverlay
import tools.paperless.app.ui.theme.Cream
import tools.paperless.app.ui.theme.Ink
import tools.paperless.app.ui.theme.Paper
import tools.paperless.app.ui.theme.PaperlessThemeValues
import tools.paperless.app.ui.theme.SandLight
import tools.paperless.app.ui.util.rememberPdfPicker
import tools.paperless.app.ui.util.shareFile

@Composable
fun MergePdfScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var selectedUris by remember { mutableStateOf<List<Uri>>(emptyList()) }
    var exportUri by remember { mutableStateOf<Uri?>(null) }
    var isProcessing by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val pickPdfs = rememberPdfPicker { uris ->
        selectedUris = selectedUris + uris
        exportUri = null
        errorMessage = null
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Paper)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text(
                text = "Select PDF files to combine in order.",
                style = MaterialTheme.typography.bodyMedium,
                color = Ink,
            )

            PrimaryButton(
                title = "Add PDF Files",
                icon = Icons.Default.Add,
                onClick = pickPdfs,
            )

            if (selectedUris.isNotEmpty()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Cream, RoundedCornerShape(PaperlessThemeValues.CardCornerRadius.dp))
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text("${selectedUris.size} files selected", style = MaterialTheme.typography.titleMedium, color = Ink)
                    selectedUris.forEachIndexed { index, uri ->
                        Text(
                            text = "${index + 1}. ${uri.lastPathSegment ?: "document.pdf"}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = SandLight,
                        )
                    }
                }
            }

            errorMessage?.let {
                Text(it, color = androidx.compose.ui.graphics.Color.Red, style = MaterialTheme.typography.bodyMedium)
            }

            PrimaryButton(
                title = "Combine PDFs",
                icon = Icons.Outlined.MergeType,
                isDisabled = selectedUris.size < 2,
                isLoading = isProcessing,
                onClick = {
                    scope.launch {
                        isProcessing = true
                        errorMessage = null
                        try {
                            val data = withContext(Dispatchers.IO) {
                                PdfService.mergePdfs(context, selectedUris)
                            }
                            exportUri = PdfService.writeTemporaryPdf(context, data, "merged")
                        } catch (e: Exception) {
                            errorMessage = e.message
                        } finally {
                            isProcessing = false
                        }
                    }
                },
            )

            exportUri?.let { uri ->
                PrimaryButton(
                    title = "Share Combined PDF",
                    icon = Icons.Default.Share,
                    onClick = { shareFile(context, uri, "application/pdf") },
                )
            }

            PrivacyBadge()
        }

        if (isProcessing) ProcessingOverlay("Combining PDFs…")
    }
}
