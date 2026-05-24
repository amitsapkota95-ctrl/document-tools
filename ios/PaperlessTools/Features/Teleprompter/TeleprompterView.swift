import SwiftUI

struct TeleprompterView: View {
    @State private var script = ""
    @State private var fontSize: Double = 28
    @State private var scrollSpeed: Double = 40
    @State private var showPlayer = false

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Script")
                        .font(.sectionTitle)

                    TextEditor(text: $script)
                        .font(.system(size: 18))
                        .frame(minHeight: 220)
                        .padding(12)
                        .background(Color.cream)
                        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))

                    Text("Use `=== Section ===` lines for jump markers.")
                        .font(.captionText)
                        .foregroundStyle(Color.sandLight)
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Font size: \(Int(fontSize))")
                        .font(.bodyText.weight(.semibold))
                    Slider(value: $fontSize, in: 18...48, step: 1)

                    Text("Scroll speed: \(Int(scrollSpeed))")
                        .font(.bodyText.weight(.semibold))
                    Slider(value: $scrollSpeed, in: 10...120, step: 5)
                }
                .padding(16)
                .background(Color.cream)
                .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))

                PrimaryButton(title: "Open Teleprompter", icon: "play.fill") {
                    showPlayer = true
                }
                .disabled(script.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                PrivacyBadge()
            }
            .padding(20)
        }
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle("Teleprompter")
        .navigationBarTitleDisplayMode(.inline)
        .fullScreenCover(isPresented: $showPlayer) {
            TeleprompterPlayerView(
                script: script,
                fontSize: fontSize,
                scrollSpeed: scrollSpeed
            )
        }
    }
}

struct TeleprompterPlayerView: View {
    let script: String
    let fontSize: Double
    let scrollSpeed: Double

    @Environment(\.dismiss) private var dismiss
    @State private var offset: CGFloat = 0
    @State private var contentHeight: CGFloat = 1
    @State private var isRunning = false
    @State private var timer: Timer?

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            GeometryReader { geometry in
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        Text(formattedScript)
                            .font(.system(size: fontSize, weight: .medium))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 24)
                            .background(
                                GeometryReader { proxy in
                                    Color.clear.onAppear { contentHeight = proxy.size.height }
                                }
                            )
                    }
                    .padding(.top, geometry.size.height * 0.35)
                    .padding(.bottom, geometry.size.height)
                    .offset(y: -offset)
                }
                .scrollDisabled(true)
                .overlay(alignment: .center) {
                    Rectangle()
                        .fill(Color.forest.opacity(0.35))
                        .frame(height: 2)
                        .padding(.horizontal, 16)
                }
            }

            VStack {
                HStack {
                    Button("Close") { stop(); dismiss() }
                        .foregroundStyle(.white)
                    Spacer()
                    Button(isRunning ? "Pause" : "Play") {
                        isRunning ? stop() : start()
                    }
                    .foregroundStyle(.white)
                }
                .padding()
                Spacer()
            }
        }
        .onDisappear { stop() }
    }

    private var formattedScript: AttributedString {
        var text = AttributedString(script)
        text.foregroundColor = .white
        return text
    }

    private func start() {
        isRunning = true
        timer = Timer.scheduledTimer(withTimeInterval: 0.02, repeats: true) { _ in
            offset += scrollSpeed * 0.02
        }
    }

    private func stop() {
        isRunning = false
        timer?.invalidate()
        timer = nil
    }
}
