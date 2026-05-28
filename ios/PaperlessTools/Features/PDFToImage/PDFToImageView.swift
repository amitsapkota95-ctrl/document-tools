import PDFKit
import SwiftUI
import UniformTypeIdentifiers

struct PDFToImageView: View {
    @State private var pdfURL: URL?
    @State private var pdfDocument: PDFDocument?
    @State private var selectedPages = Set<Int>()
    @State private var showPicker = false
    @State private var format: ExportImageFormat = .png
    @State private var isLoadingPDF = false
    @State private var isProcessing = false
    @State private var processingMessage = "Converting pages…"
    @State private var errorMessage: String?
    @State private var exportedURL: URL?
    @State private var showShareSheet = false

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if pdfDocument == nil {
                    emptyState
                } else if let pdfDocument {
                    documentSummary(pdfDocument)
                    pageSelectionHeader(pdfDocument)
                    pagePreviewGrid(pdfDocument)
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Image format")
                        .font(.sectionTitle)

                    Picker("Image format", selection: $format) {
                        ForEach(ExportImageFormat.allCases) { option in
                            Text(option.label).tag(option)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                .padding(16)
                .background(Color.cream)
                .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))

                if let errorMessage {
                    Text(errorMessage)
                        .font(.captionText)
                        .foregroundStyle(.red)
                }

                VStack(spacing: 12) {
                    PrimaryButton(
                        title: pdfDocument == nil ? "Choose PDF" : "Change PDF",
                        icon: "doc"
                    ) {
                        showPicker = true
                    }

                    if pdfDocument != nil {
                        PrimaryButton(
                            title: "Save as \(format.label)",
                            icon: "photo",
                            isLoading: isProcessing,
                            isDisabled: isLoadingPDF || selectedPages.isEmpty
                        ) {
                            Task { await exportImages() }
                        }
                    }
                }

            }
            .padding(20)
        }
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle("PDF to Image")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showPicker) {
            DocumentPicker(contentTypes: [.pdf], allowsMultipleSelection: false) { urls in
                if let url = urls.first {
                    loadPDF(from: url)
                }
            }
        }
        .sheet(isPresented: $showShareSheet) {
            if let exportedURL {
                ShareSheet(items: [exportedURL])
            }
        }
        .overlay {
            if isLoadingPDF {
                ProcessingOverlay(message: "Loading PDF…")
            } else if isProcessing {
                ProcessingOverlay(message: processingMessage)
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "photo.on.rectangle.angled")
                .font(.system(size: 48))
                .foregroundStyle(Color.forest)
            Text("Convert PDF pages to images")
                .font(.sectionTitle)
            Text("Select the pages you want, then export them as PNG or JPEG.")
                .font(.bodyText)
                .foregroundStyle(Color.sandLight)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 20)
    }

    private func documentSummary(_ document: PDFDocument) -> some View {
        HStack {
            Image(systemName: "doc.fill")
                .foregroundStyle(Color.forest)
            VStack(alignment: .leading, spacing: 4) {
                Text(pdfURL?.lastPathComponent ?? "Document")
                    .font(.bodyText.weight(.semibold))
                    .lineLimit(1)
                Text("\(selectedPages.count) of \(document.pageCount) page\(document.pageCount == 1 ? "" : "s") selected")
                    .font(.captionText)
                    .foregroundStyle(Color.sandLight)
            }
            Spacer()
        }
        .padding(16)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }

    private func pageSelectionHeader(_ document: PDFDocument) -> some View {
        HStack {
            Text("Tap pages to include or exclude")
                .font(.captionText)
                .foregroundStyle(Color.sandLight)

            Spacer()

            Button("Select All") {
                selectedPages = Set(0..<document.pageCount)
            }
            .font(.captionText.weight(.semibold))
            .foregroundStyle(Color.forest)

            Button("Deselect All") {
                selectedPages.removeAll()
            }
            .font(.captionText.weight(.semibold))
            .foregroundStyle(Color.forest)
        }
    }

    private func pagePreviewGrid(_ document: PDFDocument) -> some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            ForEach(0..<document.pageCount, id: \.self) { index in
                if let page = document.page(at: index) {
                    pageCell(page: page, index: index)
                }
            }
        }
    }

    private func pageCell(page: PDFPage, index: Int) -> some View {
        let isSelected = selectedPages.contains(index)
        let thumbnail = page.thumbnail(of: CGSize(width: 120, height: 160), for: .mediaBox)

        return Button {
            if isSelected {
                selectedPages.remove(index)
            } else {
                selectedPages.insert(index)
            }
        } label: {
            VStack(spacing: 6) {
                Image(uiImage: thumbnail)
                    .resizable()
                    .scaledToFit()
                    .frame(height: 120)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .overlay {
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(isSelected ? Color.forest : Color.clear, lineWidth: 3)
                    }

                Text("Page \(index + 1)")
                    .font(.captionText)
                    .foregroundStyle(Color.ink)
            }
        }
        .buttonStyle(.plain)
    }

    private func loadPDF(from url: URL) {
        Task {
            isLoadingPDF = true
            errorMessage = nil
            defer { isLoadingPDF = false }
            await Task.yield()

            do {
                let data = try Data(contentsOf: url)
                guard let document = PDFDocument(data: data), document.pageCount > 0 else {
                    throw PDFServiceError.invalidPDF
                }
                let tempURL = try PDFService.writeTemporaryPDF(
                    data,
                    filename: url.deletingPathExtension().lastPathComponent
                )
                pdfURL = tempURL
                pdfDocument = document
                selectedPages = Set(0..<document.pageCount)
            } catch {
                pdfURL = nil
                pdfDocument = nil
                selectedPages.removeAll()
                errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            }
        }
    }

    @MainActor
    private func exportImages() async {
        guard let pdfURL else { return }

        isProcessing = true
        processingMessage = "Converting pages…"
        errorMessage = nil
        await Task.yield()

        let baseName = pdfURL.deletingPathExtension().lastPathComponent
        let format = self.format
        let sourceURL = pdfURL
        let pageIndices = Array(selectedPages).sorted()

        defer { isProcessing = false }

        do {
            let exportURL = try await Task.detached(priority: .userInitiated) {
                let images = try PDFService.pdfToImages(from: sourceURL, format: format, pageIndices: pageIndices)
                let entries: [(name: String, data: Data)] = try images.map { item in
                    let data: Data?
                    switch format {
                    case .png:
                        data = item.image.pngData()
                    case .jpeg:
                        data = item.image.jpegData(compressionQuality: 0.92)
                    }
                    guard let data else { throw PDFServiceError.exportFailed }
                    return (name: item.name, data: data)
                }
                return try PDFService.exportFiles(named: "\(baseName)-images", entries: entries)
            }.value

            exportedURL = exportURL
            showShareSheet = true
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }
}
