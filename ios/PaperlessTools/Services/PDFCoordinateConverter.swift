import CoreGraphics
import PDFKit

enum PDFCoordinateConverter {
    static func pdfRect(fromNormalized normalized: CGRect, pageBounds: CGRect) -> CGRect {
        CGRect(
            x: pageBounds.minX + normalized.minX * pageBounds.width,
            y: pageBounds.minY + (1 - normalized.maxY) * pageBounds.height,
            width: normalized.width * pageBounds.width,
            height: normalized.height * pageBounds.height
        )
    }

    static func pdfRect(fromNormalized normalized: CGRect, page: PDFPage) -> CGRect {
        pdfRect(fromNormalized: normalized, pageBounds: page.bounds(for: .mediaBox))
    }

    static func paddedNormalizedRect(_ normalized: CGRect, padding: CGFloat = 0.006) -> CGRect {
        let x = max(0, normalized.minX - padding)
        let y = max(0, normalized.minY - padding)
        let maxX = min(1, normalized.maxX + padding)
        let maxY = min(1, normalized.maxY + padding)
        return CGRect(x: x, y: y, width: maxX - x, height: maxY - y)
    }
}
