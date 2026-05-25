package tools.paperless.app.services

import tools.paperless.app.models.QRContentType
import tools.paperless.app.models.QREncodeResult
import tools.paperless.app.models.QRFormState
import tools.paperless.app.models.WifiSecurity
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object QREncodeService {
    fun encode(form: QRFormState): QREncodeResult = when (form.contentType) {
        QRContentType.WEBSITE -> encodeWebsite(form.websiteUrl)
        QRContentType.WIFI -> encodeWifi(form)
        QRContentType.CONTACT -> encodeContact(form)
        QRContentType.TEXT -> encodeText(form.textContent)
        QRContentType.EMAIL -> encodeEmail(form)
        QRContentType.SMS -> encodeSms(form)
        QRContentType.PHONE -> encodePhone(form.phoneNumber)
        QRContentType.LOCATION -> encodeLocation(form)
        QRContentType.EVENT -> encodeEvent(form)
    }

    private fun encodeWebsite(url: String): QREncodeResult {
        val normalized = normalizeUrl(url)
        if (normalized.isEmpty()) {
            return invalid(QRContentType.WEBSITE.label, "Enter a website URL to generate your QR code.")
        }
        return QREncodeResult(
            payload = normalized,
            isValid = true,
            hint = "",
            title = QRContentType.WEBSITE.label,
            detailLines = listOf(normalized),
        )
    }

    private fun encodeWifi(form: QRFormState): QREncodeResult {
        val ssid = form.wifiSsid.trim()
        if (ssid.isEmpty()) {
            return invalid(QRContentType.WIFI.label, "Enter a network name (SSID) to generate your QR code.")
        }
        val password = if (form.wifiSecurity == WifiSecurity.NOPASS) "" else escapeWifi(form.wifiPassword)
        val payload = "WIFI:T:${form.wifiSecurity.rawValue};S:${escapeWifi(ssid)};P:$password;H:${if (form.wifiHidden) "true" else "false"};;"
        return QREncodeResult(
            payload = payload,
            isValid = true,
            hint = "",
            title = QRContentType.WIFI.label,
            detailLines = listOf(ssid, if (form.wifiSecurity == WifiSecurity.NOPASS) "Open network" else "Secured network"),
        )
    }

    private fun encodeContact(form: QRFormState): QREncodeResult {
        val fullName = listOf(form.contactFirstName.trim(), form.contactLastName.trim()).filter { it.isNotEmpty() }.joinToString(" ")
        if (fullName.isEmpty() && form.contactPhone.trim().isEmpty() && form.contactEmail.trim().isEmpty()) {
            return invalid(QRContentType.CONTACT.label, "Add a name, phone number, or email to generate a contact card.")
        }

        val lines = mutableListOf("BEGIN:VCARD", "VERSION:3.0")
        if (fullName.isNotEmpty()) lines += "FN:${escapeVCard(fullName)}"
        if (form.contactFirstName.isNotBlank()) {
            lines += "N:${escapeVCard(form.contactLastName.trim())};${escapeVCard(form.contactFirstName.trim())};;;"
        }
        if (form.contactPhone.isNotBlank()) lines += "TEL:${escapeVCard(form.contactPhone.trim())}"
        if (form.contactEmail.isNotBlank()) lines += "EMAIL:${escapeVCard(form.contactEmail.trim())}"
        if (form.contactOrganization.isNotBlank()) lines += "ORG:${escapeVCard(form.contactOrganization.trim())}"
        if (form.contactTitle.isNotBlank()) lines += "TITLE:${escapeVCard(form.contactTitle.trim())}"
        if (form.contactWebsite.isNotBlank()) lines += "URL:${escapeVCard(normalizeUrl(form.contactWebsite))}"
        lines += "END:VCARD"

        val detailLines = buildList {
            add(fullName.ifEmpty { "Contact card" })
            if (form.contactPhone.isNotBlank()) add(form.contactPhone.trim())
            if (form.contactEmail.isNotBlank()) add(form.contactEmail.trim())
        }

        return QREncodeResult(
            payload = lines.joinToString("\n"),
            isValid = true,
            hint = "",
            title = QRContentType.CONTACT.label,
            detailLines = detailLines,
        )
    }

    private fun encodeText(content: String): QREncodeResult {
        val trimmed = content.trim()
        if (trimmed.isEmpty()) {
            return invalid(QRContentType.TEXT.label, "Enter text to encode in the QR code.")
        }
        return QREncodeResult(
            payload = trimmed,
            isValid = true,
            hint = "",
            title = QRContentType.TEXT.label,
            detailLines = listOf(trimmed.take(80)),
        )
    }

    private fun encodeEmail(form: QRFormState): QREncodeResult {
        val address = form.emailAddress.trim()
        if (address.isEmpty()) {
            return invalid(QRContentType.EMAIL.label, "Enter an email address.")
        }
        val params = buildList<String>()
        if (form.emailSubject.isNotBlank()) params += "subject=${encodeParam(form.emailSubject.trim())}"
        if (form.emailBody.isNotBlank()) params += "body=${encodeParam(form.emailBody.trim())}"
        val payload = if (params.isEmpty()) "mailto:$address" else "mailto:$address?${params.joinToString("&")}"
        return QREncodeResult(
            payload = payload,
            isValid = true,
            hint = "",
            title = QRContentType.EMAIL.label,
            detailLines = listOf(address),
        )
    }

    private fun encodeSms(form: QRFormState): QREncodeResult {
        val phone = form.smsPhone.trim()
        if (phone.isEmpty()) {
            return invalid(QRContentType.SMS.label, "Enter a phone number.")
        }
        val payload = if (form.smsMessage.isBlank()) {
            "SMSTO:$phone:"
        } else {
            "SMSTO:$phone:${form.smsMessage.trim()}"
        }
        return QREncodeResult(
            payload = payload,
            isValid = true,
            hint = "",
            title = QRContentType.SMS.label,
            detailLines = listOf(phone),
        )
    }

    private fun encodePhone(number: String): QREncodeResult {
        val trimmed = number.trim()
        if (trimmed.isEmpty()) {
            return invalid(QRContentType.PHONE.label, "Enter a phone number.")
        }
        return QREncodeResult(
            payload = "tel:$trimmed",
            isValid = true,
            hint = "",
            title = QRContentType.PHONE.label,
            detailLines = listOf(trimmed),
        )
    }

    private fun encodeLocation(form: QRFormState): QREncodeResult {
        val lat = form.locationLatitude.trim()
        val lng = form.locationLongitude.trim()
        if (lat.isEmpty() || lng.isEmpty()) {
            return invalid(QRContentType.LOCATION.label, "Enter latitude and longitude.")
        }
        val label = form.locationLabel.trim()
        val payload = if (label.isEmpty()) "geo:$lat,$lng" else "geo:$lat,$lng?q=$lat,$lng(${encodeParam(label)})"
        return QREncodeResult(
            payload = payload,
            isValid = true,
            hint = "",
            title = QRContentType.LOCATION.label,
            detailLines = listOf("$lat, $lng"),
        )
    }

    private fun encodeEvent(form: QRFormState): QREncodeResult {
        val title = form.eventTitle.trim()
        if (title.isEmpty()) {
            return invalid(QRContentType.EVENT.label, "Enter an event title.")
        }
        val now = Date()
        val formatter = SimpleDateFormat("yyyyMMdd'T'HHmmss'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        val start = formatter.format(now)
        val end = formatter.format(Date(now.time + 3600_000))

        val lines = mutableListOf(
            "BEGIN:VEVENT",
            "SUMMARY:${escapeVCard(title)}",
            "DTSTART:$start",
            "DTEND:$end",
        )
        if (form.eventLocation.isNotBlank()) lines += "LOCATION:${escapeVCard(form.eventLocation.trim())}"
        if (form.eventDescription.isNotBlank()) lines += "DESCRIPTION:${escapeVCard(form.eventDescription.trim())}"
        lines += "END:VEVENT"

        return QREncodeResult(
            payload = lines.joinToString("\n"),
            isValid = true,
            hint = "",
            title = QRContentType.EVENT.label,
            detailLines = listOf(title),
        )
    }

    private fun invalid(title: String, hint: String) = QREncodeResult(
        payload = "",
        isValid = false,
        hint = hint,
        title = title,
    )

    private fun normalizeUrl(url: String): String {
        val trimmed = url.trim()
        if (trimmed.isEmpty()) return ""
        return if (trimmed.startsWith("http://", ignoreCase = true) || trimmed.startsWith("https://", ignoreCase = true)) {
            trimmed
        } else {
            "https://$trimmed"
        }
    }

    private fun escapeVCard(value: String): String =
        value.replace("\\", "\\\\")
            .replace(";", "\\;")
            .replace(",", "\\,")
            .replace("\n", "\\n")

    private fun escapeWifi(value: String): String =
        value.replace("\\", "\\\\")
            .replace(";", "\\;")
            .replace(":", "\\:")
            .replace("\"", "\\\"")

    private fun encodeParam(value: String): String =
        URLEncoder.encode(value, StandardCharsets.UTF_8.toString())
}
