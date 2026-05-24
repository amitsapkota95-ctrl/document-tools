import SwiftUI

struct ProcessingOverlay: View {
    let message: String

    var body: some View {
        ZStack {
            Color.black.opacity(0.35)
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
            .shadow(radius: 12)
        }
    }
}
