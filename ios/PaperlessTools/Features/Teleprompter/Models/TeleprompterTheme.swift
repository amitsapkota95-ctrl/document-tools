import SwiftUI

enum TeleprompterThemeID: String, Codable, CaseIterable, Identifiable {
    case studioBlack = "studio-black"
    case broadcastYellow = "broadcast-yellow"
    case forestClassic = "forest-classic"
    case highContrastWhite = "high-contrast-white"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .studioBlack: return "Studio Black"
        case .broadcastYellow: return "Broadcast Yellow"
        case .forestClassic: return "Forest Classic"
        case .highContrastWhite: return "High Contrast White"
        }
    }
}

struct TeleprompterTheme: Equatable {
    let id: TeleprompterThemeID
    let label: String
    let background: Color
    let text: Color
    let accent: Color
    let border: Color
    let controlsBackground: Color

    static let all: [TeleprompterTheme] = [
        TeleprompterTheme(
            id: .studioBlack,
            label: "Studio Black",
            background: .black,
            text: .white,
            accent: .white,
            border: Color.white.opacity(0.3),
            controlsBackground: .black
        ),
        TeleprompterTheme(
            id: .broadcastYellow,
            label: "Broadcast Yellow",
            background: .black,
            text: Color(red: 1, green: 1, blue: 0),
            accent: Color(red: 1, green: 1, blue: 0),
            border: Color(red: 1, green: 1, blue: 0).opacity(0.4),
            controlsBackground: .black
        ),
        TeleprompterTheme(
            id: .forestClassic,
            label: "Forest Classic",
            background: Color.forest,
            text: Color(red: 254 / 255, green: 252 / 255, blue: 232 / 255),
            accent: Color(red: 254 / 255, green: 240 / 255, blue: 138 / 255),
            border: Color(red: 187 / 255, green: 247 / 255, blue: 208 / 255).opacity(0.5),
            controlsBackground: Color.forest
        ),
        TeleprompterTheme(
            id: .highContrastWhite,
            label: "High Contrast White",
            background: .white,
            text: .black,
            accent: Color.forest,
            border: Color.forest.opacity(0.3),
            controlsBackground: .white
        ),
    ]

    static func theme(for id: TeleprompterThemeID) -> TeleprompterTheme {
        all.first { $0.id == id } ?? all[1]
    }
}
