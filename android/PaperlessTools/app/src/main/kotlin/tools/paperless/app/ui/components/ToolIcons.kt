package tools.paperless.app.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.CompareArrows
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.Crop
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.DocumentScanner
import androidx.compose.material.icons.filled.Draw
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Subtitles
import androidx.compose.material.icons.filled.TextFields
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.outlined.Compress
import androidx.compose.material.icons.outlined.MergeType
import androidx.compose.ui.graphics.vector.ImageVector

fun toolIcon(iconName: String): ImageVector = when (iconName) {
    "doc_scanner" -> Icons.Default.DocumentScanner
    "merge" -> Icons.Outlined.MergeType
    "content_cut" -> Icons.Default.ContentCut
    "compress" -> Icons.Outlined.Compress
    "draw" -> Icons.Default.Draw
    "image" -> Icons.Default.Image
    "photo_library" -> Icons.Default.PhotoLibrary
    "visibility_off" -> Icons.Default.VisibilityOff
    "crop" -> Icons.Default.Crop
    "text_fields" -> Icons.Default.TextFields
    "qr_code" -> Icons.Default.QrCode
    "link" -> Icons.Default.Link
    "compare_arrows" -> Icons.AutoMirrored.Filled.CompareArrows
    "receipt_long" -> Icons.Default.ReceiptLong
    "subtitles" -> Icons.Default.Subtitles
    "qr_scanner" -> Icons.Default.QrCodeScanner
    else -> Icons.Default.Description
}
