package tools.paperless.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import tools.paperless.app.ui.theme.Forest50
import tools.paperless.app.ui.theme.ForestMuted
import tools.paperless.app.ui.theme.Sage

@Composable
fun PrivacyBadge(modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .background(Forest50, RoundedCornerShape(20.dp))
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            imageVector = Icons.Default.Shield,
            contentDescription = null,
            tint = Sage,
            modifier = Modifier.padding(end = 6.dp),
        )
        Text(
            text = "Processed on your device",
            style = MaterialTheme.typography.labelMedium,
            color = ForestMuted,
        )
    }
}
