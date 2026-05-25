package tools.paperless.app.ui.features

import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Compress
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
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
import tools.paperless.app.ui.theme.Ink
import tools.paperless.app.ui.theme.Paper
import tools.paperless.app.ui.util.rememberSinglePdfPicker
import tools.paperless.app.ui.util.shareFile

@Composable
fun CompressPdfScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var pdfUri by remember { mutableStateOf<Uri?>(null) }
    var quality by remember { mutableFloatStateOf(75f) }
    var exportUri by remember { mutableStateOf<Uri?>(null) }
    var isProcessing by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val pickPdf = rememberSinglePdfPicker { pdfUri = it; exportUri = null; errorMessage = null }

    Box(Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier.fillMaxSize().background(Paper).verticalScroll(rememberScrollState()).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text("Reduce file size by re-rendering pages as JPEG.", style = MaterialTheme.typography.bodyMedium, color = Ink)
            PrimaryButton(title = "Select PDF", onClick = pickPdf)
            pdfUri?.let { Text("Selected: ${it.lastPathSegment}", color = Ink) }
            Text("Quality: ${quality.toInt()}%", color = Ink)
            Slider(value = quality, onValueChange = { quality = it }, valueRange = 30f..95f)
            errorMessage?.let { Text(it, color = androidx.compose.ui.graphics.Color.Red) }
            PrimaryButton(
                title = "Compress PDF",
                icon = Icons.Default.Compress,
                isDisabled = pdfUri == null,
                isLoading = isProcessing,
                onClick = {
                    val uri = pdfUri ?: return@PrimaryButton
                    scope.launch {
                        isProcessing = true
                        try {
                            val data = withContext(Dispatchers.IO) { PdfService.compressPdf(context, uri, quality.toInt()) }
                            exportUri = PdfService.writeTemporaryPdf(context, data, "compressed")
                        } catch (e: Exception) {
                            errorMessage = e.message
                        } finally {
                            isProcessing = false
                        }
                    }
                },
            )
            exportUri?.let {
                PrimaryButton(title = "Share Compressed PDF", icon = Icons.Default.Share, onClick = { shareFile(context, it, "application/pdf") })
            }
            PrivacyBadge()
        }
        if (isProcessing) ProcessingOverlay("Compressing…")
    }
}
