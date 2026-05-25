package tools.paperless.app.ui.util

import android.content.Context
import android.content.Intent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.core.content.FileProvider
import android.net.Uri

@Composable
fun rememberPdfPicker(onSelected: (List<Uri>) -> Unit): () -> Unit {
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenMultipleDocuments(),
    ) { uris ->
        if (uris.isNotEmpty()) onSelected(uris)
    }
    return remember {
        { launcher.launch(arrayOf("application/pdf")) }
    }
}

@Composable
fun rememberSinglePdfPicker(onSelected: (Uri) -> Unit): () -> Unit {
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument(),
    ) { uri ->
        uri?.let(onSelected)
    }
    return remember {
        { launcher.launch(arrayOf("application/pdf")) }
    }
}

@Composable
fun rememberImagePicker(onSelected: (List<Uri>) -> Unit): () -> Unit {
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenMultipleDocuments(),
    ) { uris ->
        if (uris.isNotEmpty()) onSelected(uris)
    }
    return remember {
        { launcher.launch(arrayOf("image/*")) }
    }
}

fun shareFile(context: Context, uri: Uri, mimeType: String) {
    val shareUri = if (uri.scheme == "file") {
        FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", java.io.File(uri.path!!))
    } else {
        uri
    }
    val intent = Intent(Intent.ACTION_SEND).apply {
        type = mimeType
        putExtra(Intent.EXTRA_STREAM, shareUri)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    context.startActivity(Intent.createChooser(intent, "Share"))
}

fun shareText(context: Context, text: String) {
    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_TEXT, text)
    }
    context.startActivity(Intent.createChooser(intent, "Share"))
}
