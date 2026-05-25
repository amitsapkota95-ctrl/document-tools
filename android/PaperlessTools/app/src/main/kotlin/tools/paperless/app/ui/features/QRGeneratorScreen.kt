package tools.paperless.app.ui.features

import android.graphics.Bitmap
import android.graphics.Color
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.unit.dp
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import tools.paperless.app.models.QRContentType
import tools.paperless.app.models.QRFormState
import tools.paperless.app.models.WifiSecurity
import tools.paperless.app.services.QREncodeService
import tools.paperless.app.ui.components.PaperlessTextField
import tools.paperless.app.ui.components.PrivacyBadge
import tools.paperless.app.ui.theme.Cream
import tools.paperless.app.ui.theme.Ink
import tools.paperless.app.ui.theme.Paper
import tools.paperless.app.ui.theme.PaperlessThemeValues
import tools.paperless.app.ui.theme.SandLight

@Composable
fun QRGeneratorScreen() {
    var form by remember { mutableStateOf(QRFormState()) }

    val encodeResult = remember(form) { QREncodeService.encode(form) }
    val qrBitmap = remember(encodeResult) {
        if (!encodeResult.isValid) null else generateQrBitmap(encodeResult.payload, 512)
    }

    Column(
        modifier = Modifier.fillMaxSize().background(Paper).verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text("Create QR codes for links, WiFi, contacts, and more.", style = MaterialTheme.typography.bodyMedium, color = Ink)

        QRContentType.entries.forEach { type ->
            FilterChip(
                selected = form.contentType == type,
                onClick = { form = form.copy(contentType = type) },
                label = { Text(type.label) },
            )
        }

        Column(
            modifier = Modifier.fillMaxWidth().background(Cream, RoundedCornerShape(PaperlessThemeValues.CardCornerRadius.dp)).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            when (form.contentType) {
                QRContentType.WEBSITE -> PaperlessTextField(form.websiteUrl, { form = form.copy(websiteUrl = it) }, label = "Website URL")
                QRContentType.WIFI -> {
                    PaperlessTextField(form.wifiSsid, { form = form.copy(wifiSsid = it) }, label = "Network name (SSID)")
                    PaperlessTextField(form.wifiPassword, { form = form.copy(wifiPassword = it) }, label = "Password")
                    WifiSecurity.entries.forEach { security ->
                        FilterChip(selected = form.wifiSecurity == security, onClick = { form = form.copy(wifiSecurity = security) }, label = { Text(security.label) })
                    }
                }
                QRContentType.CONTACT -> {
                    PaperlessTextField(form.contactFirstName, { form = form.copy(contactFirstName = it) }, label = "First name")
                    PaperlessTextField(form.contactLastName, { form = form.copy(contactLastName = it) }, label = "Last name")
                    PaperlessTextField(form.contactPhone, { form = form.copy(contactPhone = it) }, label = "Phone")
                    PaperlessTextField(form.contactEmail, { form = form.copy(contactEmail = it) }, label = "Email")
                }
                QRContentType.TEXT -> PaperlessTextField(form.textContent, { form = form.copy(textContent = it) }, label = "Text", singleLine = false, minLines = 4)
                QRContentType.EMAIL -> {
                    PaperlessTextField(form.emailAddress, { form = form.copy(emailAddress = it) }, label = "Email")
                    PaperlessTextField(form.emailSubject, { form = form.copy(emailSubject = it) }, label = "Subject")
                    PaperlessTextField(form.emailBody, { form = form.copy(emailBody = it) }, label = "Body", singleLine = false, minLines = 3)
                }
                QRContentType.SMS -> {
                    PaperlessTextField(form.smsPhone, { form = form.copy(smsPhone = it) }, label = "Phone")
                    PaperlessTextField(form.smsMessage, { form = form.copy(smsMessage = it) }, label = "Message", singleLine = false, minLines = 3)
                }
                QRContentType.PHONE -> PaperlessTextField(form.phoneNumber, { form = form.copy(phoneNumber = it) }, label = "Phone number")
                QRContentType.LOCATION -> {
                    PaperlessTextField(form.locationLatitude, { form = form.copy(locationLatitude = it) }, label = "Latitude")
                    PaperlessTextField(form.locationLongitude, { form = form.copy(locationLongitude = it) }, label = "Longitude")
                    PaperlessTextField(form.locationLabel, { form = form.copy(locationLabel = it) }, label = "Label")
                }
                QRContentType.EVENT -> {
                    PaperlessTextField(form.eventTitle, { form = form.copy(eventTitle = it) }, label = "Event title")
                    PaperlessTextField(form.eventLocation, { form = form.copy(eventLocation = it) }, label = "Location")
                    PaperlessTextField(form.eventDescription, { form = form.copy(eventDescription = it) }, label = "Description", singleLine = false, minLines = 3)
                }
            }
        }

        if (!encodeResult.isValid) {
            Text(encodeResult.hint, style = MaterialTheme.typography.bodyMedium, color = SandLight)
        } else {
            qrBitmap?.let { bitmap ->
                Image(
                    bitmap = bitmap.asImageBitmap(),
                    contentDescription = "QR Code",
                    modifier = Modifier.size(240.dp).background(androidx.compose.ui.graphics.Color.White, RoundedCornerShape(12.dp)).padding(12.dp),
                )
                encodeResult.detailLines.forEach { line ->
                    Text(line, style = MaterialTheme.typography.bodyMedium, color = Ink)
                }
            }
        }

        PrivacyBadge()
    }
}

private fun generateQrBitmap(content: String, size: Int): Bitmap? = runCatching {
    val matrix = QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, size, size)
    Bitmap.createBitmap(size, size, Bitmap.Config.RGB_565).apply {
        for (x in 0 until size) {
            for (y in 0 until size) {
                setPixel(x, y, if (matrix[x, y]) Color.BLACK else Color.WHITE)
            }
        }
    }
}.getOrNull()
