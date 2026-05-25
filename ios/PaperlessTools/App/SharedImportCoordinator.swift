import SwiftUI
import UIKit

enum SharedImportRoute: Identifiable, Equatable {
    case mergePDFs([URL])
    case imageToPDF([URL])
    case urlShortener(String)
    case pdfToolPicker([URL])

    var id: String {
        switch self {
        case .mergePDFs(let urls):
            return "merge-\(urls.map(\.lastPathComponent).joined(separator: "-"))"
        case .imageToPDF(let urls):
            return "images-\(urls.map(\.lastPathComponent).joined(separator: "-"))"
        case .urlShortener(let url):
            return "url-\(url)"
        case .pdfToolPicker(let urls):
            return "picker-\(urls.map(\.lastPathComponent).joined(separator: "-"))"
        }
    }
}

@MainActor
final class SharedImportCoordinator: ObservableObject {
    @Published var pendingRoute: SharedImportRoute?
    @Published var pendingImportID: String?

    func handleIncomingURL(_ url: URL) {
        guard url.scheme == AppGroupConstants.urlScheme, url.host == "import" else { return }

        let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        guard let importID = components?.queryItems?.first(where: { $0.name == "id" })?.value else { return }

        pendingImportID = importID
        routeImport(id: importID)
    }

    func routeImport(id: String) {
        do {
            let (manifest, fileURLs) = try SharedImportService.consumeImport(id: id)

            switch manifest.kind {
            case .pdfs:
                if fileURLs.count == 1 {
                    pendingRoute = .pdfToolPicker(fileURLs)
                } else {
                    pendingRoute = .mergePDFs(fileURLs)
                }
            case .images:
                pendingRoute = .imageToPDF(fileURLs)
            case .url:
                if let urlString = manifest.urlString {
                    pendingRoute = .urlShortener(urlString)
                }
            }

            pendingImportID = id
        } catch {
            SharedImportService.deleteImport(id: id)
            pendingImportID = nil
        }
    }

    func clearPendingImport() {
        if let pendingImportID {
            SharedImportService.deleteImport(id: pendingImportID)
        }
        pendingImportID = nil
        pendingRoute = nil
    }
}

struct SharedImportDestinationView: View {
    let route: SharedImportRoute
    let onDismiss: () -> Void

    @State private var pickerNavigationPath = NavigationPath()

    var body: some View {
        NavigationStack(path: $pickerNavigationPath) {
            rootView
                .navigationDestination(for: ToolDestination.self) { destination in
                    destinationView(for: destination)
                }
        }
    }

    @ViewBuilder
    private var rootView: some View {
        switch route {
        case .mergePDFs(let urls):
            MergePDFView(initialPDFURLs: urls)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Done") { onDismiss() }
                    }
                }
        case .imageToPDF(let urls):
            ImageToPDFView(initialImageURLs: urls)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Done") { onDismiss() }
                    }
                }
        case .urlShortener(let urlString):
            URLShortenerView(initialURL: urlString)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Done") { onDismiss() }
                    }
                }
        case .pdfToolPicker(let urls):
            SharedPDFToolPickerView(pdfURLs: urls, navigationPath: $pickerNavigationPath, onDismiss: onDismiss)
        }
    }
}

struct SharedPDFToolPickerView: View {
    let pdfURLs: [URL]
    @Binding var navigationPath: NavigationPath
    let onDismiss: () -> Void

    private let toolOptions: [(title: String, icon: String, destination: ToolDestination)] = [
        ("Combine PDFs", "doc.on.doc", .mergePdf),
        ("Make File Smaller", "arrow.down.right.and.arrow.up.left", .compressPdf),
        ("Fill & Sign", "signature", .fillAndSign),
        ("Split PDF", "scissors", .splitPdf),
        ("Redact PDF", "eye.slash", .redactPdf),
        ("Crop PDF", "crop", .cropPdf),
        ("Extract Text", "text.viewfinder", .extractText),
    ]

    var body: some View {
        List {
            Section {
                ForEach(pdfURLs, id: \.absoluteString) { url in
                    Label(url.lastPathComponent, systemImage: "doc.fill")
                }
            } header: {
                Text("Shared PDF")
            }

            Section("Open with") {
                ForEach(toolOptions, id: \.destination) { option in
                    Button {
                        SharedPDFImportStore.sharedURLs = pdfURLs
                        navigationPath.append(option.destination)
                    } label: {
                        Label(option.title, systemImage: option.icon)
                    }
                }
            }
        }
        .navigationTitle("Import PDF")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Done") { onDismiss() }
            }
        }
    }
}

enum SharedPDFImportStore {
    static var sharedURLs: [URL] = []

    static func consumeSharedPDFURL() -> URL? {
        defer { sharedURLs = [] }
        return sharedURLs.first
    }

    static func consumeSharedPDFURLs() -> [URL] {
        defer { sharedURLs = [] }
        return sharedURLs
    }
}
