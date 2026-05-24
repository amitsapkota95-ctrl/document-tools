import Foundation
import PDFKit
import Vision

enum OCRServiceError: LocalizedError {
    case recognitionFailed
    case noTextFound

    var errorDescription: String? {
        switch self {
        case .recognitionFailed: return "Could not read text from this PDF."
        case .noTextFound: return "No text was found in this document."
        }
    }
}

enum OCRService {
    static func extractEmbeddedText(from document: PDFDocument) -> String {
        var sections: [String] = []

        for index in 0..<document.pageCount {
            guard let page = document.page(at: index), let text = page.string?.trimmingCharacters(in: .whitespacesAndNewlines), !text.isEmpty else {
                continue
            }
            sections.append("--- Page \(index + 1) ---\n\(text)")
        }

        return sections.joined(separator: "\n\n")
    }

    static func extractText(from url: URL, useOCR: Bool) async throws -> String {
        let document = try PDFService.loadDocument(from: url)
        let embedded = extractEmbeddedText(from: document)

        if embedded.count >= 50 || !useOCR {
            guard !embedded.isEmpty else { throw OCRServiceError.noTextFound }
            return embedded
        }

        var sections: [String] = []
        for index in 0..<document.pageCount {
            guard let page = document.page(at: index),
                  let image = PDFService.renderPageForExport(page, scale: 2.0),
                  let cgImage = image.cgImage else {
                continue
            }

            let pageText = try await recognizeText(in: cgImage)
            if !pageText.isEmpty {
                sections.append("--- Page \(index + 1) ---\n\(pageText)")
            }
        }

        guard !sections.isEmpty else { throw OCRServiceError.noTextFound }
        return sections.joined(separator: "\n\n")
    }

    private static func recognizeText(in image: CGImage) async throws -> String {
        try await withCheckedThrowingContinuation { continuation in
            let request = VNRecognizeTextRequest { request, error in
                if error != nil {
                    continuation.resume(throwing: OCRServiceError.recognitionFailed)
                    return
                }

                let observations = request.results as? [VNRecognizedTextObservation] ?? []
                let lines = observations.compactMap { $0.topCandidates(1).first?.string }
                continuation.resume(returning: lines.joined(separator: "\n"))
            }

            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true

            let handler = VNImageRequestHandler(cgImage: image, options: [:])
            do {
                try handler.perform([request])
            } catch {
                continuation.resume(throwing: OCRServiceError.recognitionFailed)
            }
        }
    }
}
