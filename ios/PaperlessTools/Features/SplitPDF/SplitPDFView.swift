import PDFKit
import SwiftUI
import UniformTypeIdentifiers

struct SplitPDFView: View {
    @State private var pdfURL: URL?
    @State private var pdfDocument: PDFDocument?
    @State private var showPicker = false
    @State private var splitMode: SplitMode = .selectedPages
    @State private var interval = 2
    @State private var selectedPages = Set<Int>()
    @State private var isProcessing = false
    @State private var errorMessage: String?
    @State private var exportedURL: URL?
    @State private var showShareSheet = false

    var body: some View {
        VStack(spacing: pdfDocument == nil ? 20 : 12) {
            if pdfDocument == nil {
                emptyState
            } else if let pdfDocument {
                VStack(spacing: 12) {
                    documentSummary(pdfDocument)
                        .padding(.horizontal, 20)
                    splitModePicker
                        .padding(.horizontal, 20)

                    ScrollView {
                        pageGrid(pdfDocument)
                            .padding(.horizontal, 20)
                            .padding(.bottom, 8)
                    }
                    .frame(maxHeight: .infinity)
                }
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.captionText)
                    .foregroundStyle(.red)
                    .padding(.horizontal, 20)
            }

            HStack(spacing: 12) {
                compactActionButton(title: "Add PDF", icon: "plus") {
                    showPicker = true
                }

                if pdfDocument != nil, canSplit {
                    compactActionButton(
                        title: splitButtonTitle,
                        icon: "scissors",
                        isLoading: isProcessing
                    ) {
                        Task { await splitPDF() }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 8)

            if pdfDocument == nil {
                Spacer()
            }
        }
        .padding(.top, pdfDocument == nil ? 20 : 12)
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
        .onAppear {
            if pdfDocument == nil, let sharedURL = SharedPDFImportStore.consumeSharedPDFURL() {
                loadPDF(from: sharedURL)
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
            Text("Add a PDF, select pages to export, split every page, or split by interval.")
                .font(.bodyText)
                .foregroundStyle(Color.sandLight)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 40)
    }

    private func documentSummary(_ document: PDFDocument) -> some View {
        HStack(spacing: 10) {
            Image(systemName: "doc.fill")
                .foregroundStyle(Color.forest)
            VStack(alignment: .leading, spacing: 2) {
                Text(pdfURL?.lastPathComponent ?? "Document")
                    .font(.bodyText.weight(.semibold))
                    .lineLimit(1)
                Text("\(document.pageCount) page\(document.pageCount == 1 ? "" : "s")")
                    .font(.captionText)
                    .foregroundStyle(Color.sandLight)
            }
            Spacer(minLength: 0)
            Button {
                clearPDF()
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.title3)
                    .foregroundStyle(Color.sandLight)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Remove PDF")
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }

    private var splitModePicker: some View {
        VStack(alignment: .leading, spacing: 8) {
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

    private func displayIndices(for document: PDFDocument) -> [Int] {
        switch splitMode {
        case .selectedPages:
            let selected = selectedPages.sorted()
            let unselected = (0..<document.pageCount).filter { !selectedPages.contains($0) }
            return selected + unselected
        case .everyPage, .byInterval:
            return Array(0..<document.pageCount)
        }
    }

    private func pageGrid(_ document: PDFDocument) -> some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            ForEach(displayIndices(for: document), id: \.self) { index in
                if let page = document.page(at: index) {
                    pageCell(page: page, index: index)
                }
            }
        }
    }

    private func pageCell(page: PDFPage, index: Int) -> some View {
        let isSelected = selectedPages.contains(index)
        let showHighlight = splitMode == .selectedPages && isSelected
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
                            .stroke(showHighlight ? Color.forest : Color.clear, lineWidth: 3)
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

    private func compactActionButton(
        title: String,
        icon: String,
        isLoading: Bool = false,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 6) {
                if isLoading {
                    ProgressView()
                        .tint(.white)
                        .controlSize(.small)
                } else {
                    Image(systemName: icon)
                }
                Text(title)
                    .font(.buttonLabel)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .foregroundStyle(.white)
            .background(isLoading ? Color.forest.opacity(0.7) : Color.forest)
            .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.buttonCornerRadius))
        }
        .disabled(isLoading)
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

    private func clearPDF() {
        pdfURL = nil
        pdfDocument = nil
        selectedPages = []
        errorMessage = nil
    }

    private func loadPDF(from url: URL) {
        errorMessage = nil
        selectedPages = []

        do {
            let data = try Data(contentsOf: url)
            guard let document = PDFDocument(data: data), document.pageCount > 0 else {
                throw PDFServiceError.invalidPDF
            }
            pdfDocument = document
            pdfURL = try PDFService.writeTemporaryPDF(
                data,
                filename: url.deletingPathExtension().lastPathComponent
            )
        } catch {
            pdfDocument = nil
            pdfURL = nil
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    @MainActor
    private func splitPDF() async {
        guard let pdfDocument, let pdfURL else { return }

        isProcessing = true
        errorMessage = nil
        defer { isProcessing = false }

        do {
            let document = pdfDocument
            let sourceURL = pdfURL
            let mode = splitMode
            let pageInterval = interval
            let selected = selectedPages
            let baseName = sourceURL.deletingPathExtension().lastPathComponent

            let exportURL = try await Task.detached(priority: .userInitiated) {
                let entries: [(name: String, data: Data)]

                switch mode {
                case .everyPage:
                    entries = try PDFService.splitEveryPage(from: document, baseName: baseName)
                case .byInterval:
                    entries = try PDFService.splitByInterval(from: document, interval: pageInterval, baseName: baseName)
                case .selectedPages:
                    let data = try PDFService.extractPages(from: document, indices: Array(selected))
                    let suffix = selected.count == 1 ? "page-\(selected.sorted().first! + 1)" : "selected-pages"
                    entries = [(name: "\(baseName)-\(suffix).pdf", data: data)]
                }

                return try PDFService.exportFiles(named: "\(baseName)-split", entries: entries)
            }.value

            exportedURL = exportURL
            showShareSheet = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
