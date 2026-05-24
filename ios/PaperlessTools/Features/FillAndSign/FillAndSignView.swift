import PDFKit
import PencilKit
import SwiftUI
import UniformTypeIdentifiers

struct FillAndSignView: View {
    @State private var pdfURL: URL?
    @State private var pdfDocument: PDFDocument?
    @State private var currentPageIndex = 0
    @State private var showPicker = false
    @State private var showSignatureSheet = false
    @State private var signatureImage: UIImage?
    @State private var signatureName = "My Signature"
    @State private var placementRect = CGRect(x: 100, y: 100, width: 180, height: 60)
    @State private var isProcessing = false
    @State private var errorMessage: String?
    @State private var exportedURL: URL?
    @State private var showShareSheet = false
    @State private var savedSignatures: [SavedSignature] = StorageService.loadSignatures()

    var body: some View {
        VStack(spacing: 16) {
            if pdfDocument == nil {
                emptyState
            } else {
                pdfViewer
                signatureControls
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.captionText)
                    .foregroundStyle(.red)
                    .padding(.horizontal)
            }

            VStack(spacing: 12) {
                PrimaryButton(title: pdfDocument == nil ? "Choose PDF" : "Change PDF", icon: "doc") {
                    showPicker = true
                }

                if pdfDocument != nil, signatureImage != nil {
                    PrimaryButton(title: "Apply & Export", icon: "square.and.arrow.up", isLoading: isProcessing) {
                        Task { await exportSignedPDF() }
                    }
                }
            }
            .padding(.horizontal, 20)

            PrivacyBadge()
            Spacer()
        }
        .padding(.top, 12)
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle("Fill & Sign")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showPicker) {
            DocumentPicker(contentTypes: [.pdf]) { urls in
                if let url = urls.first {
                    loadPDF(from: url)
                }
            }
        }
        .sheet(isPresented: $showSignatureSheet) {
            SignatureCanvasSheet(signatureName: $signatureName) { image in
                signatureImage = image
                try? StorageService.saveSignature(name: signatureName, image: image)
                savedSignatures = StorageService.loadSignatures()
            }
        }
        .sheet(isPresented: $showShareSheet) {
            if let exportedURL {
                ShareSheet(items: [exportedURL])
            }
        }
        .overlay {
            if isProcessing {
                ProcessingOverlay(message: "Applying signature…")
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "signature")
                .font(.system(size: 48))
                .foregroundStyle(Color.forest)
            Text("Sign any PDF")
                .font(.sectionTitle)
            Text("Draw your signature with Apple Pencil or your finger, then place it on the document.")
                .font(.bodyText)
                .foregroundStyle(Color.sandLight)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 40)
    }

    private var pdfViewer: some View {
        VStack(spacing: 8) {
            if let pdfDocument {
                PDFKitView(document: pdfDocument, pageIndex: currentPageIndex)
                    .frame(height: 360)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay {
                        if let signatureImage {
                            Image(uiImage: signatureImage)
                                .resizable()
                                .scaledToFit()
                                .frame(width: placementRect.width, height: placementRect.height)
                                .position(x: placementRect.midX, y: placementRect.midY)
                                .gesture(
                                    DragGesture()
                                        .onChanged { value in
                                            placementRect.origin = CGPoint(
                                                x: value.location.x - placementRect.width / 2,
                                                y: value.location.y - placementRect.height / 2
                                            )
                                        }
                                )
                        }
                    }
                    .padding(.horizontal, 16)

                HStack {
                    Button {
                        currentPageIndex = max(0, currentPageIndex - 1)
                    } label: {
                        Image(systemName: "chevron.left")
                    }
                    .disabled(currentPageIndex == 0)

                    Text("Page \(currentPageIndex + 1) of \(pdfDocument.pageCount)")
                        .font(.captionText)

                    Button {
                        currentPageIndex = min(pdfDocument.pageCount - 1, currentPageIndex + 1)
                    } label: {
                        Image(systemName: "chevron.right")
                    }
                    .disabled(currentPageIndex >= pdfDocument.pageCount - 1)
                }
            }
        }
    }

    private var signatureControls: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Signature")
                .font(.cardTitle)
                .padding(.horizontal, 20)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    Button {
                        showSignatureSheet = true
                    } label: {
                        VStack {
                            Image(systemName: "pencil.and.scribble")
                            Text("Draw New")
                                .font(.caption2)
                        }
                        .frame(width: 80, height: 60)
                        .background(Color.forest50)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }

                    ForEach(savedSignatures) { signature in
                        Button {
                            signatureImage = signature.image
                        } label: {
                            if let image = signature.image {
                                Image(uiImage: image)
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 80, height: 60)
                                    .background(Color.white)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(Color.forest.opacity(0.3), lineWidth: 1)
                                    )
                            }
                        }
                    }
                }
                .padding(.horizontal, 20)
            }
        }
    }

    private func loadPDF(from url: URL) {
        pdfURL = url
        pdfDocument = PDFDocument(url: url)
        currentPageIndex = 0
    }

    @MainActor
    private func exportSignedPDF() async {
        guard let pdfURL, let signatureImage else { return }
        isProcessing = true
        errorMessage = nil
        defer { isProcessing = false }

        do {
            let originalData = try Data(contentsOf: pdfURL)
            let signedData = try PDFService.stampSignature(
                on: originalData,
                signatureImage: signatureImage,
                pageIndex: currentPageIndex,
                rect: placementRect
            )
            exportedURL = try PDFService.writeTemporaryPDF(signedData, filename: "signed-document")
            showShareSheet = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct PDFKitView: UIViewRepresentable {
    let document: PDFDocument
    let pageIndex: Int

    func makeUIView(context: Context) -> PDFView {
        let pdfView = PDFView()
        pdfView.autoScales = true
        pdfView.displayMode = .singlePage
        pdfView.displayDirection = .vertical
        return pdfView
    }

    func updateUIView(_ pdfView: PDFView, context: Context) {
        pdfView.document = document
        if let page = document.page(at: pageIndex) {
            pdfView.go(to: page)
        }
    }
}

struct SignatureCanvasSheet: View {
    @Binding var signatureName: String
    let onSave: (UIImage) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var canvasView = PKCanvasView()

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                FormField(title: "Signature name", text: $signatureName)

                SignatureCanvasRepresentable(canvasView: $canvasView)
                    .frame(height: 200)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.cream200, lineWidth: 1)
                    )

                PrimaryButton(title: "Save Signature", icon: "checkmark") {
                    let image = canvasView.drawing.image(from: canvasView.bounds, scale: 2)
                    onSave(image)
                    dismiss()
                }
            }
            .padding(20)
            .navigationTitle("Draw Signature")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Clear") {
                        canvasView.drawing = PKDrawing()
                    }
                }
            }
        }
    }
}

struct SignatureCanvasRepresentable: UIViewRepresentable {
    @Binding var canvasView: PKCanvasView

    func makeUIView(context: Context) -> PKCanvasView {
        canvasView.drawingPolicy = .anyInput
        canvasView.tool = PKInkingTool(.pen, color: .black, width: 3)
        canvasView.backgroundColor = .white
        return canvasView
    }

    func updateUIView(_ uiView: PKCanvasView, context: Context) {}
}
