import SwiftUI

struct ToolCard: View {
    @Environment(\.colorScheme) private var colorScheme

    let tool: ToolDefinition
    var isAvailable: Bool = true

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: tool.iconName)
                    .font(.title2)
                    .foregroundStyle(isAvailable ? Color.forest : Color.sandLight)
                    .frame(width: 36, height: 36)
                    .background(isAvailable ? Color.forest50 : Color.cream200)
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                Spacer()

                if !isAvailable {
                    Text("Soon")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(Color.sandLight)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.cream200)
                        .clipShape(Capsule())
                }
            }

            Text(tool.title)
                .font(.cardTitle)
                .foregroundStyle(isAvailable ? Color.ink : Color.sandLight)
                .lineLimit(2)
                .multilineTextAlignment(.leading)

            Text(tool.description)
                .font(.captionText)
                .foregroundStyle(Color.sandLight)
                .lineLimit(2)
                .multilineTextAlignment(.leading)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
        .shadow(color: PaperlessTheme.cardShadow(for: colorScheme), radius: 8, y: 2)
        .opacity(isAvailable ? 1 : 0.7)
    }
}
