import SwiftUI

struct TeleprompterPlayerView: View {
    @Binding var settings: TeleprompterSettings
    let script: TeleprompterScript

    @Environment(\.dismiss) private var dismiss
    @StateObject private var scrollEngine = TeleprompterScrollEngine()
    @StateObject private var voiceTracker = TeleprompterVoiceTracker()

    @State private var showControls = true
    @State private var controlsHideTask: Task<Void, Never>?
    @State private var showSettingsSheet = false
    @State private var showMarkerSheet = false
    @State private var showExitConfirmation = false
    @State private var dragStartOffset: CGFloat = 0
    @State private var hasVoiceMatch = false

    private var theme: TeleprompterTheme { settings.theme }

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()

            GeometryReader { geometry in
                let topPadding = geometry.size.height * settings.cuePosition

                ScrollView {
                    TeleprompterScriptText(
                        script: script,
                        theme: theme,
                        fontSize: settings.fontSize,
                        activeWordIndex: voiceTracker.activeWordIndex,
                        highlightEnabled: settings.scrollMode == .voice
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
                .simultaneousGesture(tapGesture)
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
                    TeleprompterCueLine(
                        theme: theme,
                        style: settings.cueStyle,
                        cuePosition: settings.cuePosition,
                        isVoiceActive: settings.scrollMode == .voice && voiceTracker.isHearingAudio
                    )
                }
            }

            VStack(spacing: 0) {
                topBar

                if settings.scrollMode == .voice {
                    TeleprompterVoiceBar(
                        theme: theme,
                        status: voiceTracker.status,
                        currentPhrase: voiceTracker.currentPhrase,
                        interimText: voiceTracker.interimText,
                        isHearingAudio: voiceTracker.isHearingAudio,
                        usesOnDeviceRecognition: voiceTracker.usesOnDeviceRecognition,
                        statusDetail: voiceTracker.statusDetail
                    )
                    .padding(.top, 4)
                }

                Spacer()

                if showControls {
                    TeleprompterControlBar(
                        theme: theme,
                        isRunning: scrollEngine.isRunning,
                        scrollMode: settings.scrollMode,
                        onClose: requestExit,
                        onPlayPause: togglePlayPause,
                        onSpeedDown: { settings.scrollSpeed = max(10, settings.scrollSpeed - 5) },
                        onSpeedUp: { settings.scrollSpeed = min(120, settings.scrollSpeed + 5) },
                        onToggleVoice: toggleVoiceMode,
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
        .onChange(of: settings.voiceSensitivity) { _, newValue in
            voiceTracker.sensitivity = newValue
        }
        .onChange(of: voiceTracker.activeWordIndex) { _, newValue in
            scrollEngine.targetWordIndex = newValue
            if settings.scrollMode == .voice {
                hasVoiceMatch = true
                updateVoiceScrollActive()
            }
        }
        .onChange(of: voiceTracker.isPausedBySilence) { _, _ in
            updateVoiceScrollActive()
        }
        .onChange(of: voiceTracker.isHearingAudio) { _, _ in
            updateVoiceScrollActive()
        }
        .onChange(of: voiceTracker.status) { _, status in
            if case .matching = status {
                hasVoiceMatch = true
                updateVoiceScrollActive()
            }
        }
        .onChange(of: voiceTracker.interimText) { _, text in
            if !text.isEmpty, settings.scrollMode == .voice {
                hasVoiceMatch = true
                updateVoiceScrollActive()
            }
        }
        .sheet(isPresented: $showSettingsSheet) {
            TeleprompterSettingsSheet(settings: $settings)
        }
        .sheet(isPresented: $showMarkerSheet) {
            TeleprompterMarkerSheet(markers: script.markers) { marker in
                scrollEngine.jumpToMarker(marker)
                voiceTracker.setAnchorWordIndex(marker.wordIndex)
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
                Text(settings.scrollMode == .voice ? "Voice" : "Manual")
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
                if settings.scrollMode == .voice {
                    let nearest = scrollEngine.nearestWordIndex(at: scrollEngine.offset)
                    voiceTracker.setAnchorWordIndex(nearest)
                }
            }
    }

    private var tapGesture: some Gesture {
        TapGesture(count: 1).onEnded {
            revealControls()
            guard !scrollEngine.isRunning, settings.scrollMode == .voice else { return }
            let nearest = scrollEngine.nearestWordIndex(at: scrollEngine.offset)
            voiceTracker.setAnchorWordIndex(nearest)
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        }
    }

    private var doubleTapGesture: some Gesture {
        TapGesture(count: 2).onEnded {
            revealControls()
            scrollEngine.reset()
            voiceTracker.setAnchorWordIndex(0)
            hasVoiceMatch = false
        }
    }

    private func configurePlayer() {
        voiceTracker.configure(script: script)
        voiceTracker.sensitivity = settings.voiceSensitivity
        scrollEngine.scrollMode = settings.scrollMode
        scrollEngine.scrollSpeed = settings.scrollSpeed
        scrollEngine.voiceLerpFactor = 0.04 + settings.voiceSensitivity * 0.04
        scrollEngine.cuePosition = settings.cuePosition
        revealControls(permanent: true)
    }

    private func teardownPlayer() {
        scrollEngine.stop()
        voiceTracker.stopListening()
        controlsHideTask?.cancel()
    }

    private func togglePlayPause() {
        revealControls()

        if scrollEngine.isRunning {
            scrollEngine.stop()
            voiceTracker.stopListening()
            scrollEngine.voiceScrollActive = false
            return
        }

        scrollEngine.scrollMode = settings.scrollMode
        scrollEngine.start()

        if settings.scrollMode == .voice {
            Task {
                if voiceTracker.permissionStatus != .granted {
                    let granted = await voiceTracker.requestPermissions()
                    guard granted else { return }
                }
                voiceTracker.startListening(shouldScroll: true)
                updateVoiceScrollActive()
            }
        }
    }

    private func toggleVoiceMode() {
        revealControls()
        settings.scrollMode = settings.scrollMode == .voice ? .manual : .voice
        scrollEngine.scrollMode = settings.scrollMode
        scrollEngine.stop()
        voiceTracker.stopListening()
        scrollEngine.voiceScrollActive = false
        hasVoiceMatch = false
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
        voiceTracker.stopListening()
        dismiss()
    }

    private func updateVoiceScrollActive() {
        guard settings.scrollMode == .voice, scrollEngine.isRunning else {
            scrollEngine.voiceScrollActive = false
            return
        }

        let hasTranscript = !voiceTracker.interimText.isEmpty
        scrollEngine.voiceScrollActive = hasVoiceMatch
            && !voiceTracker.isPausedBySilence
            && (hasTranscript || voiceTracker.isHearingAudio)
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
