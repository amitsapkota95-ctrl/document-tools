import XCTest
@testable import PaperlessTools

final class PDFCoordinateConverterTests: XCTestCase {
    func testPdfRectMapsNormalizedOriginToBottomLeftPDFSpace() {
        let pageBounds = CGRect(x: 0, y: 0, width: 612, height: 792)
        let normalized = CGRect(x: 0.1, y: 0.2, width: 0.3, height: 0.1)

        let pdfRect = PDFCoordinateConverter.pdfRect(fromNormalized: normalized, pageBounds: pageBounds)

        XCTAssertEqual(pdfRect.origin.x, 61.2, accuracy: 0.01)
        XCTAssertEqual(pdfRect.origin.y, 554.4, accuracy: 0.01)
        XCTAssertEqual(pdfRect.size.width, 183.6, accuracy: 0.01)
        XCTAssertEqual(pdfRect.size.height, 79.2, accuracy: 0.01)
    }

    func testPaddedNormalizedRectExpandsWithinUnitSquare() {
        let normalized = CGRect(x: 0.5, y: 0.5, width: 0.1, height: 0.1)
        let padded = PDFCoordinateConverter.paddedNormalizedRect(normalized)

        XCTAssertLessThan(padded.minX, normalized.minX)
        XCTAssertLessThan(padded.minY, normalized.minY)
        XCTAssertGreaterThan(padded.maxX, normalized.maxX)
        XCTAssertGreaterThan(padded.maxY, normalized.maxY)
        XCTAssertGreaterThanOrEqual(padded.minX, 0)
        XCTAssertLessThanOrEqual(padded.maxX, 1)
    }
}
