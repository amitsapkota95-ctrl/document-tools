import SwiftUI
import UIKit

struct CompareTextView: View {
    @State private var originalText = ""
    @State private var updatedText = ""
    @State private var isComparing = false
    @State private var leftParts: [DiffPart] = []
    @State private var rightParts: [DiffPart] = []
    @State private var stats = DiffStats(added: 0, removed: 0, similarity: 100)

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if isComparing {
                    statsBar
                    diffPanel(title: "Original", parts: leftParts, accent: .red)
                    diffPanel(title: "Updated", parts: rightParts, accent: .green)
                    PrimaryButton(title: "Edit Texts", icon: "pencil") {
                        isComparing = false
                    }
                } else {
                    editorPanel(title: "Original", text: $originalText, accent: .red)
                    editorPanel(title: "Updated", text: $updatedText, accent: .green)
                    PrimaryButton(title: "Compare Texts", icon: "arrow.left.arrow.right") {
                        compare()
                    }
                    .disabled(originalText.isEmpty && updatedText.isEmpty)
                }

            }
            .padding(20)
        }
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle("Compare Text")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var statsBar: some View {
        HStack(spacing: 12) {
            statChip(label: "Added", value: stats.added, color: .green)
            statChip(label: "Removed", value: stats.removed, color: .red)
            statChip(label: "Match", value: stats.similarity, color: Color.forest, suffix: "%")
        }
    }

    private func statChip(label: String, value: Int, color: Color, suffix: String = "") -> some View {
        VStack(spacing: 4) {
            Text("\(value)\(suffix)")
                .font(.cardTitle)
                .foregroundStyle(color)
            Text(label)
                .font(.captionText)
                .foregroundStyle(Color.sandLight)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.buttonCornerRadius))
    }

    private func editorPanel(title: String, text: Binding<String>, accent: Color) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.sectionTitle)
                .foregroundStyle(accent)
            TextEditor(text: text)
                .font(.system(.body, design: .monospaced))
                .frame(minHeight: 160)
                .padding(10)
                .background(Color.cream)
                .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
        }
    }

    private func diffPanel(title: String, parts: [DiffPart], accent: Color) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.sectionTitle)
                .foregroundStyle(accent)

            Text(attributedDiff(parts))
                .font(.system(.body, design: .monospaced))
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(12)
                .background(Color.cream)
                .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
        }
    }

    private func attributedDiff(_ parts: [DiffPart]) -> AttributedString {
        var result = AttributedString()
        for part in parts {
            var segment = AttributedString(part.text)
            switch part.kind {
            case .added:
                segment.backgroundColor = UIColor.systemGreen.withAlphaComponent(0.25)
            case .removed:
                segment.backgroundColor = UIColor.systemRed.withAlphaComponent(0.25)
            case .unchanged:
                break
            }
            result.append(segment)
        }
        return result
    }

    private func compare() {
        let diff = TextDiffService.diffWords(original: originalText, updated: updatedText)
        leftParts = diff.left
        rightParts = diff.right
        stats = diff.stats
        isComparing = true
    }
}
