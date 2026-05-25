import SwiftUI

enum BoxEditorMode {
    case singleCrop
    case multiRedact
}

struct PageBoxOverlay: View {
    let pageImage: UIImage
    let mode: BoxEditorMode
    @Binding var boxes: [CGRect]
    var detectedBoxes: [CGRect] = []

    @State private var dragOrigin: CGPoint?
    @State private var dragCurrent: CGPoint?

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Image(uiImage: pageImage)
                    .resizable()
                    .scaledToFit()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                if mode == .singleCrop {
                    if let cropRect = boxes.first {
                        cropSelectionOverlay(cropRect, in: geometry.size)
                    }

                    if let dragOrigin, let dragCurrent {
                        let previewRect = normalizedRect(from: dragOrigin, to: dragCurrent, in: geometry.size)
                        if previewRect.width > 0.02, previewRect.height > 0.02 {
                            cropSelectionOverlay(previewRect, in: geometry.size, isPreview: true)
                        }
                    }
                } else {
                    ForEach(Array(boxes.enumerated()), id: \.offset) { _, rect in
                        boxShape(rect, in: geometry.size, color: Color.black)
                    }

                    ForEach(Array(detectedBoxes.enumerated()), id: \.offset) { _, rect in
                        boxShape(rect, in: geometry.size, color: Color.yellow.opacity(0.45))
                    }

                    if let dragOrigin, let dragCurrent {
                        boxShape(
                            normalizedRect(from: dragOrigin, to: dragCurrent, in: geometry.size),
                            in: geometry.size,
                            color: Color.yellow.opacity(0.45)
                        )
                    }
                }
            }
            .contentShape(Rectangle())
            .highPriorityGesture(
                DragGesture(minimumDistance: 4)
                    .onChanged { value in
                        if dragOrigin == nil { dragOrigin = value.startLocation }
                        dragCurrent = value.location
                    }
                    .onEnded { value in
                        let rect = normalizedRect(from: value.startLocation, to: value.location, in: geometry.size)
                        guard rect.width > 0.02, rect.height > 0.02 else {
                            dragOrigin = nil
                            dragCurrent = nil
                            return
                        }

                        switch mode {
                        case .singleCrop:
                            boxes = [rect]
                        case .multiRedact:
                            boxes.append(rect)
                        }

                        dragOrigin = nil
                        dragCurrent = nil
                    }
            )
        }
        .aspectRatio(pageImage.size, contentMode: .fit)
    }

    private func cropSelectionOverlay(_ rect: CGRect, in size: CGSize, isPreview: Bool = false) -> some View {
        let frame = viewRect(from: rect, in: size)
        let dimColor = Color.forest.opacity(isPreview ? 0.45 : 0.55)

        return ZStack {
            dimRegion(
                width: size.width,
                height: max(0, frame.minY),
                centerX: size.width / 2,
                centerY: frame.minY / 2,
                color: dimColor
            )

            dimRegion(
                width: size.width,
                height: max(0, size.height - frame.maxY),
                centerX: size.width / 2,
                centerY: frame.maxY + max(0, size.height - frame.maxY) / 2,
                color: dimColor
            )

            dimRegion(
                width: max(0, frame.minX),
                height: frame.height,
                centerX: frame.minX / 2,
                centerY: frame.midY,
                color: dimColor
            )

            dimRegion(
                width: max(0, size.width - frame.maxX),
                height: frame.height,
                centerX: frame.maxX + max(0, size.width - frame.maxX) / 2,
                centerY: frame.midY,
                color: dimColor
            )

            Rectangle()
                .strokeBorder(Color.white.opacity(0.85), lineWidth: 1)
                .background(
                    Rectangle()
                        .strokeBorder(Color.forest, lineWidth: 2)
                )
                .frame(width: frame.width, height: frame.height)
                .position(x: frame.midX, y: frame.midY)

            cropGuides(in: frame)

            Text(isPreview ? "Release to set crop" : "Kept area")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.forest, in: RoundedRectangle(cornerRadius: 6))
                .position(x: min(max(frame.minX + 56, 56), size.width - 56), y: max(14, frame.minY - 14))
        }
    }

    private func dimRegion(width: CGFloat, height: CGFloat, centerX: CGFloat, centerY: CGFloat, color: Color) -> some View {
        Rectangle()
            .fill(color)
            .frame(width: width, height: height)
            .position(x: centerX, y: centerY)
    }

    private func cropGuides(in frame: CGRect) -> some View {
        ZStack {
            Rectangle()
                .fill(Color.cream.opacity(0.28))
                .frame(width: 1, height: frame.height)
                .position(x: frame.minX + frame.width / 3, y: frame.midY)

            Rectangle()
                .fill(Color.cream.opacity(0.28))
                .frame(width: 1, height: frame.height)
                .position(x: frame.minX + frame.width * 2 / 3, y: frame.midY)

            Rectangle()
                .fill(Color.cream.opacity(0.28))
                .frame(width: frame.width, height: 1)
                .position(x: frame.midX, y: frame.minY + frame.height / 3)

            Rectangle()
                .fill(Color.cream.opacity(0.28))
                .frame(width: frame.width, height: 1)
                .position(x: frame.midX, y: frame.minY + frame.height * 2 / 3)
        }
    }

    private func boxShape(_ rect: CGRect, in size: CGSize, color: Color) -> some View {
        let frame = viewRect(from: rect, in: size)
        return Rectangle()
            .fill(color)
            .frame(width: frame.width, height: frame.height)
            .position(x: frame.midX, y: frame.midY)
    }

    private func normalizedRect(from start: CGPoint, to end: CGPoint, in size: CGSize) -> CGRect {
        let minX = min(start.x, end.x) / size.width
        let minY = min(start.y, end.y) / size.height
        let width = abs(end.x - start.x) / size.width
        let height = abs(end.y - start.y) / size.height
        return CGRect(x: minX, y: minY, width: width, height: height)
    }

    private func viewRect(from normalized: CGRect, in size: CGSize) -> CGRect {
        CGRect(
            x: normalized.minX * size.width,
            y: normalized.minY * size.height,
            width: normalized.width * size.width,
            height: normalized.height * size.height
        )
    }
}
