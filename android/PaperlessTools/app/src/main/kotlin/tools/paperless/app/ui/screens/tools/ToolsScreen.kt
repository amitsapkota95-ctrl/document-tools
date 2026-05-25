package tools.paperless.app.ui.screens.tools

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import tools.paperless.app.models.ToolDestination
import tools.paperless.app.models.ToolRegistry
import tools.paperless.app.models.destinationFor
import tools.paperless.app.ui.components.ToolCard
import tools.paperless.app.ui.theme.Ink
import tools.paperless.app.ui.theme.Paper
import tools.paperless.app.ui.theme.SandLight

@Composable
fun ToolsScreen(onNavigateToTool: (ToolDestination) -> Unit) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Paper)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        item {
            Text(
                text = "Tools",
                style = MaterialTheme.typography.headlineLarge,
                color = Ink,
            )
        }

        items(ToolRegistry.categories) { category ->
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = category.title,
                    style = MaterialTheme.typography.titleLarge,
                    color = Ink,
                )
                Text(
                    text = "${category.tools.size} tools",
                    style = MaterialTheme.typography.labelMedium,
                    color = SandLight,
                )

                category.tools.forEach { tool ->
                    destinationFor(tool.slug)?.let { destination ->
                        ToolCard(
                            tool = tool,
                            modifier = Modifier.clickable { onNavigateToTool(destination) },
                        )
                    }
                }
            }
        }
    }
}
