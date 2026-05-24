import SwiftUI

struct QRToolsView: View {
    @State private var mode: QRMode = .create

    enum QRMode: String, CaseIterable {
        case create = "Create"
        case scan = "Scan"
    }

    var body: some View {
        VStack(spacing: 0) {
            Picker("Mode", selection: $mode) {
                ForEach(QRMode.allCases, id: \.self) { item in
                    Text(item.rawValue).tag(item)
                }
            }
            .pickerStyle(.segmented)
            .padding()

            if mode == .create {
                QRGeneratorView()
            } else {
                QRScannerView()
            }
        }
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle("QR Code")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct QRGeneratorView: View {
    @State private var form = QRFormState()
    @State private var showShareSheet = false
    @State private var shareImage: UIImage?
    @State private var copied = false

    private var encoded: QREncodeResult {
        QRPayloadEncoder.encode(form: form)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if form.contentType == .website && form.websiteURL.isEmpty {
                    QRTypeSelector(selectedType: $form.contentType)
                } else {
                    qrPreviewSection
                    formSection
                    exportSection
                }
            }
            .padding(20)
        }
        .background(Color.paper.ignoresSafeArea())
        .sheet(isPresented: $showShareSheet) {
            if let shareImage {
                ShareSheet(items: [shareImage])
            }
        }
        .sensoryFeedback(.success, trigger: copied)
    }

    private var qrPreviewSection: some View {
        VStack(spacing: 12) {
            if encoded.isValid, let image = QRImageGenerator.generateImage(from: encoded.payload) {
                Image(uiImage: image)
                    .interpolation(.none)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 220, height: 220)
                    .padding(16)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.forest.opacity(0.3), lineWidth: 2)
                    )
            } else {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.cream200)
                    .frame(width: 220, height: 220)
                    .overlay {
                        Text(encoded.hint.isEmpty ? "Fill in the form" : encoded.hint)
                            .font(.captionText)
                            .foregroundStyle(Color.sandLight)
                            .multilineTextAlignment(.center)
                            .padding()
                    }
            }

            if !encoded.detailLines.isEmpty {
                VStack(spacing: 4) {
                    Text(encoded.title)
                        .font(.cardTitle)
                    ForEach(encoded.detailLines, id: \.self) { line in
                        Text(line)
                            .font(.captionText)
                            .foregroundStyle(Color.sandLight)
                    }
                }
            }

            PrivacyBadge()
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }

    private var formSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(QRContentType.allCases) { type in
                        Button {
                            form.contentType = type
                        } label: {
                            Text(type.label)
                                .font(.captionText.weight(.semibold))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(form.contentType == type ? Color.forest : Color.cream200)
                                .foregroundStyle(form.contentType == type ? Color.white : Color.ink)
                                .clipShape(Capsule())
                        }
                    }
                }
            }

            QRFormFields(form: $form)
        }
        .padding(16)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }

    private var exportSection: some View {
        VStack(spacing: 12) {
            PrimaryButton(title: "Share PNG", icon: "square.and.arrow.up", isDisabled: !encoded.isValid) {
                if let image = QRImageGenerator.generateImage(from: encoded.payload, size: 1024) {
                    shareImage = image
                    showShareSheet = true
                }
            }

            Button {
                UIPasteboard.general.string = encoded.payload
                copied = true
            } label: {
                HStack {
                    Image(systemName: copied ? "checkmark" : "doc.on.doc")
                    Text(copied ? "Copied!" : "Copy encoded data")
                }
                .font(.buttonLabel)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .foregroundStyle(Color.forest)
                .background(Color.forest50)
                .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.buttonCornerRadius))
            }
            .disabled(!encoded.isValid)
        }
    }
}

struct QRTypeSelector: View {
    @Binding var selectedType: QRContentType

