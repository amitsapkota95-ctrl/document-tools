package tools.paperless.app.ui.screens.scan

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DocumentScanner
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import tools.paperless.app.models.ToolDestination
import tools.paperless.app.ui.components.PrimaryButton
import tools.paperless.app.ui.components.PrivacyBadge
import tools.paperless.app.ui.theme.Ink
import tools.paperless.app.ui.theme.Paper

@Composable
fun ScanTabScreen(onNavigateToTool: (ToolDestination) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Paper)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        Text(
            text = "Scan",
            style = MaterialTheme.typography.headlineLarge,
            color = Ink,
        )

        Text(
            text = "Capture documents or scan QR codes with your camera.",
            style = MaterialTheme.typography.bodyMedium,
            color = Ink,
        )

        PrimaryButton(
            title = "Scan Document",
            icon = Icons.Default.DocumentScanner,
            modifier = Modifier.fillMaxWidth(),
            onClick = { onNavigateToTool(ToolDestination.DOCUMENT_SCANNER) },
        )

        PrimaryButton(
            title = "Scan QR Code",
            icon = Icons.Default.QrCodeScanner,
            modifier = Modifier.fillMaxWidth(),
            onClick = { onNavigateToTool(ToolDestination.QR_SCANNER) },
        )

        PrivacyBadge()
    }
}
