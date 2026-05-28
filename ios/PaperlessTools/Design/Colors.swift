import SwiftUI
import UIKit

extension Color {
    static let paper = adaptive(
        light: rgb(250, 248, 245),
        dark: rgb(20, 25, 20)
    )
    static let cream = adaptive(
        light: rgb(253, 252, 251),
        dark: rgb(30, 37, 30)
    )
    static let cream200 = adaptive(
        light: rgb(244, 241, 234),
        dark: rgb(42, 50, 42)
    )
    static let ink = adaptive(
        light: rgb(30, 37, 30),
        dark: rgb(232, 237, 232)
    )
    static let forest = adaptive(
        light: rgb(20, 83, 45),
        dark: rgb(63, 168, 98)
    )
    static let forestMuted = adaptive(
        light: rgb(22, 101, 52),
        dark: rgb(74, 222, 128)
    )
    static let forest50 = adaptive(
        light: rgb(244, 247, 244),
        dark: rgb(26, 35, 28)
    )
    static let forest100 = adaptive(
        light: rgb(229, 236, 229),
        dark: rgb(36, 48, 40)
    )
    static let sage = adaptive(
        light: rgb(34, 197, 94),
        dark: rgb(74, 222, 128)
    )
    static let clay = adaptive(
        light: rgb(217, 125, 65),
        dark: rgb(251, 146, 60)
    )
    static let sandLight = adaptive(
        light: rgb(100, 121, 108),
        dark: rgb(154, 171, 158)
    )

    static let utilitiesBlue = adaptive(
        light: rgb(30, 64, 175),
        dark: rgb(96, 165, 250)
    )
    static let utilitiesBlueLight = adaptive(
        light: rgb(59, 130, 246),
        dark: rgb(147, 197, 253)
    )
    static let contentOrange = adaptive(
        light: rgb(234, 88, 12),
        dark: rgb(251, 146, 60)
    )

    static var paperUIColor: UIColor { UIColor(paper) }

    private static func rgb(_ red: CGFloat, _ green: CGFloat, _ blue: CGFloat) -> UIColor {
        UIColor(red: red / 255, green: green / 255, blue: blue / 255, alpha: 1)
    }

    private static func adaptive(light: UIColor, dark: UIColor) -> Color {
        Color(UIColor { traits in
            traits.userInterfaceStyle == .dark ? dark : light
        })
    }
}

struct PaperlessTheme {
    static let cardCornerRadius: CGFloat = 16
    static let buttonCornerRadius: CGFloat = 12

    static func cardShadow(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color.black.opacity(0.25) : Color.black.opacity(0.06)
    }

    static func overlayScrim(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color.black.opacity(0.55) : Color.black.opacity(0.35)
    }
}
