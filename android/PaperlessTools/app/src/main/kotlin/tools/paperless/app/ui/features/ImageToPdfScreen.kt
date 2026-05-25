package tools.paperless.app.ui.features

import android.graphics.Bitmap
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
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Share
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
import tools.paperless.app.services.PdfPageSize
import tools.paperless.app.services.PdfService
import tools.paperless.app.ui.components.PrimaryButton
import tools.paperless.app.ui.components.PrivacyBadge
import tools.paperless.app.ui.components.ProcessingOverlay
import tools.paperless.app.ui.theme.Ink
import tools.paperless.app.ui.theme.Paper
import tools.paperless.app.ui.util.rememberImagePicker
import tools.paperless.app.ui.util.shareFile

@Composable
fun ImageToPdfScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var imageUris by remember { mutableStateOf<List<Uri>>(emptyList()) }
    var pageSize by remember { mutableStateOf(PdfPageSize.A4) }
    var exportUri by remember { mutableStateOf<Uri?>(null) }
    var isProcessing by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val pickImages = rememberImagePicker { uris ->
        imageUris = imageUris + uris
        exportUri = null
        errorMessage = null
    }

    Box(Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier.fillMaxSize().background(Paper).verticalScroll(rememberScrollState()).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text("Select images to combine into a PDF.", style = MaterialTheme.typography.bodyMedium, color = Ink)
            PrimaryButton(title = "Add Images", icon = Icons.Default.Image, onClick = pickImages)
            if (imageUris.isNotEmpty()) Text("${imageUris.size} images selected", color = Ink)
            PdfPageSize.entries.forEach { size ->
                FilterChip(selected = pageSize == size, onClick = { pageSize = size }, label = { Text(size.label) })
            }
            PrimaryButton(
                title = "Create PDF",
                isDisabled = imageUris.isEmpty(),
                isLoading = isProcessing,
                onClick = {
                    scope.launch {
                        isProcessing = true
                        try {
                            val bitmaps = withContext(Dispatchers.IO) {
                                imageUris.mapNotNull { PdfService.loadBitmapFromUri(context, it) }
                            }
                            if (bitmaps.isEmpty()) throw IllegalStateException("Could not load images.")
                            val data = withContext(Dispatchers.IO) { PdfService.imagesToPdf(bitmaps, pageSize) }
                            exportUri = PdfService.writeTemporaryPdf(context, data, "images")
                        } catch (e: Exception) {
                            errorMessage = e.message
                        } finally {
                            isProcessing = false
                        }
                    }
                },
            )
            errorMessage?.let { Text(it, color = androidx.compose.ui.graphics.Color.Red) }
            exportUri?.let {
                PrimaryButton(title = "Share PDF", icon = Icons.Default.Share, onClick = { shareFile(context, it, "application/pdf") })
            }
            PrivacyBadge()
        }
        if (isProcessing) ProcessingOverlay("Creating PDF…")
    }
}
