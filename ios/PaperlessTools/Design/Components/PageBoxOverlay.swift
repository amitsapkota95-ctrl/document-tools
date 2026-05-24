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

                ForEach(Array(displayBoxes.enumerated()), id: \.offset) { _, rect in
                    boxShape(rect, in: geometry.size, color: Color.black.opacity(0.55))
                }

                if let dragOrigin, let dragCurrent {
                    boxShape(
                        normalizedRect(from: dragOrigin, to: dragCurrent, in: geometry.size),
                        in: geometry.size,
                        color: mode == .singleCrop ? Color.forest.opacity(0.35) : Color.yellow.opacity(0.45)
                    )
                }
            }
            .contentShape(Rectangle())
            .gesture(
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

    private var displayBoxes: [CGRect] {
        if boxes.isEmpty, !detectedBoxes.isEmpty { return detectedBoxes }
        return boxes
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
