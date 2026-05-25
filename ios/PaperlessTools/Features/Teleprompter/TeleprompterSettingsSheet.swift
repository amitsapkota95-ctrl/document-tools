import SwiftUI

struct TeleprompterSettingsSheet: View {
    @Binding var settings: TeleprompterSettings
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Typography") {
                    Slider(value: $settings.fontSize, in: 18...72, step: 1) {
                        Text("Font size")
                    }
                    Text("\(Int(settings.fontSize)) pt")
                        .font(.caption)
                        .foregroundStyle(Color.sandLight)
                }

                Section("Theme") {
                    Picker("Theme", selection: $settings.themeID) {
                        ForEach(TeleprompterThemeID.allCases) { themeID in
                            Text(TeleprompterTheme.theme(for: themeID).label).tag(themeID)
                        }
                    }
                }

                Section("Cue line") {
                    Toggle("Show cue line", isOn: $settings.showCueLine)

                    if settings.showCueLine {
                        Slider(value: $settings.cuePosition, in: 0.2...0.45, step: 0.01) {
                            Text("Cue position")
                        }
                        Picker("Cue style", selection: $settings.cueStyle) {
                            ForEach(TeleprompterCueStyle.allCases) { style in
                                Text(style.label).tag(style)
                            }
                        }
                    }
                }

                Section("Mirror") {
                    Picker("Mirror mode", selection: $settings.mirrorMode) {
                        ForEach(TeleprompterMirrorMode.allCases) { mode in
                            Text(mode.label).tag(mode)
                        }
                    }
                }

                Section("Speed") {
                    Slider(value: $settings.scrollSpeed, in: 10...120, step: 5) {
                        Text("Scroll speed")
                    }
                    Slider(value: $settings.targetWpm, in: 100...180, step: 5) {
                        Text("Target WPM")
                    }
                }
            }
            .navigationTitle("Prompter Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}
