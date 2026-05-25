import SwiftUI

struct TeleprompterScriptText: View {
    let script: TeleprompterScript
    let theme: TeleprompterTheme
    let fontSize: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            ForEach(script.blocks) { block in
                switch block {
                case .marker(let marker):
                    markerView(marker)
                case .paragraph(let text, let wordStartIndex):
                    paragraphView(text, wordStartIndex: wordStartIndex)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func markerView(_ marker: TeleprompterScriptMarker) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "play.fill")
                .font(.system(size: fontSize * 0.55, weight: .bold))
            Text(marker.label)
                .font(.system(size: fontSize * 0.75, weight: .bold))
        }
        .foregroundStyle(theme.accent)
        .padding(.vertical, 8)
        .padding(.horizontal, 12)
        .background(theme.border.opacity(0.25))
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .background(
            GeometryReader { proxy in
                Color.clear.preference(
                    key: TeleprompterWordPreferenceKey.self,
                    value: [TeleprompterWordPreference(index: marker.wordIndex, midY: proxy.frame(in: .named("teleprompterContent")).midY)]
                )
            }
        )
    }

    private func paragraphView(_ text: String, wordStartIndex: Int) -> some View {
        let words = script.words(in: text)
        return FlowLayout(spacing: 8) {
            ForEach(Array(words.enumerated()), id: \.offset) { offset, word in
                let index = wordStartIndex + offset
                Text(word)
                    .font(.system(size: fontSize, weight: .medium))
                    .foregroundStyle(theme.text)
                    .background(
                        GeometryReader { proxy in
                            Color.clear.preference(
                                key: TeleprompterWordPreferenceKey.self,
                                value: [TeleprompterWordPreference(
                                    index: index,
                                    midY: proxy.frame(in: .named("teleprompterContent")).midY
                                )]
                            )
                        }
                    )
            }
        }
    }
}

private struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
        }

        return CGSize(width: maxWidth, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
        }
    }
}
