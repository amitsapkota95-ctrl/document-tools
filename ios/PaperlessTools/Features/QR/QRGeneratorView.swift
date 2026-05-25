import SwiftUI

enum QRFormField: Hashable {
    case websiteURL
    case wifiSSID
    case wifiPassword
    case contactFirstName
    case contactLastName
    case contactPhone
    case contactEmail
    case contactOrganization
    case contactTitle
    case contactWebsite
    case textContent
    case emailAddress
    case emailSubject
    case emailBody
    case smsPhone
    case smsMessage
    case phoneNumber
    case locationLabel
    case locationLatitude
    case locationLongitude
    case eventTitle
    case eventLocation
    case eventDescription
}

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
    @FocusState private var focusedField: QRFormField?

    private var encoded: QREncodeResult {
        QRPayloadEncoder.encode(form: form)
    }

    private var isEditingField: Bool {
        focusedField != nil
    }

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(spacing: 20) {
                    if form.contentType == .website && form.websiteURL.isEmpty {
                        QRTypeSelector(selectedType: $form.contentType)
                    } else {
                        if isEditingField {
                            compactPreviewSection
                        } else {
                            qrPreviewSection
                        }
                        formSection
                        exportSection
                    }
                }
                .padding(20)
            }
            .scrollDismissesKeyboard(.interactively)
            .keyboardSafeArea()
            .onChange(of: focusedField) { _, field in
                guard let field else { return }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                    withAnimation {
                        proxy.scrollTo(field, anchor: .center)
                    }
                }
            }
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
            qrPreviewImage(size: 220, padding: 16, cornerRadius: 12)

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

        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }

    private var compactPreviewSection: some View {
        HStack(spacing: 12) {
            qrPreviewImage(size: 44, padding: 4, cornerRadius: 6)

            VStack(alignment: .leading, spacing: 2) {
                Text(encoded.title.isEmpty ? form.contentType.label : encoded.title)
                    .font(.bodyText.weight(.semibold))
                    .lineLimit(1)
                Text("Editing…")
                    .font(.caption2)
                    .foregroundStyle(Color.sandLight)
            }

            Spacer(minLength: 0)
        }
        .padding(12)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }

    @ViewBuilder
    private func qrPreviewImage(size: CGFloat, padding: CGFloat, cornerRadius: CGFloat) -> some View {
        if encoded.isValid, let image = QRImageGenerator.generateImage(from: encoded.payload) {
            Image(uiImage: image)
                .interpolation(.none)
                .resizable()
                .scaledToFit()
                .frame(width: size, height: size)
                .padding(padding)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(Color.forest.opacity(0.3), lineWidth: size > 60 ? 2 : 1)
                )
        } else {
            RoundedRectangle(cornerRadius: cornerRadius)
                .fill(Color.cream200)
                .frame(width: size, height: size)
                .overlay {
                    if size > 60 {
                        Text(encoded.hint.isEmpty ? "Fill in the form" : encoded.hint)
                            .font(.captionText)
                            .foregroundStyle(Color.sandLight)
                            .multilineTextAlignment(.center)
                            .padding(8)
                    }
                }
        }
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

            QRFormFields(form: $form, focusedField: $focusedField)
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
    var focusedField: FocusState<QRFormField?>.Binding

    var body: some View {
        Group {
            switch form.contentType {
            case .website:
                labeledField(.websiteURL, title: "Website URL", text: $form.websiteURL, placeholder: "example.com")
            case .wifi:
                labeledField(
                    .wifiSSID,
                    title: "Network Name (SSID)",
                    text: $form.wifiSSID,
                    placeholder: "My WiFi",
                    submitLabel: .next
                ) {
                    focusedField.wrappedValue = .wifiPassword
                }
                labeledField(
                    .wifiPassword,
                    title: "Password",
                    text: $form.wifiPassword,
                    placeholder: "Password",
                    isSecure: form.wifiSecurity != .nopass
                )
                Picker("Security", selection: $form.wifiSecurity) {
                    ForEach(WifiSecurity.allCases) { security in
                        Text(security.label).tag(security)
                    }
                }
                Toggle("Hidden network", isOn: $form.wifiHidden)
            case .contact:
                labeledField(.contactFirstName, title: "First Name", text: $form.contactFirstName, submitLabel: .next) {
                    focusedField.wrappedValue = .contactLastName
                }
                labeledField(.contactLastName, title: "Last Name", text: $form.contactLastName, submitLabel: .next) {
                    focusedField.wrappedValue = .contactPhone
                }
                labeledField(.contactPhone, title: "Phone", text: $form.contactPhone, keyboard: .phonePad, submitLabel: .next) {
                    focusedField.wrappedValue = .contactEmail
                }
                labeledField(.contactEmail, title: "Email", text: $form.contactEmail, keyboard: .emailAddress, submitLabel: .next) {
                    focusedField.wrappedValue = .contactOrganization
                }
                labeledField(.contactOrganization, title: "Organization", text: $form.contactOrganization, submitLabel: .next) {
                    focusedField.wrappedValue = .contactTitle
                }
                labeledField(.contactTitle, title: "Job Title", text: $form.contactTitle, submitLabel: .next) {
                    focusedField.wrappedValue = .contactWebsite
                }
                labeledField(.contactWebsite, title: "Website", text: $form.contactWebsite)
            case .text:
                labeledField(.textContent, title: "Message", text: $form.textContent, placeholder: "Your message", axis: .vertical)
            case .email:
                labeledField(.emailAddress, title: "Email Address", text: $form.emailAddress, keyboard: .emailAddress, submitLabel: .next) {
                    focusedField.wrappedValue = .emailSubject
                }
                labeledField(.emailSubject, title: "Subject", text: $form.emailSubject, submitLabel: .next) {
                    focusedField.wrappedValue = .emailBody
                }
                labeledField(.emailBody, title: "Body", text: $form.emailBody, axis: .vertical)
            case .sms:
                labeledField(.smsPhone, title: "Phone Number", text: $form.smsPhone, keyboard: .phonePad, submitLabel: .next) {
                    focusedField.wrappedValue = .smsMessage
                }
                labeledField(.smsMessage, title: "Message", text: $form.smsMessage, axis: .vertical)
            case .phone:
                labeledField(.phoneNumber, title: "Phone Number", text: $form.phoneNumber, keyboard: .phonePad)
            case .location:
                labeledField(.locationLabel, title: "Label", text: $form.locationLabel, placeholder: "Place name", submitLabel: .next) {
                    focusedField.wrappedValue = .locationLatitude
                }
                labeledField(.locationLatitude, title: "Latitude", text: $form.locationLatitude, keyboard: .decimalPad, submitLabel: .next) {
                    focusedField.wrappedValue = .locationLongitude
                }
                labeledField(.locationLongitude, title: "Longitude", text: $form.locationLongitude, keyboard: .decimalPad)
            case .event:
                labeledField(.eventTitle, title: "Event Title", text: $form.eventTitle, submitLabel: .next) {
                    focusedField.wrappedValue = .eventLocation
                }
                DatePicker("Start", selection: $form.eventStartDate)
                DatePicker("End", selection: $form.eventEndDate)
                labeledField(.eventLocation, title: "Location", text: $form.eventLocation, submitLabel: .next) {
                    focusedField.wrappedValue = .eventDescription
                }
                labeledField(.eventDescription, title: "Description", text: $form.eventDescription, axis: .vertical)
            }
        }
    }

    @ViewBuilder
    private func labeledField(
        _ field: QRFormField,
        title: String,
        text: Binding<String>,
        placeholder: String = "",
        keyboard: UIKeyboardType = .default,
        isSecure: Bool = false,
        axis: Axis = .horizontal,
        submitLabel: SubmitLabel = .done,
        onSubmit: (() -> Void)? = nil
    ) -> some View {
        FormField(
            title: title,
            text: text,
            placeholder: placeholder,
            keyboard: keyboard,
            isSecure: isSecure,
            axis: axis,
            submitLabel: submitLabel,
            onSubmit: onSubmit
        )
        .focused(focusedField, equals: field)
        .id(field)
    }
}

