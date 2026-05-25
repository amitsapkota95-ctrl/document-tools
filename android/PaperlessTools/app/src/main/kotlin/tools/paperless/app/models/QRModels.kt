package tools.paperless.app.models

enum class QRContentType(val label: String, val description: String) {
    WEBSITE("Website Link", "Share a URL that opens in the browser."),
    WIFI("WiFi Login", "Let guests join your network without typing a password."),
    CONTACT("Contact Card", "Save a vCard contact with one scan."),
    TEXT("Plain Text", "Encode any message or note."),
    EMAIL("Email", "Open a pre-filled email draft."),
    SMS("Text Message", "Send a text message with optional body."),
    PHONE("Phone Call", "Dial a phone number instantly."),
    LOCATION("Location", "Open a location in maps."),
    EVENT("Event / Meeting", "Add a calendar event from a scan."),
}

enum class WifiSecurity(val rawValue: String, val label: String) {
    WPA("WPA", "WPA/WPA2"),
    WEP("WEP", "WEP"),
    NOPASS("nopass", "Open"),
}

data class QREncodeResult(
    val payload: String,
    val isValid: Boolean,
    val hint: String,
    val title: String,
    val detailLines: List<String> = emptyList(),
)

data class QRFormState(
    val contentType: QRContentType = QRContentType.WEBSITE,
    val websiteUrl: String = "",
    val wifiSsid: String = "",
    val wifiPassword: String = "",
    val wifiSecurity: WifiSecurity = WifiSecurity.WPA,
    val wifiHidden: Boolean = false,
    val contactFirstName: String = "",
    val contactLastName: String = "",
    val contactPhone: String = "",
    val contactEmail: String = "",
    val contactOrganization: String = "",
    val contactTitle: String = "",
    val contactWebsite: String = "",
    val textContent: String = "",
    val emailAddress: String = "",
    val emailSubject: String = "",
    val emailBody: String = "",
    val smsPhone: String = "",
    val smsMessage: String = "",
    val phoneNumber: String = "",
    val locationLatitude: String = "",
    val locationLongitude: String = "",
    val locationLabel: String = "",
    val eventTitle: String = "",
    val eventLocation: String = "",
    val eventDescription: String = "",
)
