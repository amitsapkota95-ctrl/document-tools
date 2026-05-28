import SwiftUI

struct InvoiceBuilderView: View {
    @AppStorage("invoice.businessName") private var businessName = ""
    @State private var draft = InvoiceDraft()
    @State private var isProcessing = false
    @State private var errorMessage: String?
    @State private var exportedURL: URL?
    @State private var showShareSheet = false

    private var totals: InvoiceTotals {
        InvoiceCalculator.totals(for: draft)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                previewCard
                businessSection
                clientSection
                itemsSection
                totalsSection
                websiteCallout
                notesSection

                if let errorMessage {
                    Text(errorMessage).font(.captionText).foregroundStyle(.red)
                }

                PrimaryButton(title: "Export Invoice PDF", icon: "doc.text", isLoading: isProcessing) {
                    Task { await exportPDF() }
                }

            }
            .padding(20)
        }
        .paperlessScreenBackground()
        .navigationTitle("Invoice Builder")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showShareSheet) {
            if let exportedURL { ShareSheet(items: [exportedURL]) }
        }
    }

    private var previewCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(businessName.isEmpty ? "Your Business" : businessName)
                .font(.sectionTitle)
            Text("Invoice #\(draft.documentNumber)")
                .font(.bodyText.weight(.semibold))
                .foregroundStyle(Color.forest)
            Text("Total due: \(formatMoney(totals.total))")
                .font(.cardTitle)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(
            LinearGradient(colors: [Color.cream, Color.forest50], startPoint: .topLeading, endPoint: .bottomTrailing)
        )
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }

    private var businessSection: some View {
        formSection(title: "Your Business") {
            TextField("Business name", text: $businessName)
                .textFieldStyle(.roundedBorder)
            TextField("Invoice number", text: $draft.documentNumber)
                .textFieldStyle(.roundedBorder)
        }
    }

    private var clientSection: some View {
        formSection(title: "Client") {
            TextField("Client name", text: $draft.clientName)
                .textFieldStyle(.roundedBorder)
            TextField("Client email", text: $draft.clientEmail)
                .textFieldStyle(.roundedBorder)
                .keyboardType(.emailAddress)
                .textInputAutocapitalization(.never)
            DatePicker("Issue date", selection: $draft.issueDate, displayedComponents: .date)
            DatePicker("Due date", selection: $draft.dueDate, displayedComponents: .date)
        }
    }

    private var itemsSection: some View {
        formSection(title: "Line Items") {
            ForEach($draft.items) { $item in
                VStack(spacing: 8) {
                    TextField("Description", text: $item.description)
                        .textFieldStyle(.roundedBorder)
                    HStack {
                        TextField("Qty", value: $item.quantity, format: .number)
                            .textFieldStyle(.roundedBorder)
                            .keyboardType(.decimalPad)
                        TextField("Rate", value: $item.rate, format: .number)
                            .textFieldStyle(.roundedBorder)
                            .keyboardType(.decimalPad)
                    }
                }
            }

            Button {
                draft.items.append(InvoiceLineItem())
            } label: {
                Label("Add line item", systemImage: "plus.circle.fill")
                    .font(.bodyText.weight(.semibold))
                    .foregroundStyle(Color.forest)
            }
        }
    }

    private var totalsSection: some View {
        formSection(title: "Tax") {
            Picker("Tax type", selection: $draft.taxType) {
                ForEach(TaxType.allCases) { type in
                    Text(type.label).tag(type)
                }
            }
            .pickerStyle(.menu)
            .onChange(of: draft.taxType) { _, newType in
                draft.pricingMode = newType.defaultPricingMode
            }

            if draft.taxType == .custom {
                TextField("Custom tax label", text: $draft.customTaxLabel)
                    .textFieldStyle(.roundedBorder)
            }

            if draft.taxType != .none {
                TextField(draft.taxType.registrationPlaceholder, text: $draft.taxRegistrationNumber)
                    .textFieldStyle(.roundedBorder)

                VStack(alignment: .leading, spacing: 6) {
                    Text("Tax rate")
                        .font(.captionText)
                        .foregroundStyle(Color.sandLight)
                    HStack(spacing: 8) {
                        TextField("e.g. 20", value: $draft.taxRate, format: .number)
                            .textFieldStyle(.roundedBorder)
                            .keyboardType(.decimalPad)
                        Text("%")
                            .font(.bodyText.weight(.semibold))
                            .foregroundStyle(Color.forest)
                            .frame(width: 28)
                    }
                }

                Picker("Pricing", selection: $draft.pricingMode) {
                    ForEach(PricingMode.allCases) { mode in
                        Text(mode.label).tag(mode)
                    }
                }
                .pickerStyle(.menu)
            }

            Divider()

            HStack {
                Text("Subtotal")
                Spacer()
                Text(formatMoney(totals.subtotal))
            }

            if draft.hasTax {
                HStack {
                    Text("\(draft.taxLabel) (\(formatTaxRate(draft.taxRate))%)")
                    Spacer()
                    Text(formatMoney(totals.tax))
                }
            }

            HStack {
                Text("Total").font(.cardTitle)
                Spacer()
                Text(formatMoney(totals.total)).font(.cardTitle)
            }

            if draft.pricingMode == .inclusive && draft.hasTax {
                Text("Prices include tax")
                    .font(.captionText)
                    .foregroundStyle(Color.sandLight)
            }
        }
    }

    private var websiteCallout: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Need a detailed invoice?")
                .font(.bodyText.weight(.semibold))
            Text("Create full invoices with multi-tax, discounts, and more at paperless.tools")
                .font(.captionText)
                .foregroundStyle(Color.sandLight)
            Link("Go to paperless.tools", destination: URL(string: "https://paperless.tools")!)
                .font(.bodyText.weight(.semibold))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color.forest50)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }

    private var notesSection: some View {
        formSection(title: "Notes") {
            TextField("Payment terms or notes", text: $draft.notes, axis: .vertical)
                .lineLimit(3...6)
                .textFieldStyle(.roundedBorder)
        }
    }

    private func formSection<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.sectionTitle)
                .foregroundStyle(Color.ink)
            content()
        }
        .padding(16)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }

    private func formatMoney(_ value: Double) -> String {
        String(format: "$%.2f", value)
    }

    private func formatTaxRate(_ value: Double) -> String {
        value.truncatingRemainder(dividingBy: 1) == 0 ? String(format: "%.0f", value) : String(format: "%.2f", value)
    }

    @MainActor
    private func exportPDF() async {
        isProcessing = true
        errorMessage = nil
        defer { isProcessing = false }

        do {
            let data = try InvoicePDFRenderer.render(draft: draft, businessName: businessName)
            exportedURL = try PDFService.writeTemporaryPDF(data, filename: draft.documentNumber)
            showShareSheet = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
