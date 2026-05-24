import PDFKit
import PhotosUI
import SwiftUI
import UniformTypeIdentifiers

struct ImageToPDFView: View {
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var images: [UIImage] = []
    @State private var pageSize: PDFPageSize = .a4
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

                    PhotosPicker(selection: $selectedItems, maxSelectionCount: 20, matching: .images) {
                        Label("Choose from Photos", systemImage: "photo.on.rectangle")
                            .font(.buttonLabel)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .foregroundStyle(Color.forest)
                            .background(Color.forest50)
                            .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.buttonCornerRadius))
                    }
                    .onChange(of: selectedItems) { _, newItems in
                        Task { await loadImages(from: newItems) }
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

                if !images.isEmpty {
                    imagePreviewGrid

                    PrimaryButton(title: "Create PDF", icon: "doc.fill", isLoading: isProcessing) {
                        Task { await exportPDF() }
                    }
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.captionText)
                        .foregroundStyle(.red)
                }

                PrivacyBadge()
            }
            .padding(20)
        }
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle("Images to PDF")
        .navigationBarTitleDisplayMode(.inline)
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

    private var imagePreviewGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
            ForEach(Array(images.enumerated()), id: \.offset) { _, image in
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .frame(height: 100)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
    }

    @MainActor
    private func loadImages(from items: [PhotosPickerItem]) async {
        var loaded: [UIImage] = []
        for item in items {
            if let data = try? await item.loadTransferable(type: Data.self),
               let image = UIImage(data: data) {
                loaded.append(image)
            }
        }
        images = loaded
    }

    @MainActor
    private func exportPDF() async {
        isProcessing = true
        errorMessage = nil
        defer { isProcessing = false }

        do {
            let data = try PDFService.imagesToPDF(images: images, pageSize: pageSize)
            exportedURL = try PDFService.writeTemporaryPDF(data, filename: "images-document")
            showShareSheet = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
