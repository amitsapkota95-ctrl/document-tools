package tools.paperless.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import tools.paperless.app.ui.navigation.PaperlessNavHost
import tools.paperless.app.ui.theme.PaperlessTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            PaperlessTheme {
                PaperlessNavHost()
            }
        }
    }
}
