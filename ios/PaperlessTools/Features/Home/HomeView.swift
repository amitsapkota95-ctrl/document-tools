import SwiftUI

struct HomeView: View {
    @Binding var selectedTab: Int
    @State private var navigationPath = NavigationPath()

    private let toolColumns = [
        GridItem(.flexible(), spacing: 10),
        GridItem(.flexible(), spacing: 10),
        GridItem(.flexible(), spacing: 10),
    ]

    var body: some View {
        NavigationStack(path: $navigationPath) {
            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    heroSection
                    featuredToolsSection
                    allToolsSection
                    comingSoonSection
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 16)
            }
            .background(Color.paper.ignoresSafeArea())
            .navigationTitle("paperless.tools")
            .navigationBarTitleDisplayMode(.large)
            .navigationDestination(for: ToolDestination.self) { destination in
                destinationView(for: destination)
            }
        }
    }

    private var heroSection: some View {
        HStack(alignment: .center, spacing: 16) {
            VStack(alignment: .leading, spacing: 10) {
                PrivacyBadge()

                Text("\(ToolRegistry.availableTools.count) tools ready")
                    .font(.heroTitle)
                    .foregroundStyle(Color.ink)

                Text("Scan · Merge · Split · Sign · Share")
                    .font(.bodyText.weight(.medium))
                    .foregroundStyle(Color.forest)
            }

            Spacer(minLength: 0)

            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [Color.forest50, Color.forest100],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 88, height: 88)

                Image(systemName: "doc.text.fill")
                    .font(.system(size: 36, weight: .semibold))
                    .foregroundStyle(Color.forest)
            }
        }
        .padding(20)
        .background(
            LinearGradient(
                colors: [Color.cream, Color.forest50.opacity(0.6)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
        .shadow(color: PaperlessTheme.cardShadow, radius: 12, y: 4)
    }

    private var featuredToolsSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionHeader(title: "Popular", subtitle: "Tap to open")

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(ToolRegistry.homeFeaturedTools) { tool in
                        if let destination = destination(for: tool.slug) {
                            Button {
                                navigationPath.append(destination)
                            } label: {
                                FeaturedToolCard(tool: tool)
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    Button {
                        navigationPath.append(ToolDestination.qrScanner)
                    } label: {
                        FeaturedShortcutCard(
                            title: "Scan QR",
                            actionLabel: "Open camera",
                            iconName: "qrcode.viewfinder",
                            category: .utilities
                        )
                    }
                    .buttonStyle(.plain)

                    Button {
                        navigationPath.append(ToolDestination.urlShortener)
                    } label: {
                        FeaturedShortcutCard(
                            title: "Shorten Link",
                            actionLabel: "Create short URL",
                            iconName: "link",
                            category: .utilities
                        )
                    }
                    .buttonStyle(.plain)

                    Button {
                        selectedTab = 1
                    } label: {
                        VStack(spacing: 12) {
                            Image(systemName: "square.grid.2x2.fill")
                                .font(.system(size: 24, weight: .semibold))
                                .foregroundStyle(Color.forest)
                                .frame(width: 52, height: 52)
                                .background(Color.forest50)
                                .clipShape(RoundedRectangle(cornerRadius: 14))

                            Text("All Tools")
                                .font(.cardTitle)
                                .foregroundStyle(Color.ink)

                            Text("See full list")
                                .font(.captionText.weight(.semibold))
                                .foregroundStyle(Color.forest)
                        }
                        .padding(16)
                        .frame(width: 156, alignment: .leading)
                        .background(Color.cream)
                        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
                        .overlay {
                            RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius)
                                .stroke(Color.forest.opacity(0.15), lineWidth: 1)
                        }
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 2)
            }
            .padding(.horizontal, -2)
        }
    }

    private var allToolsSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionHeader(title: "All Tools", subtitle: "\(ToolRegistry.availableTools.count) available now")

            LazyVGrid(columns: toolColumns, spacing: 10) {
                ForEach(ToolRegistry.availableTools) { tool in
                    if let destination = destination(for: tool.slug) {
                        Button {
                            navigationPath.append(destination)
                        } label: {
                            HomeToolTile(tool: tool, isAvailable: true)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var comingSoonSection: some View {
        let soonTools = ToolRegistry.comingSoonTools
        if !soonTools.isEmpty {
            VStack(alignment: .leading, spacing: 14) {
                sectionHeader(title: "Coming Soon", subtitle: "More tools on the way")

                LazyVGrid(columns: toolColumns, spacing: 10) {
                    ForEach(soonTools) { tool in
                        HomeToolTile(tool: tool, isAvailable: false)
                    }
                }
            }
        }
    }

    private func sectionHeader(title: String, subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.sectionTitle)
                .foregroundStyle(Color.ink)
            Text(subtitle)
                .font(.captionText)
                .foregroundStyle(Color.sandLight)
        }
    }
}
