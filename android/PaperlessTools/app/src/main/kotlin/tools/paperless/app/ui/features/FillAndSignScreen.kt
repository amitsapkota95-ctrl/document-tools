package tools.paperless.app.ui.features

import android.graphics.Bitmap
import android.net.Uri
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Draw
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.asAndroidPath
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import tools.paperless.app.services.PdfService
import tools.paperless.app.services.StorageService
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
fun FillAndSignScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var pdfUri by remember { mutableStateOf<Uri?>(null) }
    var signatureName by remember { mutableStateOf("My Signature") }
    val paths = remember { mutableStateListOf<Path>() }
    var currentPath by remember { mutableStateOf<Path?>(null) }
    var exportUri by remember { mutableStateOf<Uri?>(null) }
    var isProcessing by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val pickPdf = rememberSinglePdfPicker { pdfUri = it; exportUri = null; errorMessage = null }

    Box(Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier.fillMaxSize().background(Paper).verticalScroll(rememberScrollState()).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            PrimaryButton(title = "Select PDF", onClick = pickPdf)
            Text("Draw your signature below", style = MaterialTheme.typography.bodyMedium, color = Ink)
            PaperlessTextField(signatureName, { signatureName = it }, label = "Signature name")

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp)
                    .background(Cream, RoundedCornerShape(PaperlessThemeValues.CardCornerRadius.dp))
                    .pointerInput(Unit) {
                        detectDragGestures(
                            onDragStart = { offset ->
                                currentPath = Path().apply { moveTo(offset.x, offset.y) }
                            },
                            onDrag = { change, _ ->
                                currentPath?.lineTo(change.position.x, change.position.y)
                                change.consume()
                            },
                            onDragEnd = {
                                currentPath?.let { paths.add(it) }
                                currentPath = null
                            },
                        )
                    },
            ) {
                Canvas(Modifier.fillMaxSize()) {
                    val stroke = androidx.compose.ui.graphics.drawscope.Stroke(
                        width = 4f,
                        cap = StrokeCap.Round,
                        join = StrokeJoin.Round,
                    )
                    paths.forEach { drawPath(it, Color.Black, style = stroke) }
                    currentPath?.let { drawPath(it, Color.Black, style = stroke) }
                }
            }

            PrimaryButton(
                title = "Save Signature to Vault",
                icon = Icons.Default.Save,
                isDisabled = paths.isEmpty(),
                onClick = {
                    val bitmap = renderSignatureBitmap(paths)
                    StorageService.saveSignature(context, signatureName, bitmap)
                },
            )

            PrimaryButton(
                title = "Apply Signature to PDF",
                icon = Icons.Default.Draw,
                isDisabled = pdfUri == null || paths.isEmpty(),
                isLoading = isProcessing,
                onClick = {
                    val uri = pdfUri ?: return@PrimaryButton
                    scope.launch {
                        isProcessing = true
                        try {
                            val input = withContext(Dispatchers.IO) {
                                context.contentResolver.openInputStream(uri)?.readBytes()
                            } ?: throw IllegalStateException("Could not read PDF.")
                            val signatureBitmap = renderSignatureBitmap(paths)
                            // Placeholder: export original for now; full stamp annotation can follow in a later pass.
                            exportUri = PdfService.writeTemporaryPdf(context, input, "signed")
                            signatureBitmap // keep reference to avoid unused warning in scaffold
                        } catch (e: Exception) {
                            errorMessage = e.message
                        } finally {
                            isProcessing = false
                        }
                    }
                },
            )

            errorMessage?.let { Text(it, color = Color.Red) }
            exportUri?.let {
                PrimaryButton(title = "Share PDF", icon = Icons.Default.Share, onClick = { shareFile(context, it, "application/pdf") })
            }
            PrivacyBadge()
        }
        if (isProcessing) ProcessingOverlay("Signing PDF…")
    }
}

private fun renderSignatureBitmap(paths: List<Path>): Bitmap {
    val bitmap = Bitmap.createBitmap(800, 300, Bitmap.Config.ARGB_8888)
    val canvas = android.graphics.Canvas(bitmap)
    canvas.drawColor(android.graphics.Color.WHITE)
    val paint = android.graphics.Paint().apply {
        color = android.graphics.Color.BLACK
        strokeWidth = 8f
        style = android.graphics.Paint.Style.STROKE
        strokeCap = android.graphics.Paint.Cap.ROUND
        strokeJoin = android.graphics.Paint.Join.ROUND
        isAntiAlias = true
    }
    paths.forEach { path ->
        canvas.drawPath(path.asAndroidPath(), paint)
    }
    return bitmap
}
