package tools.paperless.app.ui.screens.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.unit.dp
import tools.paperless.app.models.ToolDefinition
import tools.paperless.app.models.ToolDestination
import tools.paperless.app.models.ToolRegistry
import tools.paperless.app.models.destinationFor
import tools.paperless.app.ui.components.PrivacyBadge
import tools.paperless.app.ui.components.ToolCard
import tools.paperless.app.ui.components.toolIcon
import tools.paperless.app.ui.theme.Cream
import tools.paperless.app.ui.theme.Forest
import tools.paperless.app.ui.theme.Forest100
import tools.paperless.app.ui.theme.Forest50
import tools.paperless.app.ui.theme.Ink
import tools.paperless.app.ui.theme.Paper
import tools.paperless.app.ui.theme.PaperlessThemeValues
import tools.paperless.app.ui.theme.SandLight

@Composable
fun HomeScreen(
    onNavigateToTool: (ToolDestination) -> Unit,
    onNavigateToToolsTab: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Paper)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(28.dp),
    ) {
        Text(
            text = "paperless.tools",
            style = MaterialTheme.typography.headlineLarge,
            color = Ink,
        )

        HeroSection()

        FeaturedSection(
            onNavigateToTool = onNavigateToTool,
            onNavigateToToolsTab = onNavigateToToolsTab,
        )

        SectionHeader(
            title = "All Tools",
            subtitle = "${ToolRegistry.availableTools.size} available now",
        )

        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            modifier = Modifier.height(((ToolRegistry.availableTools.size / 2 + 1) * 110).dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            userScrollEnabled = false,
        ) {
            items(ToolRegistry.availableTools) { tool ->
                destinationFor(tool.slug)?.let { destination ->
                    ToolCard(
                        tool = tool,
                        modifier = Modifier.clickable { onNavigateToTool(destination) },
                    )
                }
            }
        }

        if (ToolRegistry.comingSoonTools.isNotEmpty()) {
            SectionHeader(title = "Coming Soon", subtitle = "More tools on the way")
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                modifier = Modifier.height(((ToolRegistry.comingSoonTools.size / 2 + 1) * 110).dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                userScrollEnabled = false,
            ) {
                items(ToolRegistry.comingSoonTools) { tool ->
                    ToolCard(tool = tool, isAvailable = false)
                }
            }
        }
    }
}

@Composable
private fun HeroSection() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(4.dp, RoundedCornerShape(PaperlessThemeValues.CardCornerRadius.dp))
            .clip(RoundedCornerShape(PaperlessThemeValues.CardCornerRadius.dp))
            .background(Brush.linearGradient(listOf(Cream, Forest50.copy(alpha = 0.6f))))
            .padding(20.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            PrivacyBadge()
            Spacer(Modifier.height(10.dp))
            Text(
                text = "${ToolRegistry.availableTools.size} tools ready",
                style = MaterialTheme.typography.headlineMedium,
                color = Ink,
            )
            Text(
                text = "Scan · Merge · Split · Sign · Share",
                style = MaterialTheme.typography.bodyMedium,
                color = Forest,
                modifier = Modifier.padding(top = 4.dp),
            )
        }

        Box(
            modifier = Modifier
                .size(88.dp)
                .background(
                    Brush.linearGradient(listOf(Forest50, Forest100)),
                    CircleShape,
                ),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = Icons.Default.Description,
                contentDescription = null,
                tint = Forest,
                modifier = Modifier.size(36.dp),
            )
        }
    }
}

@Composable
private fun FeaturedSection(
    onNavigateToTool: (ToolDestination) -> Unit,
    onNavigateToToolsTab: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        SectionHeader(title = "Popular", subtitle = "Tap to open")

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            ToolRegistry.homeFeaturedTools.forEach { tool ->
                destinationFor(tool.slug)?.let { destination ->
                    FeaturedToolCard(
                        tool = tool,
                        onClick = { onNavigateToTool(destination) },
                    )
                }
            }

            FeaturedShortcutCard(
                title = "Scan QR",
                actionLabel = "Open camera",
                icon = Icons.Default.QrCodeScanner,
                onClick = { onNavigateToTool(ToolDestination.QR_SCANNER) },
            )

            FeaturedShortcutCard(
                title = "Shorten Link",
                actionLabel = "Create short URL",
                icon = Icons.Default.Link,
                onClick = { onNavigateToTool(ToolDestination.URL_SHORTENER) },
            )

            FeaturedShortcutCard(
                title = "All Tools",
                actionLabel = "See full list",
                icon = Icons.Default.GridView,
                onClick = onNavigateToToolsTab,
            )
        }
    }
}

@Composable
private fun FeaturedToolCard(tool: ToolDefinition, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .width(156.dp)
            .clip(RoundedCornerShape(PaperlessThemeValues.CardCornerRadius.dp))
            .background(Cream)
            .border(1.dp, Forest.copy(alpha = 0.15f), RoundedCornerShape(PaperlessThemeValues.CardCornerRadius.dp))
            .clickable(onClick = onClick)
            .padding(16.dp),
    ) {
        Icon(
            imageVector = toolIcon(tool.iconName),
            contentDescription = null,
            tint = Forest,
            modifier = Modifier
                .size(52.dp)
                .background(Forest50, RoundedCornerShape(14.dp))
                .padding(12.dp),
        )
        Spacer(Modifier.height(12.dp))
        Text(text = tool.title, style = MaterialTheme.typography.titleMedium, color = Ink)
        Text(
            text = tool.actionLabel,
            style = MaterialTheme.typography.labelMedium,
            color = Forest,
            modifier = Modifier.padding(top = 4.dp),
        )
    }
}

@Composable
private fun FeaturedShortcutCard(
    title: String,
    actionLabel: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit,
) {
    Column(
        modifier = Modifier
            .width(156.dp)
            .clip(RoundedCornerShape(PaperlessThemeValues.CardCornerRadius.dp))
            .background(Cream)
            .border(1.dp, Forest.copy(alpha = 0.15f), RoundedCornerShape(PaperlessThemeValues.CardCornerRadius.dp))
            .clickable(onClick = onClick)
            .padding(16.dp),
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = Forest,
            modifier = Modifier
                .size(52.dp)
                .background(Forest50, RoundedCornerShape(14.dp))
                .padding(12.dp),
        )
        Spacer(Modifier.height(12.dp))
        Text(text = title, style = MaterialTheme.typography.titleMedium, color = Ink)
        Text(
            text = actionLabel,
            style = MaterialTheme.typography.labelMedium,
            color = Forest,
            modifier = Modifier.padding(top = 4.dp),
        )
    }
}

@Composable
private fun SectionHeader(title: String, subtitle: String) {
    Column {
        Text(text = title, style = MaterialTheme.typography.titleLarge, color = Ink)
        Text(text = subtitle, style = MaterialTheme.typography.labelMedium, color = SandLight)
    }
}