struct FormField: View {
    let title: String
    @Binding var text: String
    var placeholder: String = ""
    var keyboard: UIKeyboardType = .default
    var isSecure: Bool = false
    var axis: Axis = .horizontal
    var submitLabel: SubmitLabel = .done
    var onSubmit: (() -> Void)?

    init(
        title: String,
        text: Binding<String>,
        placeholder: String = "",
        keyboard: UIKeyboardType = .default,
        isSecure: Bool = false,
        axis: Axis = .horizontal,
        submitLabel: SubmitLabel = .done,
        onSubmit: (() -> Void)? = nil
    ) {
        self.title = title
        self._text = text
        self.placeholder = placeholder
        self.keyboard = keyboard
        self.isSecure = isSecure
        self.axis = axis
        self.submitLabel = submitLabel
        self.onSubmit = onSubmit
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.captionText.weight(.semibold))
                .foregroundStyle(Color.sandLight)
            if axis == .vertical {
                TextField(placeholder, text: $text, axis: .vertical)
                    .lineLimit(3...6)
                    .textFieldStyle(PaperlessTextFieldStyle())
                    .submitLabel(submitLabel)
                    .onSubmit { onSubmit?() }
            } else if isSecure {
                SecureField(placeholder, text: $text)
                    .textFieldStyle(PaperlessTextFieldStyle())
                    .submitLabel(submitLabel)
                    .onSubmit { onSubmit?() }
            } else {
                TextField(placeholder, text: $text)
                    .keyboardType(keyboard)
                    .textInputAutocapitalization(keyboard == .emailAddress ? .never : .sentences)
                    .autocorrectionDisabled(keyboard == .emailAddress || keyboard == .decimalPad)
                    .textFieldStyle(PaperlessTextFieldStyle())
                    .submitLabel(submitLabel)
                    .onSubmit { onSubmit?() }
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
