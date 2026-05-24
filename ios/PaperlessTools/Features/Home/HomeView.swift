import SwiftUI

struct HomeView: View {
    @Binding var selectedTab: Int
    @State private var navigationPath = NavigationPath()

    var body: some View {
        NavigationStack(path: $navigationPath) {
            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    heroSection
                    quickActionsSection
                    toolsSection
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 24)
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
        VStack(alignment: .leading, spacing: 14) {
            PrivacyBadge()

            Text("Document tools that stay on your device")
                .font(.heroTitle)
                .foregroundStyle(Color.ink)

            Text("Create, scan, sign, and share — without uploading your files to a server.")
                .font(.bodyText)
                .foregroundStyle(Color.sandLight)
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [Color.cream, Color.forest50],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }

    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.sectionTitle)
                .foregroundStyle(Color.ink)

            HStack(spacing: 12) {
                QuickActionButton(title: "Scan QR", icon: "qrcode.viewfinder") {
                    navigationPath.append(ToolDestination.qrScanner)
                }
                QuickActionButton(title: "Scan Doc", icon: "doc.viewfinder") {
                    navigationPath.append(ToolDestination.documentScanner)
                }
                QuickActionButton(title: "Shorten", icon: "link") {
                    navigationPath.append(ToolDestination.urlShortener)
                }
            }
        }
    }

    private var toolsSection: some View {
        VStack(alignment: .leading, spacing: 20) {
            ForEach(ToolRegistry.categories) { category in
                VStack(alignment: .leading, spacing: 12) {
                    Text(category.title)
                        .font(.sectionTitle)
                        .foregroundStyle(Color.ink)

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        ForEach(category.tools) { tool in
                            if let destination = destination(for: tool.slug), tool.isAvailableInMVP {
                                Button {
                                    navigationPath.append(destination)
                                } label: {
                                    ToolCard(tool: tool, isAvailable: true)
                                }
                                .buttonStyle(.plain)
                            } else {
                                ToolCard(tool: tool, isAvailable: false)
                            }
                        }
                    }
                }
            }
        }
    }
}

struct QuickActionButton: View {
    let title: String
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundStyle(Color.forest)
                Text(title)
                    .font(.captionText.weight(.semibold))
                    .foregroundStyle(Color.ink)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(Color.cream)
            .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.buttonCornerRadius))
            .shadow(color: PaperlessTheme.cardShadow, radius: 6, y: 2)
        }
        .buttonStyle(.plain)
    }
}
