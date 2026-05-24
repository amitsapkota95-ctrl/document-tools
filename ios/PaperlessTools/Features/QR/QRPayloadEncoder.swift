import Foundation

enum QRPayloadEncoder {
    static func encode(form: QRFormState) -> QREncodeResult {
        switch form.contentType {
        case .website:
            return encodeWebsite(url: form.websiteURL)
        case .wifi:
            return encodeWifi(
                ssid: form.wifiSSID,
                password: form.wifiPassword,
                security: form.wifiSecurity,
                hidden: form.wifiHidden
            )
        case .contact:
            return encodeContact(
                firstName: form.contactFirstName,
                lastName: form.contactLastName,
                phone: form.contactPhone,
                email: form.contactEmail,
                organization: form.contactOrganization,
                title: form.contactTitle,
                website: form.contactWebsite
            )
        case .text:
            return encodeText(content: form.textContent)
        case .email:
            return encodeEmail(address: form.emailAddress, subject: form.emailSubject, body: form.emailBody)
        case .sms:
            return encodeSMS(phone: form.smsPhone, message: form.smsMessage)
        case .phone:
            return encodePhone(phone: form.phoneNumber)
        case .location:
            return encodeLocation(
                latitude: form.locationLatitude,
                longitude: form.locationLongitude,
                label: form.locationLabel
            )
        case .event:
            return encodeEvent(
                title: form.eventTitle,
                startDate: form.eventStartDate,
                endDate: form.eventEndDate,
                location: form.eventLocation,
                description: form.eventDescription
            )
        }
    }

