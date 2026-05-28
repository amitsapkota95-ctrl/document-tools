import SwiftUI
import UniformTypeIdentifiers

struct MergePDFView: View {
    var initialPDFURLs: [URL] = []

    @State private var pdfURLs: [URL] = []
    @State private var showPicker = false
    @State private var isProcessing = false
    @State private var errorMessage: String?
    @State private var exportedURL: URL?
    @State private var showShareSheet = false

    var body: some View {
        VStack(spacing: 20) {
            if pdfURLs.isEmpty {
                emptyState
            } else {
                pdfList
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.captionText)
                    .foregroundStyle(.red)
                    .padding(.horizontal)
            }

            VStack(spacing: 12) {
                PrimaryButton(title: "Add PDFs", icon: "plus") {
                    showPicker = true
                }

                if pdfURLs.count >= 2 {
                    PrimaryButton(title: "Combine PDFs", icon: "doc.on.doc", isLoading: isProcessing) {
                        Task { await merge() }
                    }
                }
            }
            .padding(.horizontal, 20)

            Spacer()
        }
        .padding(.top, 20)
        .paperlessScreenBackground()
        .navigationTitle("Combine PDFs")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showPicker) {
            DocumentPicker(contentTypes: [.pdf]) { urls in
                pdfURLs.append(contentsOf: urls)
            }
        }
        .sheet(isPresented: $showShareSheet) {
            if let exportedURL {
                ShareSheet(items: [exportedURL])
            }
        }
        .overlay {
            if isProcessing {
                ProcessingOverlay(message: "Merging PDFs…")
            }
        }
        .onAppear {
            if pdfURLs.isEmpty, !initialPDFURLs.isEmpty {
                pdfURLs = initialPDFURLs
            } else if pdfURLs.isEmpty, let sharedURLs = SharedPDFImportStore.consumeSharedPDFURLs().nilIfEmpty {
                pdfURLs = sharedURLs
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "doc.on.doc")
                .font(.system(size: 48))
                .foregroundStyle(Color.forest)
            Text("Combine multiple PDFs")
                .font(.sectionTitle)
            Text("Add PDFs and drag to reorder before combining.")
                .font(.bodyText)
                .foregroundStyle(Color.sandLight)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 40)
    }

    private var pdfList: some View {
        List {
            ForEach(Array(pdfURLs.enumerated()), id: \.offset) { index, url in
                HStack {
                    Image(systemName: "doc.fill")
                        .foregroundStyle(Color.forest)
                    Text(url.lastPathComponent)
                        .font(.bodyText)
                        .lineLimit(1)
                    Spacer()
                    Text("#\(index + 1)")
                        .font(.captionText)
                        .foregroundStyle(Color.sandLight)
                }
            }
            .onMove { from, to in
                pdfURLs.move(fromOffsets: from, toOffset: to)
            }
            .onDelete { indexSet in
                pdfURLs.remove(atOffsets: indexSet)
            }
        }
        .paperlessListStyle()
        .environment(\.editMode, .constant(.active))
    }

    @MainActor
    private func merge() async {
        isProcessing = true
        errorMessage = nil
        defer { isProcessing = false }

        do {
            let urls = pdfURLs
            let data = try await Task.detached(priority: .userInitiated) {
                try PDFService.mergePDFs(from: urls)
            }.value
            exportedURL = try PDFService.writeTemporaryPDF(data, filename: "merged-document")
            showShareSheet = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct DocumentPicker: UIViewControllerRepresentable {
    let contentTypes: [UTType]
    var allowsMultipleSelection = true
    let onPick: ([URL]) -> Void

    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: contentTypes, asCopy: true)
        picker.allowsMultipleSelection = allowsMultipleSelection
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIDocumentPickerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(onPick: onPick)
    }

    final class Coordinator: NSObject, UIDocumentPickerDelegate {
        let onPick: ([URL]) -> Void

        init(onPick: @escaping ([URL]) -> Void) {
            self.onPick = onPick
        }

        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            onPick(urls)
        }
    }
}

private extension Array {
    var nilIfEmpty: Self? {
        isEmpty ? nil : self
    }
}
