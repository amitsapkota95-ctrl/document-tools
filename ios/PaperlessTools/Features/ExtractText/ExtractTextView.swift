import SwiftUI
import UniformTypeIdentifiers

struct ExtractTextView: View {
    @State private var pdfURL: URL?
    @State private var extractedText = ""
    @State private var useOCR = true
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
                    Toggle("Use OCR when text is not embedded", isOn: $useOCR)
                        .font(.bodyText)
                        .padding(16)
                        .background(Color.cream)
                        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))

                    if !extractedText.isEmpty {
                        TextEditor(text: $extractedText)
                            .font(.system(.body, design: .monospaced))
                            .frame(minHeight: 280)
                            .padding(12)
                            .background(Color.cream)
                            .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
                    }
                }

                if let errorMessage {
                    Text(errorMessage).font(.captionText).foregroundStyle(.red)
                }

                PrimaryButton(title: pdfURL == nil ? "Choose PDF" : "Change PDF", icon: "doc") {
                    showPicker = true
                }

                if pdfURL != nil {
                    PrimaryButton(title: extractedText.isEmpty ? "Extract Text" : "Re-scan Text", icon: "text.viewfinder", isLoading: isProcessing) {
                        Task { await extract() }
                    }

                    if !extractedText.isEmpty {
                        PrimaryButton(title: "Share Text", icon: "square.and.arrow.up") {
                            shareText()
                        }
                    }
                }

            }
            .padding(20)
        }
        .paperlessScreenBackground()
        .navigationTitle("Extract Text")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showPicker) {
            DocumentPicker(contentTypes: [.pdf], allowsMultipleSelection: false) { urls in
                if let url = urls.first {
                    pdfURL = url
                    extractedText = ""
                    errorMessage = nil
                }
            }
        }
        .sheet(isPresented: $showShareSheet) {
            if let exportedURL { ShareSheet(items: [exportedURL]) }
        }
        .overlay {
            if isProcessing { ProcessingOverlay(message: "Reading document…") }
        }
        .onAppear {
            if pdfURL == nil, let sharedURL = SharedPDFImportStore.consumeSharedPDFURL() {
                pdfURL = sharedURL
                extractedText = ""
                errorMessage = nil
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "text.viewfinder")
                .font(.system(size: 48))
                .foregroundStyle(Color.forest)
            Text("Extract text from PDF")
                .font(.sectionTitle)
            Text("Reads embedded text first, then falls back to on-device OCR.")
                .font(.bodyText)
                .foregroundStyle(Color.sandLight)
                .multilineTextAlignment(.center)
        }
    }

    @MainActor
    private func extract() async {
        guard let pdfURL else { return }
        isProcessing = true
        errorMessage = nil
        defer { isProcessing = false }

        do {
            extractedText = try await OCRService.extractText(from: pdfURL, useOCR: useOCR)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func shareText() {
        do {
            let base = pdfURL?.deletingPathExtension().lastPathComponent ?? "extracted-text"
            exportedURL = try PDFService.writeTemporaryText(extractedText, filename: base)
            showShareSheet = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
