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
                notesSection

                if let errorMessage {
                    Text(errorMessage).font(.captionText).foregroundStyle(.red)
                }

                PrimaryButton(title: "Export Invoice PDF", icon: "doc.text", isLoading: isProcessing) {
                    Task { await exportPDF() }
                }

                PrivacyBadge()
            }
            .padding(20)
        }
        .background(Color.paper.ignoresSafeArea())
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
            HStack {
                Text("Tax rate (%)")
                Spacer()
                TextField("0", value: $draft.taxRate, format: .number)
                    .keyboardType(.decimalPad)
                    .multilineTextAlignment(.trailing)
                    .frame(width: 80)
            }
            HStack {
                Text("Subtotal")
                Spacer()
                Text(formatMoney(totals.subtotal))
            }
            HStack {
                Text("Tax")
                Spacer()
                Text(formatMoney(totals.tax))
            }
            HStack {
                Text("Total").font(.cardTitle)
                Spacer()
                Text(formatMoney(totals.total)).font(.cardTitle)
            }
        }
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
            Text(title).font(.sectionTitle)
            content()
        }
        .padding(16)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }

    private func formatMoney(_ value: Double) -> String {
        String(format: "$%.2f", value)
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
