import PDFKit
import SwiftUI
import UniformTypeIdentifiers

struct CropPDFView: View {
    @State private var pdfURL: URL?
    @State private var pdfDocument: PDFDocument?
    @State private var cropBoxes: [CGRect] = []
    @State private var applyToAllPages = true
    @State private var showPicker = false
    @State private var isProcessing = false
    @State private var errorMessage: String?
    @State private var exportedURL: URL?
    @State private var showShareSheet = false

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if let pdfDocument, let page = pdfDocument.page(at: 0) {
                    PageBoxOverlay(
                        pageImage: page.thumbnail(of: CGSize(width: 600, height: 800), for: .mediaBox),
                        mode: .singleCrop,
                        boxes: $cropBoxes
                    )
                    .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))

                    Toggle("Apply crop to all pages", isOn: $applyToAllPages)
                        .font(.bodyText)
                        .padding(.horizontal, 4)
                } else {
                    emptyState
                }

                if let errorMessage {
                    Text(errorMessage).font(.captionText).foregroundStyle(.red)
                }

                PrimaryButton(title: pdfDocument == nil ? "Choose PDF" : "Change PDF", icon: "doc") {
                    showPicker = true
                }

                if pdfDocument != nil, !cropBoxes.isEmpty {
                    PrimaryButton(title: "Crop PDF", icon: "crop", isLoading: isProcessing) {
                        Task { await crop() }
                    }
                }

                PrivacyBadge()
            }
            .padding(20)
        }
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle("Crop PDF")
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
            if isProcessing { ProcessingOverlay(message: "Cropping PDF…") }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "crop")
                .font(.system(size: 48))
                .foregroundStyle(Color.forest)
            Text("Crop PDF pages")
                .font(.sectionTitle)
            Text("Drag a box over the area you want to keep.")
                .font(.bodyText)
                .foregroundStyle(Color.sandLight)
        }
    }

    private func loadPDF(_ url: URL) {
        pdfURL = url
        cropBoxes = []
        errorMessage = nil
        do {
            pdfDocument = try PDFService.loadDocument(from: url)
        } catch {
            pdfDocument = nil
            errorMessage = error.localizedDescription
        }
    }

    @MainActor
    private func crop() async {
        guard let pdfURL, let cropRect = cropBoxes.first else { return }
        isProcessing = true
        errorMessage = nil
        defer { isProcessing = false }

        do {
            let data = try PDFService.cropPDF(from: pdfURL, normalizedRect: cropRect, applyToAllPages: applyToAllPages)
            let base = pdfURL.deletingPathExtension().lastPathComponent
            exportedURL = try PDFService.writeTemporaryPDF(data, filename: "\(base)-cropped")
            showShareSheet = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
