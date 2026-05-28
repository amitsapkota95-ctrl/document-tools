import PDFKit
import SwiftUI
import UniformTypeIdentifiers

struct RedactPDFView: View {
    @State private var pdfURL: URL?
    @State private var pdfDocument: PDFDocument?
    @State private var currentPage = 0
    @State private var boxesByPage: [Int: [CGRect]] = [:]
    @State private var showPicker = false
    @State private var isProcessing = false
    @State private var errorMessage: String?
    @State private var exportedURL: URL?
    @State private var showShareSheet = false
    @State private var documentZoomScale: CGFloat = 1.0
    @State private var resetZoomTrigger = 0
    @State private var applyToAllPages = false
    @State private var sharedRedactionSourcePage = 0

    private var activeRedactionPage: Int {
        applyToAllPages ? sharedRedactionSourcePage : currentPage
    }

    private var activeRedactionBoxes: [CGRect] {
        boxesByPage[activeRedactionPage] ?? []
    }

    private var canUndo: Bool {
        !activeRedactionBoxes.isEmpty
    }

    private var hasAnyRedactions: Bool {
        !boxesByPage.values.flatMap({ $0 }).isEmpty
    }

    var body: some View {
        Group {
            if pdfDocument != nil {
                editorContent
            } else {
                ScrollView {
                    emptyStateContent
                }
            }
        }
        .paperlessScreenBackground()
        .navigationTitle("Redact PDF")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showPicker) {
            DocumentPicker(contentTypes: [.pdf], allowsMultipleSelection: false) { urls in
                if let url = urls.first { loadPDF(url) }
            }
        }
        .sheet(isPresented: $showShareSheet) {
            if let exportedURL { ShareSheet(items: [exportedURL]) }
        }
        .overlay {
            if isProcessing { ProcessingOverlay(message: "Applying redactions…") }
        }
        .onAppear {
            if pdfDocument == nil, let sharedURL = SharedPDFImportStore.consumeSharedPDFURL() {
                loadPDF(sharedURL)
            }
        }
    }

    private var editorContent: some View {
        ScrollView {
            VStack(spacing: 12) {
                if let pdfDocument, let page = pdfDocument.page(at: currentPage) {
                    compactToolbar(pageCount: pdfDocument.pageCount)

                    let pageImage = page.thumbnail(of: CGSize(width: 600, height: 800), for: .mediaBox)

                    ZoomableRedactionCanvas(
                        pageImage: pageImage,
                        pageIndex: currentPage,
                        boxes: activeRedactionBoxes,
                        onCommitBox: commitBox,
                        zoomScale: $documentZoomScale,
                        resetZoomTrigger: resetZoomTrigger
                    )
                    .aspectRatio(pageImage.size.width / pageImage.size.height, contentMode: .fit)
                    .frame(maxWidth: .infinity)
                    .id(currentPage)
                    .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
                    .accessibilityLabel("Document page")
                    .accessibilityHint("Pinch to zoom. One finger draws redaction boxes.")

                    Text("Pinch to zoom and drag to pan. Draw black boxes over content to redact.")
                        .font(.caption2)
                        .foregroundStyle(Color.sandLight)
                        .multilineTextAlignment(.center)
                }

                VStack(spacing: 12) {
                    if let errorMessage {
                        Text(errorMessage).font(.captionText).foregroundStyle(.red)
                    }

                    if pdfDocument != nil, !activeRedactionBoxes.isEmpty {
                        Toggle("Apply redactions to all pages", isOn: $applyToAllPages)
                            .font(.bodyText)
                            .padding(.horizontal, 4)
                            .onChange(of: applyToAllPages) { _, isOn in
                                if isOn {
                                    sharedRedactionSourcePage = currentPage
                                }
                            }

                        if applyToAllPages {
                            Text("Uses the same box positions on every page. Best for uniform page sizes.")
                                .font(.caption2)
                                .foregroundStyle(Color.sandLight)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.horizontal, 4)
                        }
                    }

                    PrimaryButton(title: "Change PDF", icon: "doc") {
                        showPicker = true
                    }

                    if pdfDocument != nil, hasAnyRedactions {
                        PrimaryButton(title: "Export Redacted PDF", icon: "eye.slash", isLoading: isProcessing) {
                            Task { await redact() }
                        }
                    }
                }
            }
            .padding(20)
        }
    }

    private var emptyStateContent: some View {
        VStack(spacing: 20) {
            emptyState

            PrimaryButton(title: "Choose PDF", icon: "doc") {
                showPicker = true
            }
        }
        .padding(20)
    }

    private func compactToolbar(pageCount: Int) -> some View {
        HStack(spacing: 12) {
            Button {
                currentPage = max(0, currentPage - 1)
                resetDocumentZoom()
            } label: {
                Image(systemName: "chevron.left")
            }
            .disabled(currentPage == 0)
            .accessibilityLabel("Previous page")

            Text("Page \(currentPage + 1) of \(pageCount)")
                .font(.bodyText.weight(.semibold))
                .lineLimit(1)
                .minimumScaleFactor(0.85)

            Button {
                currentPage = min(pageCount - 1, currentPage + 1)
                resetDocumentZoom()
            } label: {
                Image(systemName: "chevron.right")
            }
            .disabled(currentPage >= pageCount - 1)
            .accessibilityLabel("Next page")

            Spacer(minLength: 8)

            Button {
                undoLastRedaction()
            } label: {
                Label("Undo", systemImage: "arrow.uturn.backward")
                    .font(.captionText.weight(.semibold))
            }
            .disabled(!canUndo)
            .foregroundStyle(canUndo ? Color.forest : Color.sandLight)
            .accessibilityLabel("Undo last redaction box")

            if documentZoomScale > 1.05 {
                Button("Reset Zoom") {
                    resetZoomTrigger += 1
                    documentZoomScale = 1.0
                }
                .font(.captionText.weight(.semibold))
                .foregroundStyle(Color.forest)
                .accessibilityLabel("Reset zoom")
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "eye.slash")
                .font(.system(size: 48))
                .foregroundStyle(Color.forest)
            Text("Redact sensitive info")
                .font(.sectionTitle)
            Text("Draw black boxes over text or images you want removed permanently from the PDF.")
                .font(.bodyText)
                .foregroundStyle(Color.sandLight)
                .multilineTextAlignment(.center)
        }
    }

    private func loadPDF(_ url: URL) {
        currentPage = 0
        boxesByPage = [:]
        applyToAllPages = false
        sharedRedactionSourcePage = 0
        errorMessage = nil

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

    private func resetDocumentZoom() {
        resetZoomTrigger += 1
        documentZoomScale = 1.0
    }

    private func commitBox(_ rect: CGRect) {
        var pageBoxes = boxesByPage[activeRedactionPage] ?? []
        pageBoxes.append(rect)
        var updated = boxesByPage
        updated[activeRedactionPage] = pageBoxes
        boxesByPage = updated
    }

    private func undoLastRedaction() {
        var pageBoxes = boxesByPage[activeRedactionPage] ?? []
        guard !pageBoxes.isEmpty else { return }
        pageBoxes.removeLast()
        var updated = boxesByPage
        if pageBoxes.isEmpty {
            updated.removeValue(forKey: activeRedactionPage)
        } else {
            updated[activeRedactionPage] = pageBoxes
        }
        boxesByPage = updated
    }

    @MainActor
    private func redact() async {
        guard let pdfURL else { return }
        isProcessing = true
        errorMessage = nil
        defer { isProcessing = false }

        do {
            let sourceURL = pdfURL
            let boxes = boxesByPage
            let applyAll = applyToAllPages
            let sourcePage = sharedRedactionSourcePage

            let data = try await Task.detached(priority: .userInitiated) {
                try PDFService.redactPDF(
                    from: sourceURL,
                    boxesByPage: boxes,
                    applyToAllPages: applyAll,
                    sourcePageIndex: sourcePage
                )
            }.value

            let base = sourceURL.deletingPathExtension().lastPathComponent
            exportedURL = try PDFService.writeTemporaryPDF(data, filename: "\(base)-redacted")
            showShareSheet = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
