import PDFKit
import SwiftUI
import UniformTypeIdentifiers

struct CompressPDFView: View {
    @State private var pdfURL: URL?
    @State private var pdfDocument: PDFDocument?
    @State private var originalData: Data?
    @State private var originalSize: Int = 0
    @State private var compressedSize: Int?
    @State private var estimatedSize: Int?
    @State private var estimateMayIncrease = false
    @State private var isEstimating = false
    @State private var estimateTask: Task<Void, Never>?
    @State private var quality: Double = 1.0
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

            }
            .padding(20)
        }
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle("Compress PDF")
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: quality) { _, _ in
            refreshEstimate()
        }
        .onDisappear {
            estimateTask?.cancel()
        }
        .onAppear {
            if pdfURL == nil, let sharedURL = SharedPDFImportStore.consumeSharedPDFURL() {
                loadPDF(sharedURL)
            }
        }
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
                Text("Original: \(formatBytes(originalSize))")
                    .font(.captionText)
                    .foregroundStyle(Color.sandLight)
                if isEstimating {
                    Text("Calculating expected size…")
                        .font(.captionText)
                        .foregroundStyle(Color.sandLight)
                } else if let estimatedSize {
                    if isPassthrough {
                        Text("Expected: \(formatBytes(estimatedSize))")
                            .font(.captionText)
                            .foregroundStyle(Color.sandLight)
                    } else if estimateMayIncrease {
                        Text("Expected: ~\(formatBytes(estimatedSize)) (\(Int(quality * 100))% of original) — may not reach target on text-only PDFs")
                            .font(.captionText)
                            .foregroundStyle(Color.sandLight)
                    } else {
                        Text("Expected: ~\(formatBytes(estimatedSize)) (\(Int(quality * 100))% of original)")
                            .font(.captionText)
                            .foregroundStyle(Color.forest)
                    }
                }
                if let compressedSize {
                    if compressedSize <= PDFService.compressionTargetSize(originalSize: originalSize, quality: quality) || compressedSize < originalSize {
                        Text("Compressed to \(formatBytes(compressedSize))")
                            .font(.captionText)
                            .foregroundStyle(Color.forest)
                    } else {
                        Text("Compressed to \(formatBytes(compressedSize))")
                            .font(.captionText)
                            .foregroundStyle(Color.sandLight)
                    }
                }
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
                Text("Target size: \(Int(quality * 100))%")
                    .font(.bodyText.weight(.semibold))
                Slider(value: $quality, in: 0.1...1.0)
            }

            if isPassthrough {
                Text("Lower target size to compress.")
                    .font(.captionText)
                    .foregroundStyle(Color.sandLight)
            }
        }
        .padding(16)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }

    private var isPassthrough: Bool {
        quality >= 1.0
    }

    private func loadPDF(_ url: URL) {
        errorMessage = nil
        compressedSize = nil
        estimatedSize = nil
        estimateMayIncrease = false
        estimateTask?.cancel()
        quality = 1.0

        do {
            let data = try Data(contentsOf: url)
            guard let document = PDFDocument(data: data), document.pageCount > 0 else {
                throw PDFServiceError.invalidPDF
            }
            pdfDocument = document
            originalData = data
            originalSize = data.count
            pdfURL = try PDFService.writeTemporaryPDF(
                data,
                filename: url.deletingPathExtension().lastPathComponent
            )
            refreshEstimate()
        } catch {
            pdfDocument = nil
            originalData = nil
            pdfURL = nil
            originalSize = 0
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    private func refreshEstimate() {
        estimateTask?.cancel()
        compressedSize = nil

        guard pdfDocument != nil, originalSize > 0 else {
            estimatedSize = nil
            estimateMayIncrease = false
            isEstimating = false
            return
        }

        if isPassthrough {
            estimatedSize = originalSize
            estimateMayIncrease = false
            isEstimating = false
            return
        }

        isEstimating = true
        let document = pdfDocument!
        let size = originalSize
        let currentQuality = quality

        estimateTask = Task {
            try? await Task.sleep(nanoseconds: 200_000_000)
            guard !Task.isCancelled else { return }

            let result = PDFService.estimateCompressedSize(
                from: document,
                originalSize: size,
                quality: currentQuality
            )

            await MainActor.run {
                guard !Task.isCancelled else { return }
                estimatedSize = result.estimatedBytes
                estimateMayIncrease = result.mayIncrease
                isEstimating = false
            }
        }
    }

    private func formatBytes(_ count: Int) -> String {
        ByteCountFormatter.string(fromByteCount: Int64(count), countStyle: .file)
    }

    @MainActor
    private func compress() async {
        guard let pdfDocument, let originalData, let pdfURL else { return }
        isProcessing = true
        errorMessage = nil
        defer { isProcessing = false }

        do {
            let document = pdfDocument
            let original = originalData
            let sourceURL = pdfURL
            let compressionQuality = quality
            let passthrough = isPassthrough

            let data = try await Task.detached(priority: .userInitiated) {
                if passthrough {
                    return original
                }
                return try PDFService.compressPDF(
                    from: document,
                    quality: compressionQuality,
                    originalData: original
                )
            }.value

            compressedSize = data.count
            let base = pdfURL.deletingPathExtension().lastPathComponent
            exportedURL = try PDFService.writeTemporaryPDF(data, filename: "\(base)-smaller")
            showShareSheet = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
