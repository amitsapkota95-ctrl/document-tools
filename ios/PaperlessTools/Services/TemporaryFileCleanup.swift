import Foundation

enum TemporaryFileCleanup {
    private static let maxAge: TimeInterval = 24 * 60 * 60
    private static let extensionsToPurge = ["pdf", "zip", "png", "jpg", "jpeg", "txt"]

    static func purgeStaleExports() {
        let directory = FileManager.default.temporaryDirectory
        let cutoff = Date().addingTimeInterval(-maxAge)

        guard let urls = try? FileManager.default.contentsOfDirectory(
            at: directory,
            includingPropertiesForKeys: [.contentModificationDateKey],
            options: [.skipsHiddenFiles]
        ) else {
            return
        }

        for url in urls {
            guard extensionsToPurge.contains(url.pathExtension.lowercased()) else { continue }

            let values = try? url.resourceValues(forKeys: [.contentModificationDateKey])
            let modified = values?.contentModificationDate ?? .distantPast
            if modified < cutoff {
                try? FileManager.default.removeItem(at: url)
            }
        }
    }
}
