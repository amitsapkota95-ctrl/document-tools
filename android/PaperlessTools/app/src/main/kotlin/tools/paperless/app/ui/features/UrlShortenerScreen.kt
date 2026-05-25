package tools.paperless.app.ui.features

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.OpenInBrowser
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import kotlinx.coroutines.launch
import tools.paperless.app.services.ApiService
import tools.paperless.app.ui.components.PaperlessTextField
import tools.paperless.app.ui.components.PrimaryButton
import tools.paperless.app.ui.components.PrivacyBadge
import tools.paperless.app.ui.theme.Cream
import tools.paperless.app.ui.theme.Forest
import tools.paperless.app.ui.theme.Forest50
import tools.paperless.app.ui.theme.Ink
import tools.paperless.app.ui.theme.Paper
import tools.paperless.app.ui.theme.PaperlessThemeValues
import android.content.Intent
import android.net.Uri

@Composable
fun UrlShortenerScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var url by remember { mutableStateOf("") }
    var shortUrl by remember { mutableStateOf("") }
    var statsUrl by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var copied by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Paper)
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(Cream, RoundedCornerShape(PaperlessThemeValues.CardCornerRadius.dp))
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("Paste a long URL", style = MaterialTheme.typography.titleLarge, color = Ink)
            PaperlessTextField(
                value = url,
                onValueChange = { url = it },
                placeholder = "https://example.com/very-long-link",
            )
            errorMessage?.let {
                Text(it, style = MaterialTheme.typography.labelMedium, color = androidx.compose.ui.graphics.Color.Red)
            }
            PrimaryButton(
                title = "Shorten Link",
                icon = Icons.Default.Link,
                isLoading = isLoading,
                isDisabled = url.trim().isEmpty(),
                onClick = {
                    scope.launch {
                        isLoading = true
                        errorMessage = null
                        copied = false
                        try {
                            val response = ApiService.shortenUrl(url)
                            shortUrl = response.shortUrl
                            statsUrl = response.statsUrl
                        } catch (e: Exception) {
                            errorMessage = e.message
                        } finally {
                            isLoading = false
                        }
                    }
                },
            )
        }

        if (shortUrl.isNotEmpty()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Forest50, RoundedCornerShape(PaperlessThemeValues.CardCornerRadius.dp))
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Text("Your short link", style = MaterialTheme.typography.titleMedium, color = Ink)
                Text(shortUrl, style = MaterialTheme.typography.bodyLarge, color = Forest)
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Button(
                        onClick = {
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            clipboard.setPrimaryClip(ClipData.newPlainText("short url", shortUrl))
                            copied = true
                        },
                        modifier = Modifier.weight(1f),
                    ) {
                        androidx.compose.material3.Icon(Icons.Default.ContentCopy, contentDescription = null)
                        Text(if (copied) "Copied!" else "Copy", modifier = Modifier.padding(start = 8.dp))
                    }
                    OutlinedButton(
                        onClick = {
                            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(statsUrl)))
                        },
                        modifier = Modifier.weight(1f),
                    ) {
                        androidx.compose.material3.Icon(Icons.Default.OpenInBrowser, contentDescription = null)
                        Text("Stats", modifier = Modifier.padding(start = 8.dp))
                    }
                }
            }
        }

        PrivacyBadge()
    }
}
