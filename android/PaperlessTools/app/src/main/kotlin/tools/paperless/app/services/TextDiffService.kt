package tools.paperless.app.services

enum class DiffKind {
    UNCHANGED,
    ADDED,
    REMOVED,
}

data class DiffPart(
    val kind: DiffKind,
    val text: String,
)

data class DiffStats(
    val added: Int,
    val removed: Int,
    val similarity: Int,
)

object TextDiffService {
    fun diffWords(original: String, updated: String): Triple<List<DiffPart>, List<DiffPart>, DiffStats> {
        val oldTokens = tokenize(original)
        val newTokens = tokenize(updated)
        val lcs = longestCommonSubsequence(oldTokens, newTokens)

        val left = mutableListOf<DiffPart>()
        val right = mutableListOf<DiffPart>()
        var oldIndex = 0
        var newIndex = 0
        var lcsIndex = 0

        while (oldIndex < oldTokens.size || newIndex < newTokens.size) {
            when {
                lcsIndex < lcs.size && oldIndex < oldTokens.size && oldTokens[oldIndex] == lcs[lcsIndex] -> {
                    appendPart(left, DiffKind.UNCHANGED, oldTokens[oldIndex])
                    appendPart(right, DiffKind.UNCHANGED, newTokens[newIndex])
                    oldIndex++
                    newIndex++
                    lcsIndex++
                }
                newIndex < newTokens.size && (lcsIndex >= lcs.size || newTokens[newIndex] != lcs[lcsIndex]) -> {
                    appendPart(right, DiffKind.ADDED, newTokens[newIndex])
                    newIndex++
                }
                oldIndex < oldTokens.size -> {
                    appendPart(left, DiffKind.REMOVED, oldTokens[oldIndex])
                    oldIndex++
                }
            }
        }

        return Triple(left, right, stats(left, right))
    }

    private fun tokenize(text: String): List<String> {
        if (text.isEmpty()) return emptyList()
        val tokens = mutableListOf<String>()
        val current = StringBuilder()

        for (character in text) {
            if (character.isWhitespace()) {
                if (current.isNotEmpty()) {
                    tokens.add(current.toString())
                    current.clear()
                }
                tokens.add(character.toString())
            } else {
                current.append(character)
            }
        }

        if (current.isNotEmpty()) {
            tokens.add(current.toString())
        }

        return tokens
    }

    private fun appendPart(parts: MutableList<DiffPart>, kind: DiffKind, token: String) {
        val last = parts.lastOrNull()
        if (last != null && last.kind == kind) {
            parts[parts.lastIndex] = DiffPart(kind, last.text + token)
        } else {
            parts.add(DiffPart(kind, token))
        }
    }

    private fun longestCommonSubsequence(a: List<String>, b: List<String>): List<String> {
        val m = a.size
        val n = b.size
        val dp = Array(m + 1) { IntArray(n + 1) }

        for (i in 1..m) {
            for (j in 1..n) {
                dp[i][j] = if (a[i - 1] == b[j - 1]) {
                    dp[i - 1][j - 1] + 1
                } else {
                    maxOf(dp[i - 1][j], dp[i][j - 1])
                }
            }
        }

        val result = mutableListOf<String>()
        var i = m
        var j = n
        while (i > 0 && j > 0) {
            when {
                a[i - 1] == b[j - 1] -> {
                    result.add(a[i - 1])
                    i--
                    j--
                }
                dp[i - 1][j] >= dp[i][j - 1] -> i--
                else -> j--
            }
        }

        return result.reversed()
    }

    private fun stats(left: List<DiffPart>, right: List<DiffPart>): DiffStats {
        var added = 0
        var removed = 0
        var unchanged = 0

        for (part in left) {
            val count = wordCount(part.text)
            when (part.kind) {
                DiffKind.ADDED -> added += count
                DiffKind.REMOVED -> removed += count
                DiffKind.UNCHANGED -> unchanged += count
            }
        }

        for (part in right) {
            if (part.kind == DiffKind.ADDED) {
                added += wordCount(part.text)
            }
        }

        val total = added + removed + unchanged
        val similarity = if (total > 0) ((unchanged.toDouble() / total) * 100).toInt() else 100
        return DiffStats(added, removed, similarity)
    }

    private fun wordCount(text: String): Int =
        text.split(Regex("\\s+")).count { it.isNotEmpty() }
}
