import Foundation
import PDFKit
import UIKit

enum PDFPageSize: String, CaseIterable, Identifiable {
    case fit
    case a4
    case letter

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
    case selectedPages
    case everyPage
    case byInterval

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
    case compressFailed
    case cropFailed
    case redactFailed

    var errorDescription: String? {
        switch self {
        case .invalidPDF: return "Could not read the PDF file."
        case .mergeFailed: return "Could not merge PDF files."
        case .splitFailed: return "Could not split the PDF."
        case .exportFailed: return "Could not export the PDF."
        case .noPages: return "No pages to export."
        case .invalidInterval: return "Enter a page interval of at least 1."
        case .compressFailed: return "Could not compress the PDF."
        case .cropFailed: return "Could not crop the PDF."
        case .redactFailed: return "Could not redact the PDF."
        }
    }
}

struct CompressSizeEstimate {
    let estimatedBytes: Int
    let mayIncrease: Bool
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
        normalizedRect: CGRect,
        applyToAllPages: Bool
    ) throws -> Data {
        guard let document = PDFDocument(data: pdfData) else {
            throw PDFServiceError.invalidPDF
        }

        guard pageIndex >= 0, pageIndex < document.pageCount else {
            throw PDFServiceError.invalidPDF
        }

        let targetPages: [Int]
        if applyToAllPages {
            targetPages = Array(0..<document.pageCount)
        } else {
            targetPages = [pageIndex]
        }

        for index in targetPages {
            guard let page = document.page(at: index) else { continue }
            let pdfRect = pdfRect(fromNormalized: normalizedRect, page: page)
            let annotation = ImageStampAnnotation(image: signatureImage, bounds: pdfRect)
            page.addAnnotation(annotation)
        }

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
        return try splitEveryPage(from: document, baseName: baseName)
    }

    static func splitEveryPage(from document: PDFDocument, baseName: String) throws -> [(name: String, data: Data)] {
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
        let document = try loadDocument(from: url)
        return try splitByInterval(from: document, interval: interval, baseName: baseName)
    }

    static func splitByInterval(from document: PDFDocument, interval: Int, baseName: String) throws -> [(name: String, data: Data)] {
        guard interval >= 1 else { throw PDFServiceError.invalidInterval }

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

    static func extractPages(from document: PDFDocument, indices: [Int]) throws -> Data {
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

    static func pdfToImages(
        from url: URL,
        format: ExportImageFormat,
        scale: CGFloat = 2.0,
        pageIndices: [Int]? = nil
    ) throws -> [(name: String, image: UIImage)] {
        let document = try loadDocument(from: url)
        let baseName = url.deletingPathExtension().lastPathComponent
        var results: [(name: String, image: UIImage)] = []

        let indices: [Int]
        if let pageIndices {
            indices = Array(Set(pageIndices)).sorted()
        } else {
            indices = Array(0..<document.pageCount)
        }

        guard !indices.isEmpty else {
            throw PDFServiceError.noPages
        }

        for index in indices {
            guard index >= 0, index < document.pageCount,
                  let page = document.page(at: index),
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

    static func compressPDF(from url: URL, quality: CGFloat) throws -> Data {
        let document = try loadDocument(from: url)
        let originalData = try Data(contentsOf: url)
        return try compressPDF(from: document, quality: quality, originalData: originalData)
    }

    static func compressPDF(
        from document: PDFDocument,
        quality: CGFloat,
        originalData: Data? = nil
    ) throws -> Data {
        var dpi = effectiveCompressionDPI(forQuality: quality)
        var jpegQuality = compressionJpegQuality(quality: quality)
        var best = try compressPDF(from: document, dpi: dpi, jpegQuality: jpegQuality)

        guard let originalData else { return best }

        let targetBytes = compressionTargetSize(originalSize: originalData.count, quality: quality)

        while best.count > targetBytes {
            if dpi > 36 {
                dpi = max(36, dpi - 8)
            } else if jpegQuality > 0.21 {
                jpegQuality = max(0.2, jpegQuality - 0.05)
            } else {
                break
            }

            let attempt = try compressPDF(from: document, dpi: dpi, jpegQuality: jpegQuality)
            if attempt.count < best.count {
                best = attempt
            }
            if best.count <= targetBytes {
                break
            }
        }

        return best
    }

    static func compressionTargetSize(originalSize: Int, quality: CGFloat) -> Int {
        max(1, Int(Double(originalSize) * quality))
    }

    static func effectiveCompressionDPI(forQuality quality: CGFloat) -> CGFloat {
        let clamped = max(0.1, min(0.99, quality))
        let t = (clamped - 0.1) / 0.9
        return 36 + t * 36
    }

    static func estimateCompressedSize(
        from document: PDFDocument,
        originalSize: Int,
        quality: CGFloat
    ) -> CompressSizeEstimate {
        let targetBytes = compressionTargetSize(originalSize: originalSize, quality: quality)
        let minEstimate = minimumRasterEstimate(for: document)
        let mayIncrease = minEstimate > targetBytes

        return CompressSizeEstimate(estimatedBytes: targetBytes, mayIncrease: mayIncrease)
    }

    private static func minimumRasterEstimate(for document: PDFDocument) -> Int {
        let dpi: CGFloat = 36
        let jpegQuality: CGFloat = 0.2
        let scale = compressionRenderScale(dpi: dpi)
        let samples = compressionSampleIndices(pageCount: document.pageCount)
        guard !samples.isEmpty else { return Int.max }

        var sampledJpegBytes = 0
        for index in samples {
            guard let page = document.page(at: index),
                  let image = renderPageForExport(page, scale: scale),
                  let jpegData = image.jpegData(compressionQuality: jpegQuality) else {
                continue
            }
            sampledJpegBytes += jpegData.count
        }

        guard sampledJpegBytes > 0 else { return Int.max }

        let avgJpegBytes = sampledJpegBytes / samples.count
        return avgJpegBytes * document.pageCount + estimatePdfWrapperOverhead(pageCount: document.pageCount)
    }

    private static func compressPDF(
        from document: PDFDocument,
        dpi: CGFloat,
        jpegQuality: CGFloat
    ) throws -> Data {
        let scale = compressionRenderScale(dpi: dpi)
        var pages: [JpegPDFPage] = []

        for index in 0..<document.pageCount {
            guard let page = document.page(at: index) else {
                throw PDFServiceError.compressFailed
            }
            pages.append(try jpegPage(from: page, scale: scale, jpegQuality: jpegQuality))
        }

        return try buildPDFFromJpegPages(pages)
    }

    static func cropPDF(
        from url: URL,
        cropBoxesByPage: [Int: [CGRect]],
        applyToAllPages: Bool = false,
        sourcePageIndex: Int = 0
    ) throws -> Data {
        let sourceData = try Data(contentsOf: url)
        guard let source = PDFDocument(data: sourceData), source.pageCount > 0 else {
            throw PDFServiceError.invalidPDF
        }

        let sharedCrop = cropBoxesByPage[sourcePageIndex]?.first

        for index in 0..<source.pageCount {
            guard let page = source.page(at: index) else { continue }

            let normalizedRect: CGRect?
            if applyToAllPages {
                normalizedRect = sharedCrop
            } else {
                normalizedRect = cropBoxesByPage[index]?.first
            }

            guard let normalizedRect else { continue }

            let cropRect = pdfRect(fromNormalized: normalizedRect, page: page)
            page.setBounds(cropRect, for: .cropBox)
            page.setBounds(cropRect, for: .mediaBox)
        }

        guard let data = source.dataRepresentation() else {
            throw PDFServiceError.cropFailed
        }
        return data
    }

    static func redactPDF(
        from url: URL,
        boxesByPage: [Int: [CGRect]],
        applyToAllPages: Bool = false,
        sourcePageIndex: Int = 0
    ) throws -> Data {
        let source = try loadDocument(from: url)
        let output = PDFDocument()
        let sharedBoxes = boxesByPage[sourcePageIndex] ?? []

        for index in 0..<source.pageCount {
            guard let page = source.page(at: index) else { continue }
            let boxes = applyToAllPages ? sharedBoxes : (boxesByPage[index] ?? [])

            if boxes.isEmpty {
                output.insert(page, at: output.pageCount)
                continue
            }

            guard let redacted = renderRedactedPage(page, boxes: boxes) else {
                throw PDFServiceError.redactFailed
            }
            output.insert(redacted, at: output.pageCount)
        }

        guard output.pageCount > 0, let data = output.dataRepresentation() else {
            throw PDFServiceError.redactFailed
        }
        return data
    }

    static func renderPageForExport(_ page: PDFPage, scale: CGFloat) -> UIImage? {
        renderPage(page, scale: scale)
    }

    static func writeTemporaryText(_ text: String, filename: String) throws -> URL {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("\(FilenameHelper.sanitize(filename)).txt")
        try text.write(to: url, atomically: true, encoding: .utf8)
        return url
    }

    private static func pdfRect(fromNormalized normalized: CGRect, page: PDFPage) -> CGRect {
        PDFCoordinateConverter.pdfRect(fromNormalized: normalized, page: page)
    }

    private static func renderRedactedPage(_ page: PDFPage, boxes: [CGRect]) -> PDFPage? {
        let bounds = page.bounds(for: .mediaBox)
        let scale: CGFloat = 3.0
        let size = CGSize(width: bounds.width * scale, height: bounds.height * scale)

        let renderer = UIGraphicsImageRenderer(size: size)
        let image = renderer.image { context in
            UIColor.white.setFill()
            context.fill(CGRect(origin: .zero, size: size))
            context.cgContext.saveGState()
            context.cgContext.translateBy(x: -bounds.origin.x * scale, y: size.height + bounds.origin.y * scale)
            context.cgContext.scaleBy(x: scale, y: -scale)
            page.draw(with: .mediaBox, to: context.cgContext)
            context.cgContext.restoreGState()

            context.cgContext.setShouldAntialias(false)
            context.cgContext.setBlendMode(.copy)
            UIColor.black.setFill()

            for normalized in boxes {
                let padded = paddedNormalizedRect(normalized)
                let pdfRect = pdfRect(fromNormalized: padded, page: page)
                let viewRect = CGRect(
                    x: (pdfRect.minX - bounds.minX) * scale,
                    y: (bounds.maxY - pdfRect.maxY) * scale,
                    width: pdfRect.width * scale,
                    height: pdfRect.height * scale
                ).insetBy(dx: -2, dy: -2)

                context.cgContext.fill(viewRect)
                context.cgContext.fill(viewRect)
            }
        }

        return PDFPage(image: image)
    }

    private static func paddedNormalizedRect(_ normalized: CGRect, padding: CGFloat = 0.006) -> CGRect {
        PDFCoordinateConverter.paddedNormalizedRect(normalized, padding: padding)
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

    fileprivate static func aspectFitRect(for imageSize: CGSize, in container: CGRect) -> CGRect {
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

    private struct JpegPDFPage {
        let jpegData: Data
        let pageWidth: CGFloat
        let pageHeight: CGFloat
        let imageWidth: Int
        let imageHeight: Int
    }

    private static func compressionRenderScale(dpi: CGFloat) -> CGFloat {
        max(0.5, dpi / 72.0)
    }

    private static func compressionJpegQuality(quality: CGFloat) -> CGFloat {
        max(0.2, min(1.0, 0.15 + quality * 0.85))
    }

    private static func estimatePdfWrapperOverhead(pageCount: Int) -> Int {
        4096 + pageCount * 900
    }

    private static func compressionSampleIndices(pageCount: Int) -> [Int] {
        if pageCount <= 0 { return [] }
        if pageCount == 1 { return [0] }
        if pageCount == 2 { return [0, 1] }
        return [0, (pageCount - 1) / 2, pageCount - 1]
    }

    private static func jpegPage(from page: PDFPage, scale: CGFloat, jpegQuality: CGFloat) throws -> JpegPDFPage {
        guard let image = renderPageForExport(page, scale: scale),
              let jpegData = image.jpegData(compressionQuality: jpegQuality) else {
            throw PDFServiceError.compressFailed
        }

        let bounds = page.bounds(for: .mediaBox)
        return JpegPDFPage(
            jpegData: jpegData,
            pageWidth: bounds.width * scale,
            pageHeight: bounds.height * scale,
            imageWidth: max(1, Int(image.size.width.rounded())),
            imageHeight: max(1, Int(image.size.height.rounded()))
        )
    }

    private static func buildPDFFromJpegPages(_ pages: [JpegPDFPage]) throws -> Data {
        guard !pages.isEmpty else { throw PDFServiceError.compressFailed }

        let pdf = NSMutableData()
        var xrefOffsets: [Int] = []

        func appendASCII(_ string: String) {
            guard let data = string.data(using: .ascii) else { return }
            pdf.append(data)
        }

        func beginObject(_ number: Int) {
            while xrefOffsets.count <= number {
                xrefOffsets.append(0)
            }
            xrefOffsets[number] = pdf.length
            appendASCII("\(number) 0 obj\n")
        }

        func endObject() {
            appendASCII("endobj\n")
        }

        appendASCII("%PDF-1.4\n")

        beginObject(1)
        appendASCII("<< /Type /Catalog /Pages 2 0 R >>\n")
        endObject()

        let kids = pages.indices.map { index in "\(3 + index * 3) 0 R" }.joined(separator: " ")
        beginObject(2)
        appendASCII("<< /Type /Pages /Kids [ \(kids) ] /Count \(pages.count) >>\n")
        endObject()

        for (index, page) in pages.enumerated() {
            let pageObject = 3 + index * 3
            let contentObject = pageObject + 1
            let imageObject = pageObject + 2
            let content = "q \(formatPDFNumber(page.pageWidth)) 0 0 \(formatPDFNumber(page.pageHeight)) 0 0 cm /Im1 Do Q"
            guard let contentData = content.data(using: .ascii) else {
                throw PDFServiceError.compressFailed
            }

            beginObject(pageObject)
            appendASCII("""
            << /Type /Page /Parent 2 0 R /MediaBox [0 0 \(formatPDFNumber(page.pageWidth)) \(formatPDFNumber(page.pageHeight)) ] /Contents \(contentObject) 0 R /Resources << /XObject << /Im1 \(imageObject) 0 R >> >> >>
            
            """)
            endObject()

            beginObject(contentObject)
            appendASCII("<< /Length \(contentData.count) >>\nstream\n")
            pdf.append(contentData)
            appendASCII("\nendstream\n")
            endObject()

            beginObject(imageObject)
            appendASCII("""
            << /Type /XObject /Subtype /Image /Width \(page.imageWidth) /Height \(page.imageHeight) /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length \(page.jpegData.count) >>
            stream\n
            """)
            pdf.append(page.jpegData)
            appendASCII("\nendstream\n")
            endObject()
        }

        let xrefStart = pdf.length
        let objectCount = xrefOffsets.count
        appendASCII("xref\n0 \(objectCount)\n")
        appendASCII("0000000000 65535 f \n")
        for objectNumber in 1..<objectCount {
            appendASCII(String(format: "%010d 00000 n \n", xrefOffsets[objectNumber]))
        }
        appendASCII("trailer\n<< /Size \(objectCount) /Root 1 0 R >>\n")
        appendASCII("startxref\n\(xrefStart)\n")
        appendASCII("%%EOF\n")

        return pdf as Data
    }

    private static func formatPDFNumber(_ value: CGFloat) -> String {
        String(format: "%.4f", Double(value))
    }
}

private final class ImageStampAnnotation: PDFAnnotation {
    private let stampImage: UIImage

    init(image: UIImage, bounds: CGRect) {
        stampImage = image
        super.init(bounds: bounds, forType: .stamp, withProperties: nil)
        backgroundColor = .clear
    }

    required init?(coder: NSCoder) {
        nil
    }

    override func draw(with box: PDFDisplayBox, in context: CGContext) {
        guard let cgImage = stampImage.cgImage else { return }
        let drawRect = PDFService.aspectFitRect(for: stampImage.size, in: bounds)
        context.draw(cgImage, in: drawRect)
    }
}
