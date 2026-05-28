import PDFKit
import PhotosUI
import SwiftUI
import UniformTypeIdentifiers

private struct ImageItem: Identifiable {
    let id: UUID
    let image: UIImage
}

struct ImageToPDFView: View {
    var initialImageURLs: [URL] = []

    private let maxImageCount = 20

    @State private var pickerSelection: [PhotosPickerItem] = []
    @State private var imageItems: [ImageItem] = []
    @State private var loadedItemIdentifiers: Set<String> = []
    @State private var pageSize: PDFPageSize = .fit
    @State private var isLoadingImages = false
    @State private var isProcessing = false
    @State private var errorMessage: String?
    @State private var exportedURL: URL?
    @State private var showShareSheet = false

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Select images")
                        .font(.sectionTitle)

                    PhotosPicker(
                        selection: $pickerSelection,
                        maxSelectionCount: max(1, maxImageCount - imageItems.count),
                        matching: .images
                    ) {
                        Label(
                            imageItems.isEmpty ? "Choose from Photos" : "Add More Photos",
                            systemImage: "photo.on.rectangle"
                        )
                        .font(.buttonLabel)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .foregroundStyle(Color.forest)
                        .background(Color.forest50)
                        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.buttonCornerRadius))
                    }
                    .disabled(isLoadingImages || imageItems.count >= maxImageCount)
                    .onChange(of: pickerSelection) { _, newItems in
                        guard !newItems.isEmpty else { return }
                        Task { await appendImages(from: newItems) }
                    }

                    if !imageItems.isEmpty {
                        HStack {
                            Text("\(imageItems.count) of \(maxImageCount) images")
                                .font(.captionText)
                                .foregroundStyle(Color.sandLight)

                            Spacer()

                            Button("Clear All") {
                                resetImages()
                            }
                            .font(.captionText.weight(.semibold))
                            .foregroundStyle(Color.forest)
                        }
                    }

                    Picker("Page size", selection: $pageSize) {
                        ForEach(PDFPageSize.allCases) { size in
                            Text(size.label).tag(size)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                .padding(20)
                .background(Color.cream)
                .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))

                if !imageItems.isEmpty {
                    imagePreviewList

                    PrimaryButton(title: "Create PDF", icon: "doc.fill", isLoading: isProcessing) {
                        Task { await exportPDF() }
                    }
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.captionText)
                        .foregroundStyle(.red)
                }

            }
            .padding(20)
        }
        .paperlessScreenBackground()
        .navigationTitle("Images to PDF")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showShareSheet) {
            if let exportedURL {
                ShareSheet(items: [exportedURL])
            }
        }
        .overlay {
            if isLoadingImages {
                ProcessingOverlay(message: loadingMessage)
            } else if isProcessing {
                ProcessingOverlay(message: "Creating PDF…")
            }
        }
        .task {
            guard imageItems.isEmpty, !initialImageURLs.isEmpty else { return }
            await loadImages(from: initialImageURLs)
        }
    }

    private var loadingMessage: String {
        if imageItems.isEmpty {
            return "Loading images…"
        }
        return "Adding photos…"
    }

    private var imagePreviewList: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Drag to reorder. PDF pages follow this order.")
                .font(.captionText)
                .foregroundStyle(Color.sandLight)

            List {
                ForEach(Array(imageItems.enumerated()), id: \.element.id) { index, item in
                    HStack(spacing: 12) {
                        Image(uiImage: item.image)
                            .resizable()
                            .scaledToFill()
                            .frame(width: 56, height: 56)
                            .clipShape(RoundedRectangle(cornerRadius: 8))

                        Text("Image \(index + 1)")
                            .font(.bodyText)
                            .lineLimit(1)

                        Spacer()

                        Text("#\(index + 1)")
                            .font(.captionText)
                            .foregroundStyle(Color.sandLight)
                    }
                }
                .onMove { from, to in
                    imageItems.move(fromOffsets: from, toOffset: to)
                }
                .onDelete { indexSet in
                    imageItems.remove(atOffsets: indexSet)
                }
            }
            .paperlessListStyle()
            .frame(minHeight: CGFloat(imageItems.count) * 64 + 16)
            .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
            .environment(\.editMode, .constant(.active))
        }
    }

    @MainActor
    private func loadImages(from urls: [URL]) async {
        isLoadingImages = true
        errorMessage = nil
        defer { isLoadingImages = false }

        let loaded = await Task.detached(priority: .userInitiated) {
            urls.compactMap { url -> UIImage? in
                guard let data = try? Data(contentsOf: url) else { return nil }
                return UIImage(data: data)
            }
        }.value

        let remainingCapacity = max(0, maxImageCount - imageItems.count)
        let newItems = loaded.prefix(remainingCapacity).map { ImageItem(id: UUID(), image: $0) }
        imageItems.append(contentsOf: newItems)

        if loaded.count > remainingCapacity {
            errorMessage = "Maximum of \(maxImageCount) images reached."
        }
    }

    @MainActor
    private func appendImages(from items: [PhotosPickerItem]) async {
        guard !items.isEmpty else { return }

        isLoadingImages = true
        errorMessage = nil
        defer {
            isLoadingImages = false
            pickerSelection = []
        }

        var addedCount = 0

        for item in items {
            guard imageItems.count < maxImageCount else { break }

            if let identifier = item.itemIdentifier, loadedItemIdentifiers.contains(identifier) {
                continue
            }

            guard let data = try? await item.loadTransferable(type: Data.self),
                  let image = UIImage(data: data) else {
                continue
            }

            imageItems.append(ImageItem(id: UUID(), image: image))
            addedCount += 1

            if let identifier = item.itemIdentifier {
                loadedItemIdentifiers.insert(identifier)
            }
        }

        if addedCount == 0, !items.isEmpty {
            errorMessage = "Could not load the selected photos."
        } else if imageItems.count >= maxImageCount {
            errorMessage = "Maximum of \(maxImageCount) images reached."
        }
    }

    private func resetImages() {
        imageItems = []
        loadedItemIdentifiers = []
        pickerSelection = []
        errorMessage = nil
    }

    @MainActor
    private func exportPDF() async {
        isProcessing = true
        errorMessage = nil
        defer { isProcessing = false }

        do {
            let selectedImages = imageItems.map(\.image)
            let selectedPageSize = pageSize
            let data = try await Task.detached(priority: .userInitiated) {
                try PDFService.imagesToPDF(images: selectedImages, pageSize: selectedPageSize)
            }.value
            exportedURL = try PDFService.writeTemporaryPDF(data, filename: "images-document")
            showShareSheet = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
