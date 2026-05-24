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

enum ExportImageFormat: String, CaseIterable, Identifiable {
    case png
    case jpeg

    var id: String { rawValue }

    var label: String {
        switch self {
        case .png: return "PNG"
        case .jpeg: return "JPEG"
        }
    }

    var fileExtension: String { rawValue }
}

enum SplitMode: String, CaseIterable, Identifiable {
    case everyPage
    case byInterval
    case selectedPages

    var id: String { rawValue }

    var label: String {
        switch self {
        case .everyPage: return "Every page"
        case .byInterval: return "Every N pages"
        case .selectedPages: return "Selected pages"
        }
    }
}

enum PDFServiceError: LocalizedError {
    case invalidPDF
    case mergeFailed
    case splitFailed
    case exportFailed
    case noPages
    case invalidInterval

    var errorDescription: String? {
        switch self {
        case .invalidPDF: return "Could not read the PDF file."
        case .mergeFailed: return "Could not merge PDF files."
        case .splitFailed: return "Could not split the PDF."
        case .exportFailed: return "Could not export the PDF."
        case .noPages: return "No pages to export."
        case .invalidInterval: return "Enter a page interval of at least 1."
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

    static func loadDocument(from url: URL) throws -> PDFDocument {
        guard let document = PDFDocument(url: url), document.pageCount > 0 else {
            throw PDFServiceError.invalidPDF
        }
        return document
    }

    static func splitEveryPage(from url: URL, baseName: String) throws -> [(name: String, data: Data)] {
        let document = try loadDocument(from: url)
        var results: [(name: String, data: Data)] = []

        for index in 0..<document.pageCount {
            guard let page = document.page(at: index),
                  let data = singlePagePDFData(from: page) else {
                throw PDFServiceError.splitFailed
            }
            results.append((name: "\(baseName)-page-\(index + 1).pdf", data: data))
        }

        return results
    }

    static func splitByInterval(from url: URL, interval: Int, baseName: String) throws -> [(name: String, data: Data)] {
        guard interval >= 1 else { throw PDFServiceError.invalidInterval }

        let document = try loadDocument(from: url)
        let pageCount = document.pageCount
        var results: [(name: String, data: Data)] = []
        var chunkIndex = 1
        var start = 0

        while start < pageCount {
            let end = min(start + interval, pageCount)
            let indices = Array(start..<end)
            let data = try extractPages(from: document, indices: indices)
            results.append((name: "\(baseName)-part-\(chunkIndex).pdf", data: data))
            chunkIndex += 1
            start = end
        }

        return results
    }

    static func extractPages(from url: URL, indices: [Int]) throws -> Data {
        let document = try loadDocument(from: url)
        return try extractPages(from: document, indices: indices)
    }

    static func pdfToImages(
        from url: URL,
        format: ExportImageFormat,
        scale: CGFloat = 2.0
    ) throws -> [(name: String, image: UIImage)] {
        let document = try loadDocument(from: url)
        let baseName = url.deletingPathExtension().lastPathComponent
        var results: [(name: String, image: UIImage)] = []

        for index in 0..<document.pageCount {
            guard let page = document.page(at: index),
                  let image = renderPage(page, scale: scale) else {
                throw PDFServiceError.exportFailed
            }
            results.append((
                name: "\(FilenameHelper.sanitize(baseName, fallback: "page"))-page-\(index + 1).\(format.fileExtension)",
                image: image
            ))
        }

        return results
    }

    static func writeTemporaryImage(_ image: UIImage, filename: String, format: ExportImageFormat) throws -> URL {
        let sanitized = FilenameHelper.sanitize(filename, fallback: "page")
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("\(sanitized).\(format.fileExtension)")

        let data: Data?
        switch format {
        case .png:
            data = image.pngData()
        case .jpeg:
            data = image.jpegData(compressionQuality: 0.92)
        }

        guard let data else { throw PDFServiceError.exportFailed }
        try data.write(to: url)
        return url
    }

    static func exportFiles(
        named archiveName: String,
        entries: [(name: String, data: Data)]
    ) throws -> URL {
        if entries.count == 1, let entry = entries.first {
            if entry.name.hasSuffix(".pdf") {
                return try writeTemporaryPDF(entry.data, filename: entry.name.replacingOccurrences(of: ".pdf", with: ""))
            }
            if entry.name.hasSuffix(".png"), let image = UIImage(data: entry.data) {
                return try writeTemporaryImage(image, filename: entry.name.replacingOccurrences(of: ".png", with: ""), format: .png)
            }
            if entry.name.hasSuffix(".jpeg") || entry.name.hasSuffix(".jpg"), let image = UIImage(data: entry.data) {
                return try writeTemporaryImage(image, filename: entry.name.replacingOccurrences(of: ".jpeg", with: ""), format: .jpeg)
            }
        }

        return try ZipService.createArchive(filename: archiveName, entries: entries)
    }

    private static func extractPages(from document: PDFDocument, indices: [Int]) throws -> Data {
        let sorted = Array(Set(indices)).sorted()
        guard !sorted.isEmpty else { throw PDFServiceError.noPages }

        let output = PDFDocument()
        var outputIndex = 0

        for index in sorted {
            guard index >= 0, index < document.pageCount, let page = document.page(at: index) else {
                throw PDFServiceError.splitFailed
            }
            output.insert(page, at: outputIndex)
            outputIndex += 1
        }

        guard outputIndex > 0, let data = output.dataRepresentation() else {
            throw PDFServiceError.splitFailed
        }
        return data
    }

    private static func singlePagePDFData(from page: PDFPage) -> Data? {
        let document = PDFDocument()
        document.insert(page, at: 0)
        return document.dataRepresentation()
    }

    private static func renderPage(_ page: PDFPage, scale: CGFloat) -> UIImage? {
        let bounds = page.bounds(for: .mediaBox)
        let size = CGSize(width: bounds.width * scale, height: bounds.height * scale)
        guard size.width > 0, size.height > 0 else { return nil }

        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { context in
            UIColor.white.setFill()
            context.fill(CGRect(origin: .zero, size: size))
            context.cgContext.saveGState()
            context.cgContext.translateBy(x: -bounds.origin.x * scale, y: size.height + bounds.origin.y * scale)
            context.cgContext.scaleBy(x: scale, y: -scale)
            page.draw(with: .mediaBox, to: context.cgContext)
            context.cgContext.restoreGState()
        }
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
