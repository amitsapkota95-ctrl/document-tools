import SwiftUI

struct PrimaryButton: View {
    let title: String
    var icon: String? = nil
    var isLoading: Bool = false
    var isDisabled: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView()
                        .tint(.white)
                } else if let icon {
                    Image(systemName: icon)
                }
                Text(title)
                    .font(.buttonLabel)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .foregroundStyle(.white)
            .background(isDisabled ? Color.forest.opacity(0.4) : Color.forest)
            .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.buttonCornerRadius))
        }
        .disabled(isDisabled || isLoading)
    }
}
