import SwiftUI

struct TeleprompterCueLine: View {
    let theme: TeleprompterTheme
    let style: TeleprompterCueStyle
    let cuePosition: Double
    let isVoiceActive: Bool

    var body: some View {
        GeometryReader { geometry in
            let y = geometry.size.height * cuePosition

            Group {
                switch style {
                case .line:
                    Rectangle()
                        .fill(theme.accent.opacity(isVoiceActive ? 0.8 : 0.35))
                        .frame(height: 2)
                case .chevron:
                    HStack {
                        Spacer()
                        Image(systemName: "chevron.right.2")
                            .font(.title3.weight(.bold))
                            .foregroundStyle(theme.accent.opacity(isVoiceActive ? 0.9 : 0.5))
                        Spacer()
                    }
                case .band:
                    Rectangle()
                        .fill(theme.accent.opacity(isVoiceActive ? 0.15 : 0.08))
                        .frame(height: fontBandHeight)
                }
            }
            .frame(maxWidth: .infinity)
            .position(x: geometry.size.width / 2, y: y)
            .shadow(color: isVoiceActive ? theme.accent.opacity(0.35) : .clear, radius: 8)
            .animation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true), value: isVoiceActive)
        }
        .allowsHitTesting(false)
    }

    private var fontBandHeight: CGFloat { 56 }
}
