import SwiftUI

struct URLShortenerStorageNotice: View {
    var showsExpiryReminder: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("How we handle your link")
                .font(.cardTitle)
                .foregroundStyle(Color.ink)

            Text("We save your link on our servers so the short URL works and you can see basic click stats. Links and stats are automatically deleted after 72 hours.")
                .font(.captionText)
                .foregroundStyle(Color.sandLight)
                .fixedSize(horizontal: false, vertical: true)

            if showsExpiryReminder {
                Text("This link expires 72 hours after you create it.")
                    .font(.captionText)
                    .foregroundStyle(Color.forestMuted)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }
}
