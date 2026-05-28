import PDFKit
import SwiftUI
import UniformTypeIdentifiers

struct CropPDFView: View {
    @State private var pdfURL: URL?
    @State private var pdfDocument: PDFDocument?
    @State private var currentPage = 0
    @State private var cropBoxesByPage: [Int: [CGRect]] = [:]
    @State private var applyToAllPages = true
    @State private var sharedCropSourcePage = 0
    @State private var showPicker = false
    @State private var isProcessing = false
    @State private var errorMessage: String?
    @State private var exportedURL: URL?
    @State private var showShareSheet = false

    private var activeCropPage: Int {
        applyToAllPages ? sharedCropSourcePage : currentPage
    }

    private var activeCropBoxes: [CGRect] {
        cropBoxesByPage[activeCropPage] ?? []
    }

    private var canUndo: Bool {
        !activeCropBoxes.isEmpty
    }

    private var hasAnyCrops: Bool {
        !cropBoxesByPage.values.flatMap({ $0 }).isEmpty
    }

    private var cropInstructionText: String {
        if activeCropBoxes.isEmpty {
            return "Drag a box over the area you want to keep."
        }
        if applyToAllPages {
            return "Shaded areas will be removed from every page. Only the boxed region is kept."
        }
        return "Shaded areas will be removed. Only the boxed region on each page is kept."
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

                    PageBoxOverlay(
                        pageImage: page.thumbnail(of: CGSize(width: 600, height: 800), for: .mediaBox),
                        mode: .singleCrop,
                        boxes: cropBoxesBinding
                    )
                    .id(currentPage)
                    .frame(minHeight: 280)
                    .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))

                    Text(cropInstructionText)
                        .font(.caption2)
                        .foregroundStyle(Color.sandLight)
                        .multilineTextAlignment(.center)
                }

                VStack(spacing: 12) {
                    if let errorMessage {
                        Text(errorMessage).font(.captionText).foregroundStyle(.red)
                    }

                    if pdfDocument != nil, !activeCropBoxes.isEmpty {
                        Toggle("Apply crop to all pages", isOn: $applyToAllPages)
                            .font(.bodyText)
                            .padding(.horizontal, 4)
                            .onChange(of: applyToAllPages) { _, isOn in
                                if isOn {
                                    sharedCropSourcePage = currentPage
                                }
                            }
                    }

                    PrimaryButton(title: "Change PDF", icon: "doc") {
                        showPicker = true
                    }

                    if pdfDocument != nil, hasAnyCrops {
                        PrimaryButton(title: "Crop PDF", icon: "crop", isLoading: isProcessing) {
                            Task { await crop() }
                        }
                    }
                }
            }
            .padding(20)
        }
    }

    private var cropBoxesBinding: Binding<[CGRect]> {
        Binding(
            get: {
                if applyToAllPages {
                    return cropBoxesByPage[sharedCropSourcePage] ?? []
                }
                return cropBoxesByPage[currentPage] ?? []
            },
            set: { newBoxes in
                let pageKey = applyToAllPages ? sharedCropSourcePage : currentPage
                var updated = cropBoxesByPage
                if newBoxes.isEmpty {
                    updated.removeValue(forKey: pageKey)
                } else {
                    updated[pageKey] = newBoxes
                }
                cropBoxesByPage = updated
            }
        )
    }

    private func compactToolbar(pageCount: Int) -> some View {
        HStack(spacing: 12) {
            Button {
                currentPage = max(0, currentPage - 1)
            } label: {
                Image(systemName: "chevron.left")
            }
            .disabled(currentPage == 0)

            Text("Page \(currentPage + 1) of \(pageCount)")
                .font(.bodyText.weight(.semibold))
                .lineLimit(1)
                .minimumScaleFactor(0.85)

            Button {
                currentPage = min(pageCount - 1, currentPage + 1)
            } label: {
                Image(systemName: "chevron.right")
            }
            .disabled(currentPage >= pageCount - 1)

            Spacer(minLength: 8)

            Button {
                undoLastCrop()
            } label: {
                Label("Undo", systemImage: "arrow.uturn.backward")
                    .font(.captionText.weight(.semibold))
            }
            .disabled(!canUndo)
            .foregroundStyle(canUndo ? Color.forest : Color.sandLight)
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
                .multilineTextAlignment(.center)
        }
    }

    private func loadPDF(_ url: URL) {
        currentPage = 0
        cropBoxesByPage = [:]
        applyToAllPages = true
        sharedCropSourcePage = 0
        errorMessage = nil

        do {
            pdfDocument = try PDFService.loadDocument(from: url)
            pdfURL = url
        } catch {
            pdfDocument = nil
            pdfURL = nil
            errorMessage = error.localizedDescription
        }
    }

    private func undoLastCrop() {
        var pageBoxes = cropBoxesByPage[activeCropPage] ?? []
        guard !pageBoxes.isEmpty else { return }
        pageBoxes.removeLast()
        var updated = cropBoxesByPage
        if pageBoxes.isEmpty {
            updated.removeValue(forKey: activeCropPage)
        } else {
            updated[activeCropPage] = pageBoxes
        }
        cropBoxesByPage = updated
    }

    @MainActor
    private func crop() async {
        guard let pdfURL else { return }
        isProcessing = true
        errorMessage = nil
        defer { isProcessing = false }

        do {
            let sourceURL = pdfURL
            let boxes = cropBoxesByPage
            let applyAll = applyToAllPages
            let sourcePage = sharedCropSourcePage

            let data = try await Task.detached(priority: .userInitiated) {
                try PDFService.cropPDF(
                    from: sourceURL,
                    cropBoxesByPage: boxes,
                    applyToAllPages: applyAll,
                    sourcePageIndex: sourcePage
                )
            }.value

            let base = sourceURL.deletingPathExtension().lastPathComponent
            exportedURL = try PDFService.writeTemporaryPDF(data, filename: "\(base)-cropped")
            showShareSheet = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
