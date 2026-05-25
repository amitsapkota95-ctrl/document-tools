import SwiftUI

struct TeleprompterCueLine: View {
    let theme: TeleprompterTheme
    let style: TeleprompterCueStyle
    let cuePosition: Double

    var body: some View {
        GeometryReader { geometry in
            let y = geometry.size.height * cuePosition

            Group {
                switch style {
                case .line:
                    Rectangle()
                        .fill(theme.accent.opacity(0.35))
                        .frame(height: 2)
                case .chevron:
                    HStack {
                        Spacer()
                        Image(systemName: "chevron.right.2")
                            .font(.title3.weight(.bold))
                            .foregroundStyle(theme.accent.opacity(0.5))
                        Spacer()
                    }
                case .band:
                    Rectangle()
                        .fill(theme.accent.opacity(0.08))
                        .frame(height: 56)
                }
            }
            .frame(maxWidth: .infinity)
            .position(x: geometry.size.width / 2, y: y)
        }
        .allowsHitTesting(false)
    }
}
