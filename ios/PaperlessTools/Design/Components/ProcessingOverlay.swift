import SwiftUI

struct ProcessingOverlay: View {
    @Environment(\.colorScheme) private var colorScheme

    let message: String

    var body: some View {
        ZStack {
            PaperlessTheme.overlayScrim(for: colorScheme)
                .ignoresSafeArea()

            VStack(spacing: 16) {
                ProgressView()
                    .scaleEffect(1.2)
                    .tint(.forest)

                Text(message)
                    .font(.bodyText)
                    .foregroundStyle(Color.ink)
            }
            .padding(28)
            .background(Color.cream)
            .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
            .shadow(color: PaperlessTheme.cardShadow(for: colorScheme), radius: 12)
        }
    }
}
