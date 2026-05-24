import SwiftUI

struct PrivacyBadge: View {
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "lock.shield.fill")
                .foregroundStyle(Color.sage)
            Text("Processed on your device")
                .font(.captionText)
                .foregroundStyle(Color.forestMuted)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color.forest50)
        .clipShape(Capsule())
    }
}