    var body: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            ForEach(QRContentType.allCases) { type in
                Button {
                    selectedType = type
                } label: {
                    VStack(spacing: 8) {
                        Image(systemName: type.iconName)
                            .font(.title2)
                            .foregroundStyle(Color.forest)
                        Text(type.label)
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(Color.ink)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.cream)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .buttonStyle(.plain)
            }
        }
    }
}

struct QRFormFields: View {
    @Binding var form: QRFormState

    var body: some View {
        Group {
            switch form.contentType {
            case .website:
                FormField(title: "Website URL", text: $form.websiteURL, placeholder: "example.com")
            case .wifi:
                FormField(title: "Network Name (SSID)", text: $form.wifiSSID, placeholder: "My WiFi")
                FormField(title: "Password", text: $form.wifiPassword, placeholder: "Password", isSecure: form.wifiSecurity != .nopass)
                Picker("Security", selection: $form.wifiSecurity) {
                    ForEach(WifiSecurity.allCases) { security in
                        Text(security.label).tag(security)
                    }
                }
                Toggle("Hidden network", isOn: $form.wifiHidden)
            case .contact:
                FormField(title: "First Name", text: $form.contactFirstName)
                FormField(title: "Last Name", text: $form.contactLastName)
                FormField(title: "Phone", text: $form.contactPhone, keyboard: .phonePad)
                FormField(title: "Email", text: $form.contactEmail, keyboard: .emailAddress)
                FormField(title: "Organization", text: $form.contactOrganization)
                FormField(title: "Job Title", text: $form.contactTitle)
                FormField(title: "Website", text: $form.contactWebsite)
            case .text:
                FormField(title: "Message", text: $form.textContent, placeholder: "Your message", axis: .vertical)
            case .email:
                FormField(title: "Email Address", text: $form.emailAddress, keyboard: .emailAddress)
                FormField(title: "Subject", text: $form.emailSubject)
                FormField(title: "Body", text: $form.emailBody, axis: .vertical)
            case .sms:
                FormField(title: "Phone Number", text: $form.smsPhone, keyboard: .phonePad)
                FormField(title: "Message", text: $form.smsMessage, axis: .vertical)
            case .phone:
                FormField(title: "Phone Number", text: $form.phoneNumber, keyboard: .phonePad)
            case .location:
                FormField(title: "Label", text: $form.locationLabel, placeholder: "Place name")
                FormField(title: "Latitude", text: $form.locationLatitude, keyboard: .decimalPad)
                FormField(title: "Longitude", text: $form.locationLongitude, keyboard: .decimalPad)
            case .event:
                FormField(title: "Event Title", text: $form.eventTitle)
                DatePicker("Start", selection: $form.eventStartDate)
                DatePicker("End", selection: $form.eventEndDate)
                FormField(title: "Location", text: $form.eventLocation)
                FormField(title: "Description", text: $form.eventDescription, axis: .vertical)
            }
        }
    }
}

struct FormField: View {
    let title: String
    @Binding var text: String
    var placeholder: String = ""
    var keyboard: UIKeyboardType = .default
    var isSecure: Bool = false
    var axis: Axis = .horizontal

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.captionText.weight(.semibold))
                .foregroundStyle(Color.sandLight)
            if axis == .vertical {
                TextField(placeholder, text: $text, axis: .vertical)
                    .lineLimit(3...6)
                    .textFieldStyle(PaperlessTextFieldStyle())
            } else if isSecure {
                SecureField(placeholder, text: $text)
                    .textFieldStyle(PaperlessTextFieldStyle())
            } else {
                TextField(placeholder, text: $text)
                    .keyboardType(keyboard)
                    .textInputAutocapitalization(keyboard == .emailAddress ? .never : .sentences)
                    .autocorrectionDisabled(keyboard == .emailAddress || keyboard == .decimalPad)
                    .textFieldStyle(PaperlessTextFieldStyle())
            }
        }
    }
}

struct PaperlessTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(12)
            .background(Color.cream200)
            .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
