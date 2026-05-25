import Foundation

enum AppGroupConstants {
    static let identifier = "group.tools.paperless.app"
    static let urlScheme = "paperlesstools"
    static let importsDirectoryName = "SharedImports"
    static let manifestFileName = "manifest.json"
}

enum SharedImportKind: String, Codable {
    case pdfs
    case images
    case url
}

struct SharedImportManifest: Codable {
    let id: String
    let kind: SharedImportKind
    let fileNames: [String]
    let urlString: String?
}

enum SharedImportService {
    static var containerURL: URL? {
        FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: AppGroupConstants.identifier)
    }

    static func importDirectory(for id: String) -> URL? {
        containerURL?
            .appendingPathComponent(AppGroupConstants.importsDirectoryName, isDirectory: true)
            .appendingPathComponent(id, isDirectory: true)
    }

    static func saveImport(
        kind: SharedImportKind,
        fileURLs: [URL] = [],
        urlString: String? = nil
    ) throws -> SharedImportManifest {
        guard let containerURL else { throw SharedImportError.appGroupUnavailable }

        let importID = UUID().uuidString
        let importDirectory = containerURL
            .appendingPathComponent(AppGroupConstants.importsDirectoryName, isDirectory: true)
            .appendingPathComponent(importID, isDirectory: true)

        try FileManager.default.createDirectory(at: importDirectory, withIntermediateDirectories: true)

        var savedFileNames: [String] = []
        for sourceURL in fileURLs {
            let fileName = uniqueFileName(for: sourceURL.lastPathComponent, in: savedFileNames)
            let destinationURL = importDirectory.appendingPathComponent(fileName)
            if FileManager.default.fileExists(atPath: destinationURL.path) {
                try FileManager.default.removeItem(at: destinationURL)
            }
            try FileManager.default.copyItem(at: sourceURL, to: destinationURL)
            savedFileNames.append(fileName)
        }

        let manifest = SharedImportManifest(
            id: importID,
            kind: kind,
            fileNames: savedFileNames,
            urlString: urlString
        )

        let manifestData = try JSONEncoder().encode(manifest)
        try manifestData.write(to: importDirectory.appendingPathComponent(AppGroupConstants.manifestFileName))

        return manifest
    }

    static func consumeImport(id: String) throws -> (manifest: SharedImportManifest, fileURLs: [URL]) {
        guard let importDirectory = importDirectory(for: id) else {
            throw SharedImportError.appGroupUnavailable
        }

        let manifestURL = importDirectory.appendingPathComponent(AppGroupConstants.manifestFileName)
        let manifestData = try Data(contentsOf: manifestURL)
        let manifest = try JSONDecoder().decode(SharedImportManifest.self, from: manifestData)

        let fileURLs = manifest.fileNames.map { importDirectory.appendingPathComponent($0) }
        return (manifest, fileURLs)
    }

    static func deleteImport(id: String) {
        guard let importDirectory = importDirectory(for: id) else { return }
        try? FileManager.default.removeItem(at: importDirectory)
    }

    static func openAppURL(for manifest: SharedImportManifest) -> URL? {
        var components = URLComponents()
        components.scheme = AppGroupConstants.urlScheme
        components.host = "import"
        components.queryItems = [URLQueryItem(name: "id", value: manifest.id)]
        return components.url
    }

    private static func uniqueFileName(for proposedName: String, in existing: [String]) -> String {
        guard existing.contains(proposedName) else { return proposedName }

        let base = (proposedName as NSString).deletingPathExtension
        let ext = (proposedName as NSString).pathExtension
        var counter = 2

        while true {
            let candidate = ext.isEmpty ? "\(base)-\(counter)" : "\(base)-\(counter).\(ext)"
            if !existing.contains(candidate) { return candidate }
            counter += 1
        }
    }
}

enum SharedImportError: LocalizedError {
    case appGroupUnavailable
    case noSupportedContent

    var errorDescription: String? {
        switch self {
        case .appGroupUnavailable:
            return "Shared storage is unavailable."
        case .noSupportedContent:
            return "No supported content was found to import."
        }
    }
}
