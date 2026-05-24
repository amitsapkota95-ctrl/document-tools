import Foundation

enum QRContentType: String, CaseIterable, Identifiable {
    case website
    case wifi
    case contact
    case text
    case email
    case sms
    case phone
    case location
    case event

    var id: String { rawValue }

    var label: String {
        switch self {
        case .website: return "Website Link"
        case .wifi: return "WiFi Login"
        case .contact: return "Contact Card"
        case .text: return "Plain Text"
        case .email: return "Email"
        case .sms: return "Text Message"
        case .phone: return "Phone Call"
        case .location: return "Location"
        case .event: return "Event / Meeting"
        }
    }

    var description: String {
        switch self {
        case .website: return "Share a URL that opens in the browser."
        case .wifi: return "Let guests join your network without typing a password."
        case .contact: return "Save a vCard contact with one scan."
        case .text: return "Encode any message or note."
        case .email: return "Open a pre-filled email draft."
        case .sms: return "Send a text message with optional body."
        case .phone: return "Dial a phone number instantly."
        case .location: return "Open a location in maps."
        case .event: return "Add a calendar event from a scan."
        }
    }

    var iconName: String {
        switch self {
        case .website: return "link"
        case .wifi: return "wifi"
        case .contact: return "person.crop.rectangle"
        case .text: return "text.alignleft"
        case .email: return "envelope"
        case .sms: return "message"
        case .phone: return "phone"
        case .location: return "mappin.and.ellipse"
        case .event: return "calendar"
        }
    }
}

enum WifiSecurity: String, CaseIterable, Identifiable {
    case wpa = "WPA"
    case wep = "WEP"
    case nopass = "nopass"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .wpa: return "WPA/WPA2"
        case .wep: return "WEP"
        case .nopass: return "Open"
        }
    }
}

struct QREncodeResult {
    let payload: String
    let isValid: Bool
    let hint: String
    let title: String
    let detailLines: [String]
}

struct QRFormState {
    var contentType: QRContentType = .website

    // Website
    var websiteURL: String = ""

    // WiFi
    var wifiSSID: String = ""
    var wifiPassword: String = ""
    var wifiSecurity: WifiSecurity = .wpa
    var wifiHidden: Bool = false

    // Contact
    var contactFirstName: String = ""
    var contactLastName: String = ""
    var contactPhone: String = ""
    var contactEmail: String = ""
    var contactOrganization: String = ""
    var contactTitle: String = ""
    var contactWebsite: String = ""

    // Text
    var textContent: String = ""

    // Email
    var emailAddress: String = ""
    var emailSubject: String = ""
    var emailBody: String = ""

    // SMS / Phone
    var smsPhone: String = ""
    var smsMessage: String = ""
    var phoneNumber: String = ""

    // Location
    var locationLatitude: String = ""
    var locationLongitude: String = ""
    var locationLabel: String = ""

    // Event
    var eventTitle: String = ""
    var eventStartDate: Date = .now
    var eventEndDate: Date = .now.addingTimeInterval(3600)
    var eventLocation: String = ""
    var eventDescription: String = ""
}
