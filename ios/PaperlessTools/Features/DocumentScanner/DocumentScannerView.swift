import SwiftUI
import VisionKit

struct DocumentScannerView: View {
    @State private var scannedImages: [UIImage] = []
    @State private var showScanner = false
    @State private var isProcessing = false
    @State private var errorMessage: String?
    @State private var exportedURL: URL?
    @State private var showShareSheet = false

    var body: some View {
        VStack(spacing: 20) {
            if scannedImages.isEmpty {
                emptyState
            } else {
                scannedPagesView
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.captionText)
                    .foregroundStyle(.red)
                    .padding(.horizontal)
            }

            VStack(spacing: 12) {
                PrimaryButton(title: scannedImages.isEmpty ? "Start Scanning" : "Add Pages", icon: "doc.viewfinder") {
                    showScanner = true
                }

                if !scannedImages.isEmpty {
                    PrimaryButton(title: "Save as PDF", icon: "square.and.arrow.up", isLoading: isProcessing) {
                        Task { await exportPDF() }
                    }
                }
            }
            .padding(.horizontal, 20)

            PrivacyBadge()
            Spacer()
        }
        .padding(.top, 20)
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle("Scan Document")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showScanner) {
            DocumentScannerRepresentable { images in
                scannedImages.append(contentsOf: images)
            }
        }
        .sheet(isPresented: $showShareSheet) {
            if let exportedURL {
                ShareSheet(items: [exportedURL])
            }
        }
        .overlay {
            if isProcessing {
                ProcessingOverlay(message: "Creating PDF…")
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "doc.viewfinder")
                .font(.system(size: 48))
                .foregroundStyle(Color.forest)
            Text("Scan documents with auto-crop")
                .font(.sectionTitle)
            Text("Capture receipts, contracts, and notes. Pages are processed on your device.")
                .font(.bodyText)
                .foregroundStyle(Color.sandLight)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 40)
    }

    private var scannedPagesView: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(Array(scannedImages.enumerated()), id: \.offset) { index, image in
                    VStack(spacing: 6) {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFill()
                            .frame(width: 100, height: 140)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        Text("Page \(index + 1)")
                            .font(.caption2)
                            .foregroundStyle(Color.sandLight)
                    }
                }
            }
            .padding(.horizontal, 20)
        }
    }

    @MainActor
    private func exportPDF() async {
        isProcessing = true
        errorMessage = nil
        defer { isProcessing = false }

        do {
            let data = try PDFService.scannedPagesToPDF(scannedImages)
            exportedURL = try PDFService.writeTemporaryPDF(data, filename: "scanned-document")
            showShareSheet = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct DocumentScannerRepresentable: UIViewControllerRepresentable {
    let onScanComplete: ([UIImage]) -> Void
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> VNDocumentCameraViewController {
        let scanner = VNDocumentCameraViewController()
        scanner.delegate = context.coordinator
        return scanner
    }

    func updateUIViewController(_ uiViewController: VNDocumentCameraViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(onScanComplete: onScanComplete, dismiss: dismiss)
    }

    final class Coordinator: NSObject, VNDocumentCameraViewControllerDelegate {
        let onScanComplete: ([UIImage]) -> Void
        let dismiss: DismissAction

        init(onScanComplete: @escaping ([UIImage]) -> Void, dismiss: DismissAction) {
            self.onScanComplete = onScanComplete
            self.dismiss = dismiss
        }

        func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFinishWith scan: VNDocumentCameraScan) {
            var images: [UIImage] = []
            for index in 0..<scan.pageCount {
                images.append(scan.imageOfPage(at: index))
            }
            onScanComplete(images)
            dismiss()
        }

        func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
            dismiss()
        }

        func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFailWithError error: Error) {
            dismiss()
        }
    }
}
