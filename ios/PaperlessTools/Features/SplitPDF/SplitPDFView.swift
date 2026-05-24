import PDFKit
import SwiftUI
import UniformTypeIdentifiers

struct SplitPDFView: View {
    @State private var pdfURL: URL?
    @State private var pdfDocument: PDFDocument?
    @State private var showPicker = false
    @State private var splitMode: SplitMode = .everyPage
    @State private var interval = 2
    @State private var selectedPages = Set<Int>()
    @State private var isProcessing = false
    @State private var errorMessage: String?
    @State private var exportedURL: URL?
    @State private var showShareSheet = false

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if pdfDocument == nil {
                    emptyState
                } else if let pdfDocument {
                    documentSummary(pdfDocument)
                    splitModePicker
                    pageGrid(pdfDocument)
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.captionText)
                        .foregroundStyle(.red)
                }

                VStack(spacing: 12) {
                    PrimaryButton(
                        title: pdfDocument == nil ? "Choose PDF" : "Change PDF",
                        icon: "doc"
                    ) {
                        showPicker = true
                    }

                    if pdfDocument != nil, canSplit {
                        PrimaryButton(title: splitButtonTitle, icon: "scissors", isLoading: isProcessing) {
                            Task { await splitPDF() }
                        }
                    }
                }

                PrivacyBadge()
            }
            .padding(20)
        }
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle("Split PDF")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showPicker) {
            DocumentPicker(contentTypes: [.pdf], allowsMultipleSelection: false) { urls in
                if let url = urls.first {
                    loadPDF(from: url)
                }
            }
        }
        .sheet(isPresented: $showShareSheet) {
            if let exportedURL {
                ShareSheet(items: [exportedURL])
            }
        }
        .overlay {
            if isProcessing {
                ProcessingOverlay(message: "Splitting PDF…")
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "scissors")
                .font(.system(size: 48))
                .foregroundStyle(Color.forest)
            Text("Split a PDF into parts")
                .font(.sectionTitle)
            Text("Separate every page, split by interval, or export selected pages.")
                .font(.bodyText)
                .foregroundStyle(Color.sandLight)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 20)
    }

    private func documentSummary(_ document: PDFDocument) -> some View {
        HStack {
            Image(systemName: "doc.fill")
                .foregroundStyle(Color.forest)
            VStack(alignment: .leading, spacing: 4) {
                Text(pdfURL?.lastPathComponent ?? "Document")
                    .font(.bodyText.weight(.semibold))
                    .lineLimit(1)
                Text("\(document.pageCount) page\(document.pageCount == 1 ? "" : "s")")
                    .font(.captionText)
                    .foregroundStyle(Color.sandLight)
            }
            Spacer()
        }
        .padding(16)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }

    private var splitModePicker: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Split mode")
                .font(.sectionTitle)

            Picker("Split mode", selection: $splitMode) {
                ForEach(SplitMode.allCases) { mode in
                    Text(mode.label).tag(mode)
                }
            }
            .pickerStyle(.segmented)

            if splitMode == .byInterval {
                Stepper(value: $interval, in: 1...50) {
                    Text("Every \(interval) page\(interval == 1 ? "" : "s")")
                        .font(.bodyText)
                }
            }

            if splitMode == .selectedPages {
                Text("Tap pages to include in the export.")
                    .font(.captionText)
                    .foregroundStyle(Color.sandLight)
            }
        }
    }

    private func pageGrid(_ document: PDFDocument) -> some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            ForEach(0..<document.pageCount, id: \.self) { index in
                if let page = document.page(at: index) {
                    pageCell(page: page, index: index)
                }
            }
        }
    }

    private func pageCell(page: PDFPage, index: Int) -> some View {
        let isSelected = selectedPages.contains(index)
        let thumbnail = page.thumbnail(of: CGSize(width: 120, height: 160), for: .mediaBox)

        return Button {
            guard splitMode == .selectedPages else { return }
            if isSelected {
                selectedPages.remove(index)
            } else {
                selectedPages.insert(index)
            }
        } label: {
            VStack(spacing: 6) {
                Image(uiImage: thumbnail)
                    .resizable()
                    .scaledToFit()
                    .frame(height: 120)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .overlay {
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(isSelected ? Color.forest : Color.clear, lineWidth: 3)
                    }

                Text("Page \(index + 1)")
                    .font(.captionText)
                    .foregroundStyle(Color.ink)
            }
        }
        .buttonStyle(.plain)
        .opacity(splitMode == .selectedPages ? 1 : 0.95)
    }

    private var canSplit: Bool {
        switch splitMode {
        case .everyPage, .byInterval:
            return (pdfDocument?.pageCount ?? 0) > 0
        case .selectedPages:
            return !selectedPages.isEmpty
        }
    }

    private var splitButtonTitle: String {
        switch splitMode {
        case .everyPage:
            return "Split into pages"
        case .byInterval:
            return "Split by interval"
        case .selectedPages:
            return selectedPages.count == 1 ? "Export page" : "Export selected"
        }
    }

    private func loadPDF(from url: URL) {
        errorMessage = nil
        selectedPages = []
        pdfURL = url

        do {
            pdfDocument = try PDFService.loadDocument(from: url)
        } catch {
            pdfDocument = nil
            errorMessage = error.localizedDescription
        }
    }

    @MainActor
    private func splitPDF() async {
        guard let pdfURL else { return }

        isProcessing = true
        errorMessage = nil
        defer { isProcessing = false }

        let baseName = pdfURL.deletingPathExtension().lastPathComponent

        do {
            let entries: [(name: String, data: Data)]

            switch splitMode {
            case .everyPage:
                entries = try PDFService.splitEveryPage(from: pdfURL, baseName: baseName)
            case .byInterval:
                entries = try PDFService.splitByInterval(from: pdfURL, interval: interval, baseName: baseName)
            case .selectedPages:
                let data = try PDFService.extractPages(from: pdfURL, indices: Array(selectedPages))
                let suffix = selectedPages.count == 1 ? "page-\(selectedPages.sorted().first! + 1)" : "selected-pages"
                entries = [(name: "\(baseName)-\(suffix).pdf", data: data)]
            }

            exportedURL = try PDFService.exportFiles(named: "\(baseName)-split", entries: entries)
            showShareSheet = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
