import Foundation
import SwiftUI

struct TeleprompterScriptMarker: Identifiable, Equatable {
    let id: String
    let label: String
    let wordIndex: Int
    let lineIndex: Int
}

enum TeleprompterScriptBlock: Identifiable, Equatable {
    case marker(TeleprompterScriptMarker)
    case paragraph(String, wordStartIndex: Int)

    var id: String {
        switch self {
        case .marker(let marker): return marker.id
        case .paragraph(_, let start): return "paragraph-\(start)"
        }
    }
}

struct TeleprompterScript: Equatable {
    let rawText: String
    let blocks: [TeleprompterScriptBlock]
    let words: [String]
    let markers: [TeleprompterScriptMarker]

    static let empty = TeleprompterScript(rawText: "", blocks: [], words: [], markers: [])

    func words(in paragraph: String) -> [String] {
        paragraph.split { $0.isWhitespace }.map(String.init).filter { !$0.isEmpty }
    }
}

struct TeleprompterWordPreference: Equatable {
    let index: Int
    let midY: CGFloat
}

struct TeleprompterWordPreferenceKey: PreferenceKey {
    static var defaultValue: [TeleprompterWordPreference] = []

    static func reduce(value: inout [TeleprompterWordPreference], nextValue: () -> [TeleprompterWordPreference]) {
        value.append(contentsOf: nextValue())
    }
}
