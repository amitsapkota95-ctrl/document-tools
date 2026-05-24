import SwiftUI

struct ToolsView: View {
    @State private var navigationPath = NavigationPath()

    var body: some View {
        NavigationStack(path: $navigationPath) {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    ForEach(ToolRegistry.categories) { category in
                        VStack(alignment: .leading, spacing: 12) {
                            Text(category.title)
                                .font(.sectionTitle)
                                .foregroundStyle(Color.ink)

                            ForEach(category.tools) { tool in
                                if let destination = destination(for: tool.slug), tool.isAvailableInMVP {
                                    Button {
                                        navigationPath.append(destination)
                                    } label: {
                                        ToolRow(tool: tool, isAvailable: true)
                                    }
                                    .buttonStyle(.plain)
                                } else {
                                    ToolRow(tool: tool, isAvailable: false)
                                }
                            }
                        }
                    }
                }
                .padding(20)
            }
            .background(Color.paper.ignoresSafeArea())
            .navigationTitle("Tools")
            .navigationDestination(for: ToolDestination.self) { destination in
                destinationView(for: destination)
            }
        }
    }
}

struct ToolRow: View {
    let tool: ToolDefinition
    let isAvailable: Bool

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: tool.iconName)
                .font(.title3)
                .foregroundStyle(isAvailable ? Color.forest : Color.sandLight)
                .frame(width: 40, height: 40)
                .background(isAvailable ? Color.forest50 : Color.cream200)
                .clipShape(RoundedRectangle(cornerRadius: 10))

            VStack(alignment: .leading, spacing: 4) {
                Text(tool.title)
                    .font(.cardTitle)
                    .foregroundStyle(isAvailable ? Color.ink : Color.sandLight)
                Text(tool.description)
                    .font(.captionText)
                    .foregroundStyle(Color.sandLight)
                    .lineLimit(2)
            }

            Spacer()

            if isAvailable {
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Color.sandLight)
            } else {
                Text("Soon")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(Color.sandLight)
            }
        }
        .padding(14)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }
}
