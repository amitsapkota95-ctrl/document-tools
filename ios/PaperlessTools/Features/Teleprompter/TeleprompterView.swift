import SwiftUI

struct TeleprompterView: View {
    @State private var script = TeleprompterStorage.loadScript()
    @State private var settings = TeleprompterStorage.loadSettings()
    @State private var showPlayer = false
    @State private var permissionStatus: TeleprompterPermissionStatus = .notDetermined
    @StateObject private var voiceTracker = TeleprompterVoiceTracker()

    private var parsedScript: TeleprompterScript {
        TeleprompterScriptParser.parse(script)
    }

    private var wordCount: Int {
        TeleprompterWPM.countWords(in: script)
    }

    private var canOpenPrompter: Bool {
        !script.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && (settings.scrollMode == .manual || permissionStatus != .denied)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                scriptSection
                playbackSection
                if settings.scrollMode == .voice {
                    voiceSection
                }
                websiteHint

                PrimaryButton(title: "Open Teleprompter", icon: "play.fill") {
                    Task { await openPrompter() }
                }
                .disabled(!canOpenPrompter)

                PrivacyBadge()
            }
            .padding(20)
        }
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle("Teleprompter")
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: script) { _, newValue in
            TeleprompterStorage.saveScript(newValue)
        }
        .onChange(of: settings) { _, newValue in
            TeleprompterStorage.saveSettings(newValue)
        }
        .onAppear {
            voiceTracker.configure(script: parsedScript)
            permissionStatus = voiceTracker.permissionStatus
        }
        .onChange(of: settings.scrollMode) { _, mode in
            if mode == .voice {
                voiceTracker.refreshPermissionStatus()
                permissionStatus = voiceTracker.permissionStatus
            }
        }
        .fullScreenCover(isPresented: $showPlayer) {
            TeleprompterPlayerView(settings: $settings, script: parsedScript)
        }
    }

    private var scriptSection: some View {
        formSection(title: "Script") {
            TextEditor(text: $script)
                .font(.system(size: 18))
                .frame(minHeight: 220)
                .padding(12)
                .background(Color.cream)
                .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))

            HStack {
                Text("\(wordCount) words")
                Spacer()
                Text(TeleprompterWPM.readingTimeLabel(wordCount: wordCount))
            }
            .font(.captionText)
            .foregroundStyle(Color.sandLight)

            Text("Use `=== Section Name ===` lines for jump markers.")
                .font(.captionText)
                .foregroundStyle(Color.sandLight)
        }
    }

    private var playbackSection: some View {
        formSection(title: "Playback") {
            Text("Font size: \(Int(settings.fontSize))")
                .font(.bodyText.weight(.semibold))
            Slider(value: $settings.fontSize, in: 18...72, step: 1)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(TeleprompterThemeID.allCases) { themeID in
                        let theme = TeleprompterTheme.theme(for: themeID)
                        Button {
                            settings.themeID = themeID
                        } label: {
                            Text(theme.label)
                                .font(.caption.weight(.semibold))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(settings.themeID == themeID ? theme.accent.opacity(0.25) : Color.cream200)
                                .foregroundStyle(settings.themeID == themeID ? Color.forest : Color.ink)
                                .clipShape(Capsule())
                        }
                    }
                }
            }

            Picker("Scroll mode", selection: $settings.scrollMode) {
                ForEach(TeleprompterScrollMode.allCases) { mode in
                    Text(mode.label).tag(mode)
                }
            }
            .pickerStyle(.segmented)

            if settings.scrollMode == .manual {
                Text("Scroll speed: \(Int(settings.scrollSpeed))")
                    .font(.bodyText.weight(.semibold))
                Slider(value: $settings.scrollSpeed, in: 10...120, step: 5)

                HStack {
                    Text("Target WPM: \(Int(settings.targetWpm))")
                    Spacer()
                    Button("Apply WPM") {
                        applyTargetWpm()
                    }
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Color.forest)
                }
            } else {
                Text("Voice sensitivity")
                    .font(.bodyText.weight(.semibold))
                Slider(value: $settings.voiceSensitivity, in: 0...1, step: 0.05)
            }
        }
    }

    private var voiceSection: some View {
        formSection(title: "Voice Tracking") {
            HStack {
                Label(permissionLabel, systemImage: permissionIcon)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(permissionColor)
                Spacer()
                if permissionStatus == .denied {
                    Button("Open Settings") {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    }
                    .font(.caption.weight(.semibold))
                } else if permissionStatus == .notDetermined {
                    Button("Enable") {
                        Task {
                            let granted = await voiceTracker.requestPermissions()
                            permissionStatus = granted ? .granted : voiceTracker.permissionStatus
                        }
                    }
                    .font(.caption.weight(.semibold))
                }
            }

            Label("Voice processed on your device", systemImage: "lock.shield.fill")
                .font(.captionText)
                .foregroundStyle(Color.forestMuted)

            Text("Language: \(voiceTracker.localeLabel)")
                .font(.captionText)
                .foregroundStyle(Color.sandLight)

            Text("Scroll follows your voice. Pause when you stop speaking.")
                .font(.captionText)
                .foregroundStyle(Color.sandLight)
        }
    }

    private var websiteHint: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Need rich formatting?")
                .font(.bodyText.weight(.semibold))
            Text("Use the web teleprompter at paperless.tools for WYSIWYG editing and browser-based playback.")
                .font(.captionText)
                .foregroundStyle(Color.sandLight)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color.forest50)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }

    private func formSection<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title).font(.sectionTitle)
            content()
        }
        .padding(16)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }

    private func applyTargetWpm() {
        let estimatedHeight = max(800, Double(wordCount) * settings.fontSize * 1.4)
        settings.scrollSpeed = TeleprompterWPM.speedFromTargetWpm(
            targetWpm: settings.targetWpm,
            contentHeight: estimatedHeight,
            wordCount: wordCount
        )
    }

    @MainActor
    private func openPrompter() async {
        if settings.scrollMode == .voice {
            if permissionStatus != .granted {
                let granted = await voiceTracker.requestPermissions()
                permissionStatus = granted ? .granted : voiceTracker.permissionStatus
                guard granted else { return }
            }
        }
        showPlayer = true
    }

    private var permissionLabel: String {
        switch permissionStatus {
        case .notDetermined: return "Microphone not enabled"
        case .granted: return "Microphone ready"
        case .denied: return "Microphone denied"
        }
    }

    private var permissionIcon: String {
        switch permissionStatus {
        case .granted: return "checkmark.circle.fill"
        case .denied: return "xmark.circle.fill"
        case .notDetermined: return "mic.slash"
        }
    }

    private var permissionColor: Color {
        switch permissionStatus {
        case .granted: return Color.forest
        case .denied: return .red
        case .notDetermined: return Color.sandLight
        }
    }
}
