import SwiftUI

struct TeleprompterControlBar: View {
    let theme: TeleprompterTheme
    let isRunning: Bool
    let onClose: () -> Void
    let onPlayPause: () -> Void
    let onSpeedDown: () -> Void
    let onSpeedUp: () -> Void
    let onMarkers: () -> Void
    let onSettings: () -> Void

    var body: some View {
        HStack(spacing: 16) {
            Button(action: onClose) {
                Image(systemName: "xmark")
                    .font(.title3.weight(.semibold))
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            }

            Button(action: onSpeedDown) {
                Image(systemName: "minus")
                    .font(.title3.weight(.semibold))
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            }

            Button(action: onPlayPause) {
                Image(systemName: isRunning ? "pause.fill" : "play.fill")
                    .font(.title2.weight(.bold))
                    .frame(width: 52, height: 52)
                    .background(theme.accent.opacity(0.15))
                    .clipShape(Circle())
            }

            Button(action: onSpeedUp) {
                Image(systemName: "plus")
                    .font(.title3.weight(.semibold))
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            }

            Button(action: onMarkers) {
                Image(systemName: "list.bullet")
                    .font(.title3.weight(.semibold))
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            }

            Button(action: onSettings) {
                Image(systemName: "gearshape")
                    .font(.title3.weight(.semibold))
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            }
        }
        .foregroundStyle(theme.text)
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
    }
}
