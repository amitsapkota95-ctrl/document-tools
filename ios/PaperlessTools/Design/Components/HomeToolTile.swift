import SwiftUI

struct FeaturedToolCard: View {
    let tool: ToolDefinition

    var body: some View {
        FeaturedShortcutCard(
            title: tool.title,
            actionLabel: tool.actionLabel,
            iconName: tool.iconName,
            category: ToolRegistry.category(for: tool.slug) ?? .pdf
        )
    }
}

struct FeaturedShortcutCard: View {
    @Environment(\.colorScheme) private var colorScheme

    let title: String
    let actionLabel: String
    let iconName: String
    let category: ToolCategoryID

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Image(systemName: iconName)
                .font(.system(size: 28, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 52, height: 52)
                .background(
                    LinearGradient(
                        colors: HomeToolAccent.gradient(for: category),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .shadow(color: HomeToolAccent.color(for: category).opacity(0.25), radius: 8, y: 4)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.cardTitle)
                    .foregroundStyle(Color.ink)
                    .lineLimit(2)

                Text(actionLabel)
                    .font(.captionText.weight(.semibold))
                    .foregroundStyle(HomeToolAccent.color(for: category))
            }
        }
        .padding(16)
        .frame(width: 156, alignment: .leading)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
        .overlay {
            RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius)
                .stroke(HomeToolAccent.color(for: category).opacity(0.12), lineWidth: 1)
        }
        .shadow(color: PaperlessTheme.cardShadow(for: colorScheme), radius: 10, y: 4)
    }
}

struct HomeToolTile: View {
    let tool: ToolDefinition
    var isAvailable: Bool = true

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: tool.iconName)
                .font(.system(size: 22, weight: .semibold))
                .foregroundStyle(isAvailable ? accentColor : Color.sandLight)
                .frame(width: 48, height: 48)
                .background(isAvailable ? accentColor.opacity(0.12) : Color.cream200)
                .clipShape(RoundedRectangle(cornerRadius: 12))

            Text(shortTitle)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(isAvailable ? Color.ink : Color.sandLight)
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .frame(minHeight: 32)

            if !isAvailable {
                Text("Soon")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(Color.sandLight)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.cream200)
                    .clipShape(Capsule())
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .padding(.horizontal, 6)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
        .opacity(isAvailable ? 1 : 0.65)
    }

    private var shortTitle: String {
        switch tool.slug {
        case .documentScanner: return "Scan"
        case .mergePdf: return "Merge PDF"
        case .splitPdf: return "Split PDF"
        case .fillAndSign: return "Sign PDF"
        case .imageToPdf: return "Images → PDF"
        case .pdfToImage: return "PDF → Image"
        case .qrTools: return "QR Codes"
        case .urlShortener: return "Short Link"
        case .compressPdf: return "Compress"
        case .redactPdf: return "Redact"
        case .cropPdf: return "Crop"
        case .extractText: return "Extract"
        case .invoiceBuilder: return "Invoice"
        case .teleprompter: return "Teleprompter"
        default: return tool.title
        }
    }

    private var accentColor: Color {
        HomeToolAccent.color(for: ToolRegistry.category(for: tool.slug))
    }
}

enum HomeToolAccent {
    static func color(for category: ToolCategoryID?) -> Color {
        switch category {
        case .pdf: return Color.forest
        case .utilities: return Color.utilitiesBlue
        case .content: return Color.clay
        case .none: return Color.forest
        }
    }

    static func gradient(for category: ToolCategoryID?) -> [Color] {
        switch category {
        case .pdf:
            return [Color.forest, Color.forestMuted]
        case .utilities:
            return [Color.utilitiesBlue, Color.utilitiesBlueLight]
        case .content:
            return [Color.clay, Color.contentOrange]
        case .none:
            return [Color.forest, Color.forestMuted]
        }
    }
}
