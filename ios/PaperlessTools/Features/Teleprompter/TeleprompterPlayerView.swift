import SwiftUI

struct TeleprompterPlayerView: View {
    @Binding var settings: TeleprompterSettings
    let script: TeleprompterScript

    @Environment(\.dismiss) private var dismiss
    @StateObject private var scrollEngine = TeleprompterScrollEngine()

    @State private var showControls = true
    @State private var controlsHideTask: Task<Void, Never>?
    @State private var showSettingsSheet = false
    @State private var showMarkerSheet = false
    @State private var showExitConfirmation = false
    @State private var dragStartOffset: CGFloat = 0

    private var theme: TeleprompterTheme { settings.theme }

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()

            GeometryReader { geometry in
                let topPadding = settings.showCueLine
                    ? geometry.size.height * settings.cuePosition
                    : 40.0

                ScrollView {
                    TeleprompterScriptText(
                        script: script,
                        theme: theme,
                        fontSize: settings.fontSize
                    )
                    .padding(.horizontal, geometry.size.width * 0.075)
                    .padding(.top, topPadding)
                    .padding(.bottom, geometry.size.height)
                    .offset(y: -scrollEngine.offset)
                    .scaleEffect(x: settings.mirrorMode.scaleX, y: settings.mirrorMode.scaleY)
                    .background(
                        GeometryReader { proxy in
                            Color.clear
                                .onAppear {
                                    scrollEngine.contentHeight = proxy.size.height
                                    scrollEngine.topPadding = topPadding
                                }
                                .onChange(of: proxy.size.height) { _, newValue in
                                    scrollEngine.contentHeight = newValue
                                }
                        }
                    )
                    .coordinateSpace(name: "teleprompterContent")
                    .onPreferenceChange(TeleprompterWordPreferenceKey.self) { preferences in
                        var positions: [Int: CGFloat] = [:]
                        for pref in preferences {
                            positions[pref.index] = pref.midY
                        }
                        scrollEngine.wordPositions = positions
                    }
                }
                .scrollDisabled(true)
                .simultaneousGesture(dragGesture)
                .simultaneousGesture(doubleTapGesture)
                .onAppear {
                    scrollEngine.viewportHeight = geometry.size.height
                    scrollEngine.cuePosition = settings.cuePosition
                    scrollEngine.topPadding = topPadding
                }
                .onChange(of: geometry.size.height) { _, newValue in
                    scrollEngine.viewportHeight = newValue
                }
                .overlay {
                    if settings.showCueLine {
                        TeleprompterCueLine(
                            theme: theme,
                            style: settings.cueStyle,
                            cuePosition: settings.cuePosition
                        )
                    }
                }
            }

            VStack(spacing: 0) {
                topBar
                Spacer()

                if showControls {
                    TeleprompterControlBar(
                        theme: theme,
                        isRunning: scrollEngine.isRunning,
                        onClose: requestExit,
                        onPlayPause: togglePlayPause,
                        onSpeedDown: { settings.scrollSpeed = max(10, settings.scrollSpeed - 5) },
                        onSpeedUp: { settings.scrollSpeed = min(120, settings.scrollSpeed + 5) },
                        onMarkers: { showMarkerSheet = true },
                        onSettings: { showSettingsSheet = true }
                    )
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
        }
        .contentShape(Rectangle())
        .onTapGesture {
            revealControls()
        }
        .onAppear(perform: configurePlayer)
        .onDisappear(perform: teardownPlayer)
        .onChange(of: settings.scrollSpeed) { _, newValue in
            scrollEngine.scrollSpeed = newValue
        }
        .onChange(of: settings.cuePosition) { _, newValue in
            scrollEngine.cuePosition = newValue
        }
        .onChange(of: settings.showCueLine) { _, showCueLine in
            let topPadding = showCueLine
                ? scrollEngine.viewportHeight * settings.cuePosition
                : 40
            scrollEngine.topPadding = topPadding
        }
        .sheet(isPresented: $showSettingsSheet) {
            TeleprompterSettingsSheet(settings: $settings)
        }
        .sheet(isPresented: $showMarkerSheet) {
            TeleprompterMarkerSheet(markers: script.markers) { marker in
                scrollEngine.jumpToMarker(marker)
                revealControls()
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
            }
        }
        .alert("Exit teleprompter?", isPresented: $showExitConfirmation) {
            Button("Keep Reading", role: .cancel) {}
            Button("Exit", role: .destructive) {
                closePlayer()
            }
        } message: {
            Text("This will stop playback and return to the script editor.")
        }
    }

    private var topBar: some View {
        HStack {
            Button(action: requestExit) {
                Label("Exit", systemImage: "xmark.circle.fill")
                    .font(.body.weight(.semibold))
                    .foregroundStyle(theme.text)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(.ultraThinMaterial)
                    .clipShape(Capsule())
            }
            .accessibilityLabel("Exit teleprompter")

            Spacer()

            if scrollEngine.isRunning {
                Text("Playing")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(theme.text.opacity(0.8))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(theme.border.opacity(0.2))
                    .clipShape(Capsule())
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
    }

    private var dragGesture: some Gesture {
        DragGesture(minimumDistance: 8)
            .onChanged { value in
                revealControls()
                guard !scrollEngine.isRunning else { return }
                if dragStartOffset == 0 {
                    dragStartOffset = scrollEngine.offset
                }
                scrollEngine.setOffset(dragStartOffset - value.translation.height)
            }
            .onEnded { _ in
                dragStartOffset = 0
            }
    }

    private var doubleTapGesture: some Gesture {
        TapGesture(count: 2).onEnded {
            revealControls()
            scrollEngine.reset()
        }
    }

    private func configurePlayer() {
        scrollEngine.scrollSpeed = settings.scrollSpeed
        scrollEngine.cuePosition = settings.cuePosition
        revealControls(permanent: true)
    }

    private func teardownPlayer() {
        scrollEngine.stop()
        controlsHideTask?.cancel()
    }

    private func togglePlayPause() {
        revealControls()

        if scrollEngine.isRunning {
            scrollEngine.stop()
            return
        }

        scrollEngine.start()
    }

    private func requestExit() {
        revealControls(permanent: true)
        if scrollEngine.isRunning {
            showExitConfirmation = true
        } else {
            closePlayer()
        }
    }

    private func closePlayer() {
        scrollEngine.stop()
        dismiss()
    }

    private func revealControls(permanent: Bool = false) {
        showControls = true
        controlsHideTask?.cancel()
        guard !permanent else { return }
        controlsHideTask = Task {
            try? await Task.sleep(for: .seconds(4))
            guard !Task.isCancelled else { return }
            await MainActor.run {
                showControls = false
            }
        }
    }
}
