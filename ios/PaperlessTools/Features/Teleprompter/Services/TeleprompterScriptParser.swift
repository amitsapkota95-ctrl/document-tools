import Foundation

enum TeleprompterScriptParser {
    static func parse(_ text: String) -> TeleprompterScript {
        let lines = text.components(separatedBy: .newlines)
        var blocks: [TeleprompterScriptBlock] = []
        var words: [String] = []
        var markers: [TeleprompterScriptMarker] = []
        var wordIndex = 0

        for (lineIndex, line) in lines.enumerated() {
            if let markerLabel = markerLabel(from: line) {
                let marker = TeleprompterScriptMarker(
                    id: "marker-\(markers.count)",
                    label: markerLabel,
                    wordIndex: wordIndex,
                    lineIndex: lineIndex
                )
                markers.append(marker)
                blocks.append(.marker(marker))
                continue
            }

            let trimmed = line.trimmingCharacters(in: .whitespaces)
            guard !trimmed.isEmpty else { continue }

            let paragraphWords = extractWords(from: trimmed)
            guard !paragraphWords.isEmpty else { continue }

            blocks.append(.paragraph(trimmed, wordStartIndex: wordIndex))
            words.append(contentsOf: paragraphWords)
            wordIndex += paragraphWords.count
        }

        return TeleprompterScript(
            rawText: text,
            blocks: blocks,
            words: words,
            markers: markers
        )
    }

    static func extractWords(from text: String) -> [String] {
        text
            .lowercased()
            .split { !$0.isLetter && !$0.isNumber && $0 != "'" }
            .map(String.init)
            .filter { !$0.isEmpty }
    }

    static func fuzzyMatchWord(spoken: String, expected: String) -> Bool {
        let spokenNorm = normalizeToken(spoken)
        let expectedNorm = normalizeToken(expected)
        guard !spokenNorm.isEmpty, !expectedNorm.isEmpty else { return false }
        if spokenNorm == expectedNorm { return true }
        if expectedNorm.hasPrefix(spokenNorm) || spokenNorm.hasPrefix(expectedNorm) { return true }

        let minLen = min(spokenNorm.count, expectedNorm.count, 4)
        if minLen >= 3,
           spokenNorm.prefix(minLen) == expectedNorm.prefix(minLen) {
            return true
        }

        return levenshtein(spokenNorm, expectedNorm) <= max(1, expectedNorm.count / 3)
    }

    static func matchPhrase(
        spokenWords: [String],
        scriptWords: [String],
        from startIndex: Int,
        maxLookahead: Int = 10
    ) -> Int? {
        guard !spokenWords.isEmpty, startIndex < scriptWords.count else { return nil }

        let end = min(scriptWords.count, startIndex + maxLookahead + spokenWords.count)
        var bestIndex: Int?
        var bestScore = 0

        for idx in startIndex..<end {
            var score = 0
            for (offset, spoken) in spokenWords.enumerated() {
                let scriptIdx = idx + offset
                guard scriptIdx < scriptWords.count else { break }
                if fuzzyMatchWord(spoken: spoken, expected: scriptWords[scriptIdx]) {
                    score += 1
                }
            }
            if score > bestScore {
                bestScore = score
                bestIndex = idx + score - 1
            }
        }

        guard let bestIndex, bestScore > 0 else { return nil }
        return bestIndex
    }

    private static func markerLabel(from line: String) -> String? {
        let trimmed = line.trimmingCharacters(in: .whitespaces)
        guard trimmed.hasPrefix("==="), trimmed.hasSuffix("===") else { return nil }
        let inner = trimmed.dropFirst(3).dropLast(3).trimmingCharacters(in: .whitespaces)
        return inner.isEmpty ? nil : inner
    }

    private static func normalizeToken(_ token: String) -> String {
        token
            .lowercased()
            .filter { $0.isLetter || $0.isNumber || $0 == "'" }
    }

    private static func levenshtein(_ lhs: String, _ rhs: String) -> Int {
        let a = Array(lhs)
        let b = Array(rhs)
        if a.isEmpty { return b.count }
        if b.isEmpty { return a.count }

        var matrix = Array(repeating: Array(repeating: 0, count: b.count + 1), count: a.count + 1)
        for i in 0...a.count { matrix[i][0] = i }
        for j in 0...b.count { matrix[0][j] = j }

        for i in 1...a.count {
            for j in 1...b.count {
                let cost = a[i - 1] == b[j - 1] ? 0 : 1
                matrix[i][j] = min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                )
            }
        }

        return matrix[a.count][b.count]
    }
}
