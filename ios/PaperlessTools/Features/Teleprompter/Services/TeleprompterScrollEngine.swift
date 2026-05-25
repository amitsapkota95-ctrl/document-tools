import Combine
import QuartzCore
import SwiftUI

@MainActor
final class TeleprompterScrollEngine: NSObject, ObservableObject {
    @Published private(set) var offset: CGFloat = 0
    @Published private(set) var isRunning = false

    var scrollMode: TeleprompterScrollMode = .manual
    var scrollSpeed: Double = 40
    var voiceLerpFactor: Double = 0.06
    var cuePosition: Double = 0.35

    var contentHeight: CGFloat = 1
    var viewportHeight: CGFloat = 1
    var topPadding: CGFloat = 0

    var targetWordIndex: Int = 0
    var wordPositions: [Int: CGFloat] = [:]
    var voiceScrollActive = false

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

    func jumpToWord(_ index: Int, animated: Bool = false) {
        guard let y = wordPositions[index] else { return }
        let target = max(0, y - cueLineY)
        if animated {
            offset = target
        } else {
            offset = target
        }
        targetWordIndex = index
    }

    func jumpToMarker(_ marker: TeleprompterScriptMarker) {
        jumpToWord(marker.wordIndex)
    }

    func scrub(by delta: CGFloat) {
        offset = clampedOffset(offset + delta)
    }

    func nearestWordIndex(at offset: CGFloat) -> Int {
        let cueY = offset + cueLineY
        guard !wordPositions.isEmpty else { return 0 }
        return wordPositions.min(by: { abs($0.value - cueY) < abs($1.value - cueY) })?.key ?? 0
    }

    private var cueLineY: CGFloat {
        viewportHeight * cuePosition
    }

    private var maxOffset: CGFloat {
        max(0, contentHeight - viewportHeight)
    }

    func setOffset(_ value: CGFloat) {
        offset = clampedOffset(value)
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

        if scrollMode == .voice, voiceScrollActive, let wordY = wordPositions[targetWordIndex] {
            let targetOffset = max(0, wordY - cueLineY)
            let diff = targetOffset - offset
            if abs(diff) > 0.5 {
                offset += diff * voiceLerpFactor
            } else {
                offset = targetOffset
            }
            offset = clampedOffset(offset)
            return
        }

        guard scrollMode == .manual else { return }
        offset = clampedOffset(offset + scrollSpeed * delta)
    }
}
