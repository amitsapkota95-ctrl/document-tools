import SwiftUI

struct KeyboardSafeArea: ViewModifier {
    @State private var keyboardHeight: CGFloat = 0

    func body(content: Content) -> some View {
        content
            .safeAreaInset(edge: .bottom, spacing: 0) {
                Color.clear
                    .frame(height: keyboardHeight)
                    .allowsHitTesting(false)
            }
            .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillShowNotification)) { notification in
                updateKeyboardHeight(from: notification)
            }
            .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillHideNotification)) { notification in
                updateKeyboardHeight(from: notification, hidden: true)
            }
    }

    private func updateKeyboardHeight(from notification: Notification, hidden: Bool = false) {
        let duration = notification.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? Double ?? 0.25
        let newHeight: CGFloat
        if hidden {
            newHeight = 0
        } else if let frame = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect {
            newHeight = frame.height
        } else {
            return
        }

        withAnimation(.easeOut(duration: duration)) {
            keyboardHeight = newHeight
        }
    }
}

extension View {
    func keyboardSafeArea() -> some View {
        modifier(KeyboardSafeArea())
    }
}
