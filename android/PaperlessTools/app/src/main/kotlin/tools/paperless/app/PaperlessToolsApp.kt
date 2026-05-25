package tools.paperless.app

import android.app.Application
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader

class PaperlessToolsApp : Application() {
    override fun onCreate() {
        super.onCreate()
        PDFBoxResourceLoader.init(applicationContext)
    }
}
