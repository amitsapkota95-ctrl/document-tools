import Foundation
import PDFKit

struct PIIMatch: Identifiable {
    let id = UUID()
    let label: String
    let normalizedRect: CGRect
}

enum PIIDetector {
    private static let patterns: [(label: String, pattern: String)] = [
        ("Email", #"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}"#),
        ("Phone", #"(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}"#),
        ("SSN", #"\b\d{3}-\d{2}-\d{4}\b"#),
        ("Card", #"\b(?:\d[ -]*?){13,16}\b"#),
    ]

    static func detect(in document: PDFDocument, pageIndex: Int) -> [PIIMatch] {
        guard pageIndex >= 0, pageIndex < document.pageCount, let page = document.page(at: pageIndex) else {
            return []
        }

        guard let pageText = page.string else { return [] }
        var matches: [PIIMatch] = []

        for (label, pattern) in patterns {
            guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else { continue }
            let range = NSRange(pageText.startIndex..<pageText.endIndex, in: pageText)
            regex.enumerateMatches(in: pageText, options: [], range: range) { result, _, _ in
                guard let result,
                      let swiftRange = Range(result.range, in: pageText) else { return }

                let normalized = estimatedNormalizedRect(for: swiftRange, in: pageText)
                matches.append(PIIMatch(label: label, normalizedRect: normalized))
            }
        }

        return matches
    }

    private static func estimatedNormalizedRect(for range: Range<String.Index>, in text: String) -> CGRect {
        let start = text.distance(from: text.startIndex, to: range.lowerBound)
        let length = text.distance(from: range.lowerBound, to: range.upperBound)
        let lines = text.components(separatedBy: "\n")
        var charCount = 0
        var lineIndex = 0
        var column = 0

        for (index, line) in lines.enumerated() {
            let lineLength = line.count
            let lineEnd = charCount + lineLength
            if start <= lineEnd {
                lineIndex = index
                column = max(0, start - charCount)
                break
            }
            charCount = lineEnd + 1
        }

        let lineCount = max(lines.count, 1)
        let lineHeight = min(0.12, 1.0 / CGFloat(lineCount + 2))
        let y = min(0.92, CGFloat(lineIndex + 1) / CGFloat(lineCount + 2))
        let x = min(0.75, 0.05 + CGFloat(column) * 0.012)
        let width = min(0.92 - x, max(0.1, CGFloat(length) * 0.012 + 0.06))

        return CGRect(x: x, y: y, width: width, height: lineHeight)
    }
}
