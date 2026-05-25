import Foundation

enum TeleprompterCueStyle: String, Codable, CaseIterable, Identifiable {
    case line
    case chevron
    case band

    var id: String { rawValue }

    var label: String {
        switch self {
        case .line: return "Line"
        case .chevron: return "Chevron"
        case .band: return "Band"
        }
    }
}

enum TeleprompterMirrorMode: String, Codable, CaseIterable, Identifiable {
    case none
    case horizontal
    case vertical
    case both

    var id: String { rawValue }

    var label: String {
        switch self {
        case .none: return "None"
        case .horizontal: return "Horizontal"
        case .vertical: return "Vertical"
        case .both: return "Both"
        }
    }

    var scaleX: CGFloat {
        switch self {
        case .horizontal, .both: return -1
        default: return 1
        }
    }

    var scaleY: CGFloat {
        switch self {
        case .vertical, .both: return -1
        default: return 1
        }
    }
}

struct TeleprompterSettings: Equatable {
    var fontSize: Double = 28
    var scrollSpeed: Double = 40
    var targetWpm: Double = 140
    var themeID: TeleprompterThemeID = .broadcastYellow
    var showCueLine: Bool = true
    var cuePosition: Double = 0.35
    var cueStyle: TeleprompterCueStyle = .line
    var mirrorMode: TeleprompterMirrorMode = .none

    var theme: TeleprompterTheme {
        TeleprompterTheme.theme(for: themeID)
    }
}

enum TeleprompterStorage {
    private static let scriptKey = "teleprompter.script"
    private static let settingsKey = "teleprompter.settings"

    static func loadScript() -> String {
        UserDefaults.standard.string(forKey: scriptKey) ?? ""
    }

    static func saveScript(_ script: String) {
        UserDefaults.standard.set(script, forKey: scriptKey)
    }

    static func loadSettings() -> TeleprompterSettings {
        guard
            let data = UserDefaults.standard.data(forKey: settingsKey),
            let settings = try? JSONDecoder().decode(TeleprompterSettings.self, from: data)
        else {
            return TeleprompterSettings()
        }
        return settings
    }

    static func saveSettings(_ settings: TeleprompterSettings) {
        guard let data = try? JSONEncoder().encode(settings) else { return }
        UserDefaults.standard.set(data, forKey: settingsKey)
    }
}

extension TeleprompterSettings: Codable {}

enum TeleprompterWPM {
    static func countWords(in text: String) -> Int {
        text.split { $0.isWhitespace }.filter { !$0.isEmpty }.count
    }

    static func readingTimeLabel(wordCount: Int, wpmLow: Double = 130, wpmHigh: Double = 150) -> String {
        guard wordCount > 0 else { return "0:00" }
        let highSec = (Double(wordCount) / wpmHigh) * 60
        let lowSec = (Double(wordCount) / wpmLow) * 60
        return "\(formatDuration(highSec)) – \(formatDuration(lowSec))"
    }

    static func speedFromTargetWpm(
        targetWpm: Double,
        contentHeight: Double,
        wordCount: Int,
        fps: Double = 60
    ) -> Double {
        guard contentHeight > 0, wordCount > 0, targetWpm > 0 else { return 50 }
        let secToComplete = (Double(wordCount) / targetWpm) * 60
        let pxPerSec = contentHeight / secToComplete
        return min(200, max(10, pxPerSec / fps))
    }

    private static func formatDuration(_ seconds: Double) -> String {
        let mins = Int(seconds) / 60
        let secs = Int(seconds.rounded()) % 60
        return String(format: "%d:%02d", mins, secs)
    }
}
