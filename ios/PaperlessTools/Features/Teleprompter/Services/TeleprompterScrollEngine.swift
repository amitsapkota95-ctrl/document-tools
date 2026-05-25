import Combine
import QuartzCore
import SwiftUI

@MainActor
final class TeleprompterScrollEngine: NSObject, ObservableObject {
    @Published private(set) var offset: CGFloat = 0
    @Published private(set) var isRunning = false

    var scrollSpeed: Double = 40
    var cuePosition: Double = 0.35

    var contentHeight: CGFloat = 1
    var viewportHeight: CGFloat = 1
    var topPadding: CGFloat = 0

    var wordPositions: [Int: CGFloat] = [:]

    private var displayLink: CADisplayLink?
    private var lastTimestamp: CFTimeInterval = 0

    func start() {
        guard !isRunning else { return }
        isRunning = true
        lastTimestamp = 0
        let link = CADisplayLink(target: self, selector: #selector(tick(_:)))
        link.add(to: .main, forMode: .common)
        displayLink = link
    }

    func stop() {
        isRunning = false
        displayLink?.invalidate()
        displayLink = nil
        lastTimestamp = 0
    }

    func reset() {
        offset = 0
    }

    func jumpToWord(_ index: Int) {
        guard let y = wordPositions[index] else { return }
        offset = clampedOffset(max(0, y - cueLineY))
    }

    func jumpToMarker(_ marker: TeleprompterScriptMarker) {
        jumpToWord(marker.wordIndex)
    }

    func setOffset(_ value: CGFloat) {
        offset = clampedOffset(value)
    }

    private var cueLineY: CGFloat {
        viewportHeight * cuePosition
    }

    private var maxOffset: CGFloat {
        max(0, contentHeight - viewportHeight)
    }

    private func clampedOffset(_ value: CGFloat) -> CGFloat {
        min(max(0, value), maxOffset)
    }

    @objc private func tick(_ link: CADisplayLink) {
        if lastTimestamp == 0 {
            lastTimestamp = link.timestamp
            return
        }

        let delta = link.timestamp - lastTimestamp
        lastTimestamp = link.timestamp
        offset = clampedOffset(offset + scrollSpeed * delta)
    }
}
