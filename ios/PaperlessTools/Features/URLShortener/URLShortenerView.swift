import SafariServices
import SwiftUI

struct URLShortenerView: View {
    @State private var url = ""
    @State private var shortUrl = ""
    @State private var statsUrl = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var copied = false
    @State private var showStats = false

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Paste a long URL")
                        .font(.sectionTitle)
                        .foregroundStyle(Color.ink)

                    TextField("https://example.com/very-long-link", text: $url)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .textFieldStyle(PaperlessTextFieldStyle())

                    if let errorMessage {
                        Text(errorMessage)
                            .font(.captionText)
                            .foregroundStyle(.red)
                    }

                    PrimaryButton(title: "Shorten Link", icon: "link", isLoading: isLoading, isDisabled: url.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty) {
                        Task { await shorten() }
                    }
                }
                .padding(20)
                .background(Color.cream)
                .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))

                if !shortUrl.isEmpty {
                    resultCard
                }

                PrivacyBadge()
            }
            .padding(20)
        }
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle("Shorten Link")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showStats) {
            if let statsURL = URL(string: statsUrl) {
                SafariView(url: statsURL)
            }
        }
        .sensoryFeedback(.success, trigger: copied)
    }

    private var resultCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Your short link")
                .font(.cardTitle)

            Text(shortUrl)
                .font(.bodyText)
                .foregroundStyle(Color.forest)
                .textSelection(.enabled)

            HStack(spacing: 12) {
                Button {
                    UIPasteboard.general.string = shortUrl
                    copied = true
                } label: {
                    Label(copied ? "Copied!" : "Copy", systemImage: copied ? "checkmark" : "doc.on.doc")
                        .font(.captionText.weight(.semibold))
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.forest)

                Button {
                    showStats = true
                } label: {
                    Label("Stats", systemImage: "chart.bar")
                        .font(.captionText.weight(.semibold))
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.forest50)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }

    @MainActor
    private func shorten() async {
        isLoading = true
        errorMessage = nil
        copied = false
        defer { isLoading = false }

        do {
            let response = try await APIService.shortenURL(url)
            shortUrl = response.shortUrl
            statsUrl = response.statsUrl
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct SafariView: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> SFSafariViewController {
        SFSafariViewController(url: url)
    }

    func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}
}
