import SwiftUI

extension Color {
    static let paper = Color(red: 250 / 255, green: 248 / 255, blue: 245 / 255)
    static let cream = Color(red: 253 / 255, green: 252 / 255, blue: 251 / 255)
    static let cream200 = Color(red: 244 / 255, green: 241 / 255, blue: 234 / 255)
    static let ink = Color(red: 30 / 255, green: 37 / 255, blue: 30 / 255)
    static let forest = Color(red: 20 / 255, green: 83 / 255, blue: 45 / 255)
    static let forestMuted = Color(red: 22 / 255, green: 101 / 255, blue: 52 / 255)
    static let forest50 = Color(red: 244 / 255, green: 247 / 255, blue: 244 / 255)
    static let forest100 = Color(red: 229 / 255, green: 236 / 255, blue: 229 / 255)
    static let sage = Color(red: 34 / 255, green: 197 / 255, blue: 94 / 255)
    static let clay = Color(red: 217 / 255, green: 125 / 255, blue: 65 / 255)
    static let sandLight = Color(red: 100 / 255, green: 121 / 255, blue: 108 / 255)
}

struct PaperlessTheme {
    static let cardCornerRadius: CGFloat = 16
    static let buttonCornerRadius: CGFloat = 12
    static let cardShadow = Color.black.opacity(0.06)
}
