import Foundation
import PDFKit
import UIKit

enum PDFPageSize: String, CaseIterable, Identifiable {
    case a4
    case letter
    case fit

    var id: String { rawValue }

    var label: String {
        switch self {
        case .a4: return "A4"
        case .letter: return "Letter"
        case .fit: return "Fit to image"
        }
    }

    var sizeInPoints: CGSize {
        switch self {
        case .a4: return CGSize(width: 595.28, height: 841.89)
        case .letter: return CGSize(width: 612, height: 792)
        case .fit: return .zero
        }
    }
}

enum PDFServiceError: LocalizedError {
    case invalidPDF
    case mergeFailed
    case exportFailed
    case noPages

    var errorDescription: String? {
        switch self {
        case .invalidPDF: return "Could not read the PDF file."
        case .mergeFailed: return "Could not merge PDF files."
        case .exportFailed: return "Could not export the PDF."
        case .noPages: return "No pages to export."
        }
    }
}

enum PDFService {
    static func mergePDFs(from urls: [URL]) throws -> Data {
        let merged = PDFDocument()
        var pageIndex = 0

        for url in urls {
            guard let document = PDFDocument(url: url) else {
                throw PDFServiceError.invalidPDF
            }
            for index in 0..<document.pageCount {
                guard let page = document.page(at: index) else { continue }
                merged.insert(page, at: pageIndex)
                pageIndex += 1
            }
        }

        guard pageIndex > 0, let data = merged.dataRepresentation() else {
            throw PDFServiceError.mergeFailed
        }
        return data
    }

    static func imagesToPDF(images: [UIImage], pageSize: PDFPageSize) throws -> Data {
        guard !images.isEmpty else { throw PDFServiceError.noPages }

        let pdfData = NSMutableData()
        UIGraphicsBeginPDFContextToData(pdfData, .zero, nil)

        for image in images {
            let pageRect: CGRect
            if pageSize == .fit {
                pageRect = CGRect(origin: .zero, size: image.size)
            } else {
                pageRect = CGRect(origin: .zero, size: pageSize.sizeInPoints)
            }

            UIGraphicsBeginPDFPageWithInfo(pageRect, nil)

            let drawRect = aspectFitRect(for: image.size, in: pageRect)
            image.draw(in: drawRect)
        }

        UIGraphicsEndPDFContext()
        return pdfData as Data
    }

    static func scannedPagesToPDF(_ images: [UIImage]) throws -> Data {
        try imagesToPDF(images: images, pageSize: .a4)
    }

    static func stampSignature(
        on pdfData: Data,
        signatureImage: UIImage,
        pageIndex: Int,
        rect: CGRect
    ) throws -> Data {
        guard let document = PDFDocument(data: pdfData),
              pageIndex >= 0,
              pageIndex < document.pageCount,
              let page = document.page(at: pageIndex) else {
            throw PDFServiceError.invalidPDF
        }

        let annotation = PDFAnnotation(bounds: rect, forType: .stamp, withProperties: nil)
        if let cgImage = signatureImage.cgImage {
            annotation.setValue(cgImage, forAnnotationKey: .appearanceDictionary)
        }
        page.addAnnotation(annotation)

        guard let data = document.dataRepresentation() else {
            throw PDFServiceError.exportFailed
        }
        return data
    }

    static func writeTemporaryPDF(_ data: Data, filename: String) throws -> URL {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("\(FilenameHelper.sanitize(filename)).pdf")
        try data.write(to: url)
        return url
    }

    private static func aspectFitRect(for imageSize: CGSize, in container: CGRect) -> CGRect {
        guard imageSize.width > 0, imageSize.height > 0 else { return .zero }
        let widthRatio = container.width / imageSize.width
        let heightRatio = container.height / imageSize.height
        let scale = min(widthRatio, heightRatio)
        let size = CGSize(width: imageSize.width * scale, height: imageSize.height * scale)
        let origin = CGPoint(
            x: container.midX - size.width / 2,
            y: container.midY - size.height / 2
        )
        return CGRect(origin: origin, size: size)
    }
}