    private static func escapeVCard(_ value: String) -> String {
        value
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: ";", with: "\\;")
            .replacingOccurrences(of: ",", with: "\\,")
            .replacingOccurrences(of: "\n", with: "\\n")
    }

    private static func escapeWifi(_ value: String) -> String {
        value
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: ";", with: "\\;")
            .replacingOccurrences(of: ":", with: "\\:")
            .replacingOccurrences(of: "\"", with: "\\\"")
    }

    private static func normalizeURL(_ url: String) -> String {
        let trimmed = url.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return "" }
        if trimmed.lowercased().hasPrefix("http://") || trimmed.lowercased().hasPrefix("https://") {
            return trimmed
        }
        return "https://\(trimmed)"
    }

    private static func encodeWebsite(url: String) -> QREncodeResult {
        let normalized = normalizeURL(url)
        guard !normalized.isEmpty else {
            return QREncodeResult(
                payload: "",
                isValid: false,
                hint: "Enter a website URL to generate your QR code.",
                title: QRContentType.website.label,
                detailLines: []
            )
        }
        return QREncodeResult(
            payload: normalized,
            isValid: true,
            hint: "",
            title: QRContentType.website.label,
            detailLines: [normalized]
        )
    }

    private static func encodeWifi(
        ssid: String,
        password: String,
        security: WifiSecurity,
        hidden: Bool
    ) -> QREncodeResult {
        let trimmedSSID = ssid.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedSSID.isEmpty else {
            return QREncodeResult(
                payload: "",
                isValid: false,
                hint: "Enter a network name (SSID) to generate your QR code.",
                title: QRContentType.wifi.label,
                detailLines: []
            )
        }

        let escapedPassword = security == .nopass ? "" : escapeWifi(password)
        let payload = "WIFI:T:\(security.rawValue);S:\(escapeWifi(trimmedSSID));P:\(escapedPassword);H:\(hidden ? "true" : "false");;"

        return QREncodeResult(
            payload: payload,
            isValid: true,
            hint: "",
            title: QRContentType.wifi.label,
            detailLines: [trimmedSSID, security == .nopass ? "Open network" : "Secured network"]
        )
    }

    private static func encodeContact(
        firstName: String,
        lastName: String,
        phone: String,
        email: String,
        organization: String,
        title: String,
        website: String
    ) -> QREncodeResult {
        let first = firstName.trimmingCharacters(in: .whitespacesAndNewlines)
        let last = lastName.trimmingCharacters(in: .whitespacesAndNewlines)
        let fullName = [first, last].filter { !$0.isEmpty }.joined(separator: " ")
        let trimmedPhone = phone.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !fullName.isEmpty || !trimmedPhone.isEmpty || !trimmedEmail.isEmpty else {
            return QREncodeResult(
                payload: "",
                isValid: false,
                hint: "Add a name, phone number, or email to generate a contact card.",
                title: QRContentType.contact.label,
                detailLines: []
            )
        }

        var lines = ["BEGIN:VCARD", "VERSION:3.0"]
        if !fullName.isEmpty { lines.append("FN:\(escapeVCard(fullName))") }
        if !first.isEmpty { lines.append("N:\(escapeVCard(last));\(escapeVCard(first));;;") }
        if !trimmedPhone.isEmpty { lines.append("TEL:\(escapeVCard(trimmedPhone))") }
        if !trimmedEmail.isEmpty { lines.append("EMAIL:\(escapeVCard(trimmedEmail))") }
        if !organization.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            lines.append("ORG:\(escapeVCard(organization.trimmingCharacters(in: .whitespacesAndNewlines)))")
        }
        if !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            lines.append("TITLE:\(escapeVCard(title.trimmingCharacters(in: .whitespacesAndNewlines)))")
        }
        if !website.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            lines.append("URL:\(escapeVCard(normalizeURL(website)))")
        }
        lines.append("END:VCARD")

        var detailLines = [fullName.isEmpty ? "Contact card" : fullName]
        if !trimmedPhone.isEmpty { detailLines.append(trimmedPhone) }
        if !trimmedEmail.isEmpty { detailLines.append(trimmedEmail) }

        return QREncodeResult(
            payload: lines.joined(separator: "\n"),
            isValid: true,
            hint: "",
            title: QRContentType.contact.label,
            detailLines: detailLines
        )
    }

    private static func encodeText(content: String) -> QREncodeResult {
        guard !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return QREncodeResult(
                payload: "",
                isValid: false,
                hint: "Type your message to generate a QR code.",
                title: QRContentType.text.label,
                detailLines: []
            )
        }
        let preview = content.count > 80 ? String(content.prefix(80)) + "…" : content
        return QREncodeResult(
            payload: content,
            isValid: true,
            hint: "",
            title: QRContentType.text.label,
            detailLines: [preview]
        )
    }

    private static func encodeEmail(address: String, subject: String, body: String) -> QREncodeResult {
        let trimmed = address.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return QREncodeResult(
                payload: "",
                isValid: false,
                hint: "Enter an email address to generate your QR code.",
                title: QRContentType.email.label,
                detailLines: []
            )
        }

        var params: [String] = []
        let trimmedSubject = subject.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedBody = body.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedSubject.isEmpty {
            params.append("subject=\(trimmedSubject.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? trimmedSubject)")
        }
        if !trimmedBody.isEmpty {
            params.append("body=\(trimmedBody.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? trimmedBody)")
        }

        let payload = params.isEmpty ? "mailto:\(trimmed)" : "mailto:\(trimmed)?\(params.joined(separator: "&"))"
        var detailLines = [trimmed]
        if !trimmedSubject.isEmpty { detailLines.append(trimmedSubject) }

        return QREncodeResult(
            payload: payload,
            isValid: true,
            hint: "",
            title: QRContentType.email.label,
            detailLines: detailLines
        )
    }

    private static func encodeSMS(phone: String, message: String) -> QREncodeResult {
        let trimmed = phone.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return QREncodeResult(
                payload: "",
                isValid: false,
                hint: "Enter a phone number to generate your QR code.",
                title: QRContentType.sms.label,
                detailLines: []
            )
        }

        let trimmedMessage = message.trimmingCharacters(in: .whitespacesAndNewlines)
        let payload: String
        if trimmedMessage.isEmpty {
            payload = "sms:\(trimmed)"
        } else {
            let encoded = trimmedMessage.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? trimmedMessage
            payload = "sms:\(trimmed)?body=\(encoded)"
        }

        return QREncodeResult(
            payload: payload,
            isValid: true,
            hint: "",
            title: QRContentType.sms.label,
            detailLines: [trimmed, trimmedMessage.isEmpty ? "No preset message" : trimmedMessage]
        )
    }

    private static func encodePhone(phone: String) -> QREncodeResult {
        let trimmed = phone.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return QREncodeResult(
                payload: "",
                isValid: false,
                hint: "Enter a phone number to generate your QR code.",
                title: QRContentType.phone.label,
                detailLines: []
            )
        }
        return QREncodeResult(
            payload: "tel:\(trimmed)",
            isValid: true,
            hint: "",
            title: QRContentType.phone.label,
            detailLines: [trimmed]
        )
    }

    private static func encodeLocation(latitude: String, longitude: String, label: String) -> QREncodeResult {
        let lat = latitude.trimmingCharacters(in: .whitespacesAndNewlines)
        let lng = longitude.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !lat.isEmpty, !lng.isEmpty else {
            return QREncodeResult(
                payload: "",
                isValid: false,
                hint: "Enter coordinates or search for a place.",
                title: QRContentType.location.label,
                detailLines: []
            )
        }
        guard let latNum = Double(lat), let lngNum = Double(lng) else {
            return QREncodeResult(
                payload: "",
                isValid: false,
                hint: "Latitude and longitude must be valid numbers.",
                title: QRContentType.location.label,
                detailLines: []
            )
        }

        let trimmedLabel = label.trimmingCharacters(in: .whitespacesAndNewlines)
        let payload: String
        if trimmedLabel.isEmpty {
            payload = "geo:\(latNum),\(lngNum)"
        } else {
            let encoded = trimmedLabel.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? trimmedLabel
            payload = "geo:\(latNum),\(lngNum)?q=\(encoded)"
        }

        return QREncodeResult(
            payload: payload,
            isValid: true,
            hint: "",
            title: QRContentType.location.label,
            detailLines: [trimmedLabel.isEmpty ? "\(latNum), \(lngNum)" : trimmedLabel]
        )
    }

    private static func encodeEvent(
        title: String,
        startDate: Date,
        endDate: Date,
        location: String,
        description: String
    ) -> QREncodeResult {
        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedTitle.isEmpty else {
            return QREncodeResult(
                payload: "",
                isValid: false,
                hint: "Enter an event title to generate your QR code.",
                title: QRContentType.event.label,
                detailLines: []
            )
        }

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyyMMdd'T'HHmmss"
        formatter.timeZone = TimeZone.current

        var lines = [
            "BEGIN:VEVENT",
            "SUMMARY:\(escapeVCard(trimmedTitle))",
            "DTSTART:\(formatter.string(from: startDate))",
            "DTEND:\(formatter.string(from: endDate))",
        ]

        let trimmedLocation = location.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedDescription = description.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedLocation.isEmpty { lines.append("LOCATION:\(escapeVCard(trimmedLocation))") }
        if !trimmedDescription.isEmpty { lines.append("DESCRIPTION:\(escapeVCard(trimmedDescription))") }
        lines.append("END:VEVENT")

        var detailLines = [trimmedTitle]
        detailLines.append(formatter.string(from: startDate))
        if !trimmedLocation.isEmpty { detailLines.append(trimmedLocation) }

        return QREncodeResult(
            payload: lines.joined(separator: "\n"),
            isValid: true,
            hint: "",
            title: QRContentType.event.label,
            detailLines: detailLines
        )
    }
}

enum FilenameHelper {
    static func sanitize(_ name: String, fallback: String = "document") -> String {
        let sanitized = name
            .replacingOccurrences(of: "[^\\w\\s.-]", with: "", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "\\s+", with: "-", options: .regularExpression)
        let clipped = String(sanitized.prefix(40))
        return clipped.isEmpty ? fallback : clipped
    }
}
