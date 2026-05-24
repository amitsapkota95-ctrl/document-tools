import Foundation

struct DiffPart: Identifiable {
    enum Kind {
        case unchanged
        case added
        case removed
    }

    let id = UUID()
    let kind: Kind
    let text: String
}

struct DiffStats {
    let added: Int
    let removed: Int
    let similarity: Int
}

enum TextDiffService {
    static func diffWords(original: String, updated: String) -> (left: [DiffPart], right: [DiffPart], stats: DiffStats) {
        let oldTokens = tokenize(original)
        let newTokens = tokenize(updated)
        let lcs = longestCommonSubsequence(oldTokens, newTokens)

        var left: [DiffPart] = []
        var right: [DiffPart] = []
        var oldIndex = 0
        var newIndex = 0
        var lcsIndex = 0

        while oldIndex < oldTokens.count || newIndex < newTokens.count {
            if lcsIndex < lcs.count, oldIndex < oldTokens.count, oldTokens[oldIndex] == lcs[lcsIndex] {
                appendPart(&left, kind: .unchanged, token: oldTokens[oldIndex])
                appendPart(&right, kind: .unchanged, token: newTokens[newIndex])
                oldIndex += 1
                newIndex += 1
                lcsIndex += 1
            } else if newIndex < newTokens.count, (lcsIndex >= lcs.count || newTokens[newIndex] != lcs[lcsIndex]) {
                appendPart(&right, kind: .added, token: newTokens[newIndex])
                newIndex += 1
            } else if oldIndex < oldTokens.count {
                appendPart(&left, kind: .removed, token: oldTokens[oldIndex])
                oldIndex += 1
            }
        }

        return (left, right, stats(left: left, right: right))
    }

    private static func tokenize(_ text: String) -> [String] {
        guard !text.isEmpty else { return [] }
        var tokens: [String] = []
        var current = ""

        for character in text {
            if character.isWhitespace {
                if !current.isEmpty {
                    tokens.append(current)
                    current = ""
                }
                tokens.append(String(character))
            } else {
                current.append(character)
            }
        }

        if !current.isEmpty {
            tokens.append(current)
        }

        return tokens
    }

    private static func appendPart(_ parts: inout [DiffPart], kind: DiffPart.Kind, token: String) {
        if let last = parts.last, last.kind == kind {
            parts[parts.count - 1] = DiffPart(kind: kind, text: last.text + token)
        } else {
            parts.append(DiffPart(kind: kind, text: token))
        }
    }

    private static func longestCommonSubsequence(_ a: [String], _ b: [String]) -> [String] {
        let m = a.count
        let n = b.count
        var dp = Array(repeating: Array(repeating: 0, count: n + 1), count: m + 1)

        for i in 1...m {
            for j in 1...n {
                if a[i - 1] == b[j - 1] {
                    dp[i][j] = dp[i - 1][j - 1] + 1
                } else {
                    dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
                }
            }
        }

        var result: [String] = []
        var i = m
        var j = n
        while i > 0, j > 0 {
            if a[i - 1] == b[j - 1] {
                result.append(a[i - 1])
                i -= 1
                j -= 1
            } else if dp[i - 1][j] >= dp[i][j - 1] {
                i -= 1
            } else {
                j -= 1
            }
        }

        return result.reversed()
    }

    private static func stats(left: [DiffPart], right: [DiffPart]) -> DiffStats {
        var added = 0
        var removed = 0
        var unchanged = 0

        for part in left {
            let count = wordCount(part.text)
            switch part.kind {
            case .added: added += count
            case .removed: removed += count
            case .unchanged: unchanged += count
            }
        }

        for part in right where part.kind == .added {
            added += wordCount(part.text)
        }

        let total = added + removed + unchanged
        let similarity = total > 0 ? Int((Double(unchanged) / Double(total)) * 100) : 100
        return DiffStats(added: added, removed: removed, similarity: similarity)
    }

    private static func wordCount(_ text: String) -> Int {
        text.split { $0.isWhitespace }.filter { !$0.isEmpty }.count
    }
}
