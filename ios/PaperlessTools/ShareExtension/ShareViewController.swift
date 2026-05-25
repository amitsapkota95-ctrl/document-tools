import MobileCoreServices
import UIKit
import UniformTypeIdentifiers

class ShareViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        processSharedContent()
    }

    private func processSharedContent() {
        Task {
            do {
                let manifest = try await extractAndSaveSharedContent()
                if let openURL = SharedImportService.openAppURL(for: manifest) {
                    await openMainApp(url: openURL)
                }
            } catch {
                // Nothing to import; close quietly.
            }

            await MainActor.run {
                extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
            }
        }
    }

    private func extractAndSaveSharedContent() async throws -> SharedImportManifest {
        guard let extensionItems = extensionContext?.inputItems as? [NSExtensionItem] else {
            throw SharedImportError.noSupportedContent
        }

        var pdfURLs: [URL] = []
        var imageURLs: [URL] = []
        var webURLString: String?

        for item in extensionItems {
            guard let attachments = item.attachments else { continue }

            for provider in attachments {
                if provider.hasItemConformingToTypeIdentifier(UTType.pdf.identifier),
                   let url = try await loadFile(from: provider, type: UTType.pdf) {
                    pdfURLs.append(url)
                    continue
                }

                if provider.hasItemConformingToTypeIdentifier(UTType.image.identifier),
                   let url = try await loadFile(from: provider, type: UTType.image) {
                    imageURLs.append(url)
                    continue
                }

                if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier),
                   let url = try await loadURL(from: provider) {
                    webURLString = url.absoluteString
                }
            }
        }

        if !pdfURLs.isEmpty {
            return try SharedImportService.saveImport(kind: .pdfs, fileURLs: pdfURLs)
        }

        if !imageURLs.isEmpty {
            return try SharedImportService.saveImport(kind: .images, fileURLs: imageURLs)
        }

        if let webURLString {
            return try SharedImportService.saveImport(kind: .url, urlString: webURLString)
        }

        throw SharedImportError.noSupportedContent
    }

    private func loadFile(from provider: NSItemProvider, type: UTType) async throws -> URL? {
        try await withCheckedThrowingContinuation { continuation in
            provider.loadFileRepresentation(forTypeIdentifier: type.identifier) { url, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                guard let url else {
                    continuation.resume(returning: nil)
                    return
                }

                let tempURL = FileManager.default.temporaryDirectory
                    .appendingPathComponent(UUID().uuidString)
                    .appendingPathExtension(url.pathExtension)

                do {
                    if FileManager.default.fileExists(atPath: tempURL.path) {
                        try FileManager.default.removeItem(at: tempURL)
                    }
                    try FileManager.default.copyItem(at: url, to: tempURL)
                    continuation.resume(returning: tempURL)
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }

    private func loadURL(from provider: NSItemProvider) async throws -> URL? {
        try await withCheckedThrowingContinuation { continuation in
            provider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { item, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                if let url = item as? URL {
                    continuation.resume(returning: url)
                    return
                }

                if let urlString = item as? String, let url = URL(string: urlString) {
                    continuation.resume(returning: url)
                    return
                }

                continuation.resume(returning: nil)
            }
        }
    }

    @MainActor
    private func openMainApp(url: URL) async {
        _ = await extensionContext?.open(url)
    }
}
