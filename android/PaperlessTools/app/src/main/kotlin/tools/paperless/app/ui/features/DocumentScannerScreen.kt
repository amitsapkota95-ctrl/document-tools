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
import androidx.compose.material.icons.filled.Add
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
import tools.paperless.app.ui.theme.Ink
import tools.paperless.app.ui.theme.Paper
import tools.paperless.app.ui.util.rememberImagePicker
import tools.paperless.app.ui.util.shareFile

@Composable
fun DocumentScannerScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var pageUris by remember { mutableStateOf<List<Uri>>(emptyList()) }
    var exportUri by remember { mutableStateOf<Uri?>(null) }
    var isProcessing by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val pickImages = rememberImagePicker { uris ->
        pageUris = pageUris + uris
        exportUri = null
        errorMessage = null
    }

    Box(Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier.fillMaxSize().background(Paper).verticalScroll(rememberScrollState()).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text(
                text = "Add photos of document pages. They will be combined into a searchable PDF.",
                style = MaterialTheme.typography.bodyMedium,
                color = Ink,
            )
            PrimaryButton(title = "Add Pages", icon = Icons.Default.Add, onClick = pickImages)
            if (pageUris.isNotEmpty()) Text("${pageUris.size} pages captured", color = Ink)
            errorMessage?.let { Text(it, color = androidx.compose.ui.graphics.Color.Red) }
            PrimaryButton(
                title = "Save as PDF",
                isDisabled = pageUris.isEmpty(),
                isLoading = isProcessing,
                onClick = {
                    scope.launch {
                        isProcessing = true
                        try {
                            val bitmaps = withContext(Dispatchers.IO) {
                                pageUris.mapNotNull { PdfService.loadBitmapFromUri(context, it) }
                            }
                            val data = withContext(Dispatchers.IO) {
                                PdfService.imagesToPdf(bitmaps, tools.paperless.app.services.PdfPageSize.A4)
                            }
                            exportUri = PdfService.writeTemporaryPdf(context, data, "scan")
                        } catch (e: Exception) {
                            errorMessage = e.message
                        } finally {
                            isProcessing = false
                        }
                    }
                },
            )
            exportUri?.let {
                PrimaryButton(title = "Share Scanned PDF", icon = Icons.Default.Share, onClick = { shareFile(context, it, "application/pdf") })
            }
            PrivacyBadge()
        }
        if (isProcessing) ProcessingOverlay("Creating PDF…")
    }
}
