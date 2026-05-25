import SwiftUI

struct TeleprompterControlBar: View {
    let theme: TeleprompterTheme
    let isRunning: Bool
    let scrollMode: TeleprompterScrollMode
    let onClose: () -> Void
    let onPlayPause: () -> Void
    let onSpeedDown: () -> Void
    let onSpeedUp: () -> Void
    let onToggleVoice: () -> Void
    let onMarkers: () -> Void
    let onSettings: () -> Void

    var body: some View {
        HStack(spacing: 16) {
            Button(action: onClose) {
                Image(systemName: "xmark")
                    .font(.body.weight(.semibold))
            }

            if scrollMode == .manual {
                Button(action: onSpeedDown) {
                    Image(systemName: "minus")
                }
            }

            Button(action: onPlayPause) {
                Image(systemName: isRunning ? "pause.fill" : "play.fill")
                    .font(.title2.weight(.bold))
                    .frame(width: 52, height: 52)
                    .background(theme.accent.opacity(0.15))
                    .clipShape(Circle())
            }

            if scrollMode == .manual {
                Button(action: onSpeedUp) {
                    Image(systemName: "plus")
                }
            }

            Button(action: onToggleVoice) {
                Image(systemName: scrollMode == .voice ? "waveform.circle.fill" : "waveform.circle")
            }

            Button(action: onMarkers) {
                Image(systemName: "list.bullet")
            }

            Button(action: onSettings) {
                Image(systemName: "gearshape")
            }
        }
        .foregroundStyle(theme.text)
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
    }
}
