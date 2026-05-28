import Foundation
import UIKit

struct SavedSignature: Identifiable, Codable {
    let id: UUID
    let name: String
    let imageData: Data
    let createdAt: Date

    var image: UIImage? {
        UIImage(data: imageData)
    }
}

enum StorageService {
    private static let signaturesKey = "paperless-signatures"
    private static let maxSignatures = 10

    static func loadSignatures() -> [SavedSignature] {
        guard let data = UserDefaults.standard.data(forKey: signaturesKey),
              let signatures = try? JSONDecoder().decode([SavedSignature].self, from: data) else {
            return []
        }
        return signatures.sorted { $0.createdAt > $1.createdAt }
    }

    static func saveSignature(name: String, image: UIImage) throws {
        guard let imageData = image.pngData() else { return }
        var signatures = loadSignatures()
        if signatures.contains(where: { $0.imageData == imageData }) {
            return
        }
        let signature = SavedSignature(
            id: UUID(),
            name: name,
            imageData: imageData,
            createdAt: .now
        )
        signatures.insert(signature, at: 0)
        if signatures.count > maxSignatures {
            signatures = Array(signatures.prefix(maxSignatures))
        }
        let data = try JSONEncoder().encode(signatures)
        UserDefaults.standard.set(data, forKey: signaturesKey)
    }

    static func deleteSignature(id: UUID) {
        var signatures = loadSignatures()
        signatures.removeAll { $0.id == id }
        if let data = try? JSONEncoder().encode(signatures) {
            UserDefaults.standard.set(data, forKey: signaturesKey)
        }
    }
}

enum QRImageGenerator {
    static func generateImage(from payload: String, size: CGFloat = 512) -> UIImage? {
        guard let filter = CIFilter(name: "CIQRCodeGenerator") else { return nil }
        let data = Data(payload.utf8)
        filter.setValue(data, forKey: "inputMessage")
        filter.setValue("M", forKey: "inputCorrectionLevel")

        guard let output = filter.outputImage else { return nil }
        let scale = size / output.extent.width
        let transformed = output.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
        let context = CIContext()
        guard let cgImage = context.createCGImage(transformed, from: transformed.extent) else { return nil }
        return UIImage(cgImage: cgImage)
    }
}
