import PDFKit
import SwiftUI
import UniformTypeIdentifiers

struct CompressPDFView: View {
    @State private var pdfURL: URL?
    @State private var originalSize: Int = 0
    @State private var quality: Double = 0.75
    @State private var dpi: Double = 120
    @State private var showPicker = false
    @State private var isProcessing = false
    @State private var errorMessage: String?
    @State private var exportedURL: URL?
    @State private var showShareSheet = false

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if pdfURL == nil {
                    emptyState
                } else {
                    fileSummary
                    controls
                }

                if let errorMessage {
                    Text(errorMessage).font(.captionText).foregroundStyle(.red)
                }

                PrimaryButton(title: pdfURL == nil ? "Choose PDF" : "Change PDF", icon: "doc") {
                    showPicker = true
                }

                if pdfURL != nil {
                    PrimaryButton(title: "Compress PDF", icon: "arrow.down.right.and.arrow.up.left", isLoading: isProcessing) {
                        Task { await compress() }
                    }
                }

                PrivacyBadge()
            }
            .padding(20)
        }
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle("Compress PDF")
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
            if isProcessing { ProcessingOverlay(message: "Compressing PDF…") }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "arrow.down.right.and.arrow.up.left")
                .font(.system(size: 48))
                .foregroundStyle(Color.forest)
            Text("Make a PDF smaller")
                .font(.sectionTitle)
            Text("Reduce image quality inside the PDF while keeping pages readable.")
                .font(.bodyText)
                .foregroundStyle(Color.sandLight)
                .multilineTextAlignment(.center)
        }
    }

    private var fileSummary: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(pdfURL?.lastPathComponent ?? "Document")
                    .font(.bodyText.weight(.semibold))
                    .lineLimit(1)
                Text(formatBytes(originalSize))
                    .font(.captionText)
                    .foregroundStyle(Color.sandLight)
            }
            Spacer()
        }
        .padding(16)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }

    private var controls: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Quality: \(Int(quality * 100))%")
                    .font(.bodyText.weight(.semibold))
                Slider(value: $quality, in: 0.1...1.0)
            }
            VStack(alignment: .leading, spacing: 8) {
                Text("Image DPI: \(Int(dpi))")
                    .font(.bodyText.weight(.semibold))
                Slider(value: $dpi, in: 72...150, step: 1)
            }
        }
        .padding(16)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }

    private func loadPDF(_ url: URL) {
        pdfURL = url
        originalSize = (try? Data(contentsOf: url).count) ?? 0
        errorMessage = nil
    }

    private func formatBytes(_ count: Int) -> String {
        ByteCountFormatter.string(fromByteCount: Int64(count), countStyle: .file)
    }

    @MainActor
    private func compress() async {
        guard let pdfURL else { return }
        isProcessing = true
        errorMessage = nil
        defer { isProcessing = false }

        do {
            let data = try PDFService.compressPDF(from: pdfURL, quality: quality, dpi: dpi)
            let base = pdfURL.deletingPathExtension().lastPathComponent
            exportedURL = try PDFService.writeTemporaryPDF(data, filename: "\(base)-smaller")
            showShareSheet = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
