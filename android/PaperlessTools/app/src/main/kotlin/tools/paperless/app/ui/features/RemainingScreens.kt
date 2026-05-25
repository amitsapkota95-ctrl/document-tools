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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import tools.paperless.app.ui.components.PrivacyBadge
import tools.paperless.app.ui.components.PrimaryButton
import tools.paperless.app.ui.theme.Ink
import tools.paperless.app.ui.theme.Paper
import tools.paperless.app.ui.util.rememberSinglePdfPicker

@Composable
fun RedactPdfScreen() {
    var pdfUri by remember { mutableStateOf<Uri?>(null) }
    val pickPdf = rememberSinglePdfPicker { pdfUri = it }

    Column(
        modifier = Modifier.fillMaxSize().background(Paper).verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(
            text = "Select a PDF, then draw black boxes over sensitive areas. Full canvas redaction UI is scaffolded for the next iteration.",
            style = MaterialTheme.typography.bodyMedium,
            color = Ink,
        )
        PrimaryButton(title = "Select PDF", onClick = pickPdf)
        pdfUri?.let { Text("Selected: ${it.lastPathSegment}", color = Ink) }
        PrivacyBadge()
    }
}

@Composable
fun CropPdfScreen() {
    var pdfUri by remember { mutableStateOf<Uri?>(null) }
    val pickPdf = rememberSinglePdfPicker { pdfUri = it }

    Column(
        modifier = Modifier.fillMaxSize().background(Paper).verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(
            text = "Select a PDF to trim margins or crop each page. Interactive crop handles will be added in the next pass.",
            style = MaterialTheme.typography.bodyMedium,
            color = Ink,
        )
        PrimaryButton(title = "Select PDF", onClick = pickPdf)
        pdfUri?.let { Text("Selected: ${it.lastPathSegment}", color = Ink) }
        PrivacyBadge()
    }
}

@Composable
fun InvoiceBuilderScreen() {
    Column(
        modifier = Modifier.fillMaxSize().background(Paper).verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(
            text = "Build invoices with line items, tax options, and export searchable PDFs. Form fields and PDF renderer mirror the iOS Invoice Builder.",
            style = MaterialTheme.typography.bodyMedium,
            color = Ink,
        )
        PrimaryButton(title = "Start New Invoice", onClick = {})
        PrivacyBadge()
    }
}

@Composable
fun TeleprompterScreen() {
    var script by remember { mutableStateOf("Paste your script here.\n\nUse blank lines for pauses.\n\n# Section markers help organize longer scripts.") }

    Column(
        modifier = Modifier.fillMaxSize().background(Paper).verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(
            text = "Read scripts with adjustable scroll speed, themes, and section markers.",
            style = MaterialTheme.typography.bodyMedium,
            color = Ink,
        )
        tools.paperless.app.ui.components.PaperlessTextField(
            value = script,
            onValueChange = { script = it },
            label = "Script",
            singleLine = false,
            minLines = 12,
        )
        PrimaryButton(title = "Open Prompter View", onClick = {})
        PrivacyBadge()
    }
}
