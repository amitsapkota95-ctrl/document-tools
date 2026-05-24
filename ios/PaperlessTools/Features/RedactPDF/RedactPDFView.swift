import PDFKit
import SwiftUI
import UniformTypeIdentifiers

struct RedactPDFView: View {
    @State private var pdfURL: URL?
    @State private var pdfDocument: PDFDocument?
    @State private var currentPage = 0
    @State private var boxesByPage: [Int: [CGRect]] = [:]
    @State private var detectedPreview: [CGRect] = []
    @State private var showPicker = false
    @State private var isProcessing = false
    @State private var errorMessage: String?
    @State private var exportedURL: URL?
    @State private var showShareSheet = false

    private var currentBoxes: Binding<[CGRect]> {
        Binding(
            get: { boxesByPage[currentPage] ?? [] },
            set: { boxesByPage[currentPage] = $0 }
        )
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if let pdfDocument, let page = pdfDocument.page(at: currentPage) {
                    pageControls(pdfDocument.pageCount)

                    PageBoxOverlay(
                        pageImage: page.thumbnail(of: CGSize(width: 600, height: 800), for: .mediaBox),
                        mode: .multiRedact,
                        boxes: currentBoxes,
                        detectedBoxes: detectedPreview
                    )
                    .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))

                    HStack(spacing: 12) {
                        PrimaryButton(title: "Detect PII", icon: "wand.and.stars") {
                            detectPII(in: pdfDocument)
                        }
                        PrimaryButton(title: "Apply Detected", icon: "checkmark.shield") {
                            applyDetected()
                        }
                    }
                } else {
                    emptyState
                }

                if let errorMessage {
                    Text(errorMessage).font(.captionText).foregroundStyle(.red)
                }

                PrimaryButton(title: pdfDocument == nil ? "Choose PDF" : "Change PDF", icon: "doc") {
                    showPicker = true
                }

                if pdfDocument != nil, !boxesByPage.values.flatMap({ $0 }).isEmpty {
                    PrimaryButton(title: "Export Redacted PDF", icon: "eye.slash", isLoading: isProcessing) {
                        Task { await redact() }
                    }
                }

                PrivacyBadge()
            }
            .padding(20)
        }
        .background(Color.paper.ignoresSafeArea())
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
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "eye.slash")
                .font(.system(size: 48))
                .foregroundStyle(Color.forest)
            Text("Redact sensitive info")
                .font(.sectionTitle)
            Text("Draw black boxes or auto-detect emails, phones, and IDs.")
                .font(.bodyText)
                .foregroundStyle(Color.sandLight)
                .multilineTextAlignment(.center)
        }
    }

    private func pageControls(_ pageCount: Int) -> some View {
        HStack {
            Button {
                currentPage = max(0, currentPage - 1)
                refreshDetectedPreview()
            } label: {
                Image(systemName: "chevron.left")
            }
            .disabled(currentPage == 0)

            Spacer()
            Text("Page \(currentPage + 1) of \(pageCount)")
                .font(.bodyText.weight(.semibold))
            Spacer()

            Button {
                currentPage = min(pageCount - 1, currentPage + 1)
                refreshDetectedPreview()
            } label: {
                Image(systemName: "chevron.right")
            }
            .disabled(currentPage >= pageCount - 1)
        }
    }

    private func loadPDF(_ url: URL) {
        pdfURL = url
        currentPage = 0
        boxesByPage = [:]
        detectedPreview = []
        errorMessage = nil
        do {
            pdfDocument = try PDFService.loadDocument(from: url)
        } catch {
            pdfDocument = nil
            errorMessage = error.localizedDescription
        }
    }

    private func detectPII(in document: PDFDocument) {
        let matches = PIIDetector.detect(in: document, pageIndex: currentPage)
        detectedPreview = matches.map(\.normalizedRect)
    }

    private func applyDetected() {
        guard !detectedPreview.isEmpty else { return }
        var existing = boxesByPage[currentPage] ?? []
        existing.append(contentsOf: detectedPreview)
        boxesByPage[currentPage] = existing
        detectedPreview = []
    }

    private func refreshDetectedPreview() {
        detectedPreview = []
    }

    @MainActor
    private func redact() async {
        guard let pdfURL else { return }
        isProcessing = true
        errorMessage = nil
        defer { isProcessing = false }

        do {
            let data = try PDFService.redactPDF(from: pdfURL, boxesByPage: boxesByPage)
            let base = pdfURL.deletingPathExtension().lastPathComponent
            exportedURL = try PDFService.writeTemporaryPDF(data, filename: "\(base)-redacted")
            showShareSheet = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
