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
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.TextFields
import androidx.compose.material3.FilterChip
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
import tools.paperless.app.services.ExportImageFormat
import tools.paperless.app.services.PdfService
import tools.paperless.app.ui.components.PrimaryButton
import tools.paperless.app.ui.components.PrivacyBadge
import tools.paperless.app.ui.components.ProcessingOverlay
import tools.paperless.app.ui.theme.Cream
import tools.paperless.app.ui.theme.Ink
import tools.paperless.app.ui.theme.Paper
import tools.paperless.app.ui.theme.PaperlessThemeValues
import tools.paperless.app.ui.util.rememberSinglePdfPicker
import tools.paperless.app.ui.util.shareFile
import tools.paperless.app.ui.util.shareText

@Composable
fun ExtractTextScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var pdfUri by remember { mutableStateOf<Uri?>(null) }
    var extractedText by remember { mutableStateOf("") }
    var isProcessing by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val pickPdf = rememberSinglePdfPicker { pdfUri = it; extractedText = ""; errorMessage = null }

    Box(Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier.fillMaxSize().background(Paper).verticalScroll(rememberScrollState()).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            PrimaryButton(title = "Select PDF", onClick = pickPdf)
            PrimaryButton(
                title = "Extract Text",
                icon = Icons.Default.TextFields,
                isDisabled = pdfUri == null,
                isLoading = isProcessing,
                onClick = {
                    val uri = pdfUri ?: return@PrimaryButton
                    scope.launch {
                        isProcessing = true
                        try {
                            extractedText = withContext(Dispatchers.IO) { PdfService.extractText(context, uri) }
                        } catch (e: Exception) {
                            errorMessage = e.message
                        } finally {
                            isProcessing = false
                        }
                    }
                },
            )
            errorMessage?.let { Text(it, color = androidx.compose.ui.graphics.Color.Red) }
            if (extractedText.isNotEmpty()) {
                Column(
                    modifier = Modifier.fillMaxWidth().background(Cream, RoundedCornerShape(PaperlessThemeValues.CardCornerRadius.dp)).padding(16.dp),
                ) {
                    Text(extractedText, style = MaterialTheme.typography.bodyMedium, color = Ink)
                    PrimaryButton(title = "Share Text", icon = Icons.Default.Share, onClick = { shareText(context, extractedText) })
                }
            }
            PrivacyBadge()
        }
        if (isProcessing) ProcessingOverlay("Extracting text…")
    }
}

@Composable
fun PdfToImageScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var pdfUri by remember { mutableStateOf<Uri?>(null) }
    var format by remember { mutableStateOf(ExportImageFormat.PNG) }
    var results by remember { mutableStateOf<List<Pair<String, Uri>>>(emptyList()) }
    var isProcessing by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val pickPdf = rememberSinglePdfPicker { pdfUri = it; results = emptyList(); errorMessage = null }

    Box(Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier.fillMaxSize().background(Paper).verticalScroll(rememberScrollState()).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            PrimaryButton(title = "Select PDF", onClick = pickPdf)
            ExportImageFormat.entries.forEach { item ->
                FilterChip(selected = format == item, onClick = { format = item }, label = { Text(item.label) })
            }
            PrimaryButton(
                title = "Convert to Images",
                isDisabled = pdfUri == null,
                isLoading = isProcessing,
                onClick = {
                    val uri = pdfUri ?: return@PrimaryButton
                    scope.launch {
                        isProcessing = true
                        try {
                            val files = withContext(Dispatchers.IO) { PdfService.pdfToImages(context, uri, format) }
                            results = files.map { (name, data) -> name to PdfService.writeTemporaryFile(context, data, name) }
                        } catch (e: Exception) {
                            errorMessage = e.message
                        } finally {
                            isProcessing = false
                        }
                    }
                },
            )
            errorMessage?.let { Text(it, color = androidx.compose.ui.graphics.Color.Red) }
            results.forEach { (name, uri) ->
                Column(Modifier.fillMaxWidth().background(Cream, RoundedCornerShape(PaperlessThemeValues.CardCornerRadius.dp)).padding(12.dp)) {
                    Text(name, color = Ink)
                    PrimaryButton(title = "Share", icon = Icons.Default.Share, onClick = { shareFile(context, uri, "image/${format.extension}") })
                }
            }
            PrivacyBadge()
        }
        if (isProcessing) ProcessingOverlay("Converting pages…")
    }
}
