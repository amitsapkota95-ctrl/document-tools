package tools.paperless.app.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import tools.paperless.app.models.ToolDestination
import tools.paperless.app.models.title
import tools.paperless.app.ui.features.CompareTextScreen
import tools.paperless.app.ui.features.CompressPdfScreen
import tools.paperless.app.ui.features.CropPdfScreen
import tools.paperless.app.ui.features.DocumentScannerScreen
import tools.paperless.app.ui.features.ExtractTextScreen
import tools.paperless.app.ui.features.FillAndSignScreen
import tools.paperless.app.ui.features.ImageToPdfScreen
import tools.paperless.app.ui.features.InvoiceBuilderScreen
import tools.paperless.app.ui.features.MergePdfScreen
import tools.paperless.app.ui.features.PdfToImageScreen
import tools.paperless.app.ui.features.QRGeneratorScreen
import tools.paperless.app.ui.features.QRScannerScreen
import tools.paperless.app.ui.features.RedactPdfScreen
import tools.paperless.app.ui.features.SplitPdfScreen
import tools.paperless.app.ui.features.TeleprompterScreen
import tools.paperless.app.ui.features.UrlShortenerScreen
import tools.paperless.app.ui.screens.home.HomeScreen
import tools.paperless.app.ui.screens.scan.ScanTabScreen
import tools.paperless.app.ui.screens.settings.SettingsScreen
import tools.paperless.app.ui.screens.tools.ToolsScreen
import tools.paperless.app.ui.theme.Forest
import tools.paperless.app.ui.theme.Paper

private enum class MainTab(val route: String, val label: String, val icon: ImageVector) {
    HOME("home", "Home", Icons.Default.Home),
    TOOLS("tools", "Tools", Icons.Default.GridView),
    SCAN("scan", "Scan", Icons.Default.QrCodeScanner),
    SETTINGS("settings", "Settings", Icons.Default.Settings),
}

@Composable
fun PaperlessNavHost() {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val showBottomBar = currentRoute in MainTab.entries.map { it.route }

    Scaffold(
        containerColor = Paper,
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(containerColor = Paper) {
                    MainTab.entries.forEach { tab ->
                        NavigationBarItem(
                            selected = currentRoute == tab.route,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = tab.label) },
                            label = { Text(tab.label) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = Forest,
                                selectedTextColor = Forest,
                                indicatorColor = Forest.copy(alpha = 0.12f),
                            ),
                        )
                    }
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = MainTab.HOME.route,
            modifier = Modifier.padding(padding),
        ) {
            composable(MainTab.HOME.route) {
                HomeScreen(
                    onNavigateToTool = { navController.navigateTool(it) },
                    onNavigateToToolsTab = { navController.navigate(MainTab.TOOLS.route) },
                )
            }
            composable(MainTab.TOOLS.route) {
                ToolsScreen(onNavigateToTool = { navController.navigateTool(it) })
            }
            composable(MainTab.SCAN.route) {
                ScanTabScreen(onNavigateToTool = { navController.navigateTool(it) })
            }
            composable(MainTab.SETTINGS.route) {
                SettingsScreen()
            }

            toolDestination(navController, ToolDestination.QR_TOOLS) { QRGeneratorScreen() }
            toolDestination(navController, ToolDestination.URL_SHORTENER) { UrlShortenerScreen() }
            toolDestination(navController, ToolDestination.DOCUMENT_SCANNER) { DocumentScannerScreen() }
            toolDestination(navController, ToolDestination.MERGE_PDF) { MergePdfScreen() }
            toolDestination(navController, ToolDestination.SPLIT_PDF) { SplitPdfScreen() }
            toolDestination(navController, ToolDestination.COMPRESS_PDF) { CompressPdfScreen() }
            toolDestination(navController, ToolDestination.PDF_TO_IMAGE) { PdfToImageScreen() }
            toolDestination(navController, ToolDestination.FILL_AND_SIGN) { FillAndSignScreen() }
            toolDestination(navController, ToolDestination.IMAGE_TO_PDF) { ImageToPdfScreen() }
            toolDestination(navController, ToolDestination.REDACT_PDF) { RedactPdfScreen() }
            toolDestination(navController, ToolDestination.CROP_PDF) { CropPdfScreen() }
            toolDestination(navController, ToolDestination.EXTRACT_TEXT) { ExtractTextScreen() }
            toolDestination(navController, ToolDestination.COMPARE_TEXT) { CompareTextScreen() }
            toolDestination(navController, ToolDestination.INVOICE_BUILDER) { InvoiceBuilderScreen() }
            toolDestination(navController, ToolDestination.TELEPROMPTER) { TeleprompterScreen() }
            toolDestination(navController, ToolDestination.QR_SCANNER) { QRScannerScreen() }
        }
    }
}

private fun NavGraphBuilder.toolDestination(
    navController: NavHostController,
    destination: ToolDestination,
    content: @Composable () -> Unit,
) {
    composable("tool/${destination.name}") {
        ToolScaffold(
            title = destination.title(),
            onBack = { navController.popBackStack() },
            content = content,
        )
    }
}

private fun NavHostController.navigateTool(destination: ToolDestination) {
    navigate("tool/${destination.name}")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ToolScaffold(
    title: String,
    onBack: () -> Unit,
    content: @Composable () -> Unit,
) {
    Scaffold(
        containerColor = Paper,
        topBar = {
            TopAppBar(
                title = { Text(title) },
                navigationIcon = {
                    IconButton(onClick = { onBack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Paper),
            )
        },
    ) { padding ->
        Box(Modifier.padding(padding)) {
            content()
        }
    }
}
