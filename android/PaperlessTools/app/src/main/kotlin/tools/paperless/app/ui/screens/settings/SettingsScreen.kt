package tools.paperless.app.ui.screens.settings

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Language
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import tools.paperless.app.services.SavedSignature
import tools.paperless.app.services.StorageService
import tools.paperless.app.ui.components.PrivacyBadge
import tools.paperless.app.ui.theme.Ink
import tools.paperless.app.ui.theme.Paper
import tools.paperless.app.ui.theme.SandLight
import java.text.DateFormat

@Composable
fun SettingsScreen() {
    val context = LocalContext.current
    var signatures by remember { mutableStateOf<List<SavedSignature>>(emptyList()) }

    LaunchedEffect(Unit) {
        signatures = StorageService.loadSignatures(context)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Paper)
            .padding(20.dp),
    ) {
        item {
            Text(
                text = "Settings",
                style = MaterialTheme.typography.headlineLarge,
                color = Ink,
                modifier = Modifier.padding(bottom = 20.dp),
            )
        }

        item {
            Text(
                text = "Signature Vault",
                style = MaterialTheme.typography.titleLarge,
                color = Ink,
            )
            Text(
                text = "Saved signatures from Fill & Sign",
                style = MaterialTheme.typography.labelMedium,
                color = SandLight,
                modifier = Modifier.padding(bottom = 12.dp, top = 4.dp),
            )
        }

        if (signatures.isEmpty()) {
            item {
                Text(
                    text = "No saved signatures yet. Create one in Fill & Sign.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = SandLight,
                    modifier = Modifier.padding(bottom = 24.dp),
                )
            }
        } else {
            items(signatures, key = { it.id }) { signature ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    signature.bitmap()?.let { bitmap ->
                        Image(
                            bitmap = bitmap.asImageBitmap(),
                            contentDescription = signature.name,
                            modifier = Modifier
                                .width(80.dp)
                                .height(40.dp),
                        )
                    }
                    Column(modifier = Modifier.weight(1f).padding(start = 12.dp)) {
                        Text(text = signature.name, style = MaterialTheme.typography.titleMedium, color = Ink)
                        Text(
                            text = DateFormat.getDateInstance().format(signature.createdAt),
                            style = MaterialTheme.typography.labelMedium,
                            color = SandLight,
                        )
                    }
                    IconButton(onClick = {
                        StorageService.deleteSignature(context, signature.id)
                        signatures = StorageService.loadSignatures(context)
                    }) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete")
                    }
                }
            }
        }

        item {
            HorizontalDivider(modifier = Modifier.padding(vertical = 20.dp))
            Text(text = "About", style = MaterialTheme.typography.titleLarge, color = Ink)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Default.Language, contentDescription = null, tint = Ink)
                Text(
                    text = "paperless.tools",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Ink,
                    modifier = Modifier.padding(start = 12.dp),
                )
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp),
            ) {
                Text(text = "Version", style = MaterialTheme.typography.bodyMedium, color = Ink, modifier = Modifier.weight(1f))
                Text(text = "1.0.0", style = MaterialTheme.typography.bodyMedium, color = SandLight)
            }
            PrivacyBadge(modifier = Modifier.padding(top = 20.dp))
        }
    }
}
