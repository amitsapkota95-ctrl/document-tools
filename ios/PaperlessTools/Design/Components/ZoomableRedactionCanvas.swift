import SwiftUI
import UIKit

struct ZoomableRedactionCanvas: UIViewRepresentable {
    let pageImage: UIImage
    let pageIndex: Int
    let boxes: [CGRect]
    var onCommitBox: (CGRect) -> Void
    @Binding var zoomScale: CGFloat
    var resetZoomTrigger: Int

    func makeCoordinator() -> Coordinator {
        Coordinator(pageImage: pageImage, pageIndex: pageIndex, zoomScale: $zoomScale, onCommitBox: onCommitBox)
    }

    func makeUIView(context: Context) -> DocumentZoomScrollView {
        let scrollView = DocumentZoomScrollView()
        scrollView.delegate = context.coordinator
        scrollView.minimumZoomScale = 1.0
        scrollView.maximumZoomScale = 4.0
        scrollView.bouncesZoom = true
        scrollView.showsHorizontalScrollIndicator = false
        scrollView.showsVerticalScrollIndicator = false
        scrollView.backgroundColor = UIColor(Color.cream200)
        scrollView.clipsToBounds = true
        scrollView.layer.cornerRadius = PaperlessTheme.cardCornerRadius
        scrollView.isScrollEnabled = false
        scrollView.panGestureRecognizer.minimumNumberOfTouches = 1
        scrollView.panGestureRecognizer.maximumNumberOfTouches = 1
        scrollView.panGestureRecognizer.isEnabled = false

        let zoomContainer = UIView()
        zoomContainer.backgroundColor = .clear

        let contentView = RedactionCanvasContentView(image: pageImage)
        contentView.onBoxDrawn = { rect in
            context.coordinator.commitBox(rect)
        }

        zoomContainer.addSubview(contentView)
        scrollView.addSubview(zoomContainer)

        context.coordinator.scrollView = scrollView
        context.coordinator.zoomContainerView = zoomContainer
        context.coordinator.contentView = contentView
        context.coordinator.lastResetZoomTrigger = resetZoomTrigger
        scrollView.onBoundsChanged = { [weak coordinator = context.coordinator] size in
            coordinator?.configureLayoutIfNeeded(for: size)
        }

        return scrollView
    }

    func updateUIView(_ scrollView: DocumentZoomScrollView, context: Context) {
        context.coordinator.onCommitBox = onCommitBox
        context.coordinator.updatePageIfNeeded(pageIndex: pageIndex, pageImage: pageImage)
        context.coordinator.configureLayoutIfNeeded(for: scrollView.bounds.size)
        context.coordinator.syncBoxes(boxes)

        if context.coordinator.lastResetZoomTrigger != resetZoomTrigger {
            context.coordinator.lastResetZoomTrigger = resetZoomTrigger
            context.coordinator.resetZoom()
        }
    }

    final class Coordinator: NSObject, UIScrollViewDelegate {
        var pageImage: UIImage
        var pageIndex: Int
        var onCommitBox: (CGRect) -> Void
        @Binding var zoomScale: CGFloat
        weak var scrollView: DocumentZoomScrollView?
        weak var zoomContainerView: UIView?
        weak var contentView: RedactionCanvasContentView?
        var lastResetZoomTrigger = 0
        private var lastLayoutWidth: CGFloat = 0
        private var hasConfiguredLayout = false
        private var displayedBoxes: [CGRect] = []

        init(pageImage: UIImage, pageIndex: Int, zoomScale: Binding<CGFloat>, onCommitBox: @escaping (CGRect) -> Void) {
            self.pageImage = pageImage
            self.pageIndex = pageIndex
            self.onCommitBox = onCommitBox
            _zoomScale = zoomScale
        }

        func updatePageIfNeeded(pageIndex: Int, pageImage: UIImage) {
            guard pageIndex != self.pageIndex else { return }
            self.pageIndex = pageIndex
            self.pageImage = pageImage
            displayedBoxes = []
            contentView?.updateImage(pageImage)
            hasConfiguredLayout = false
            lastLayoutWidth = 0
            scrollView?.setZoomScale(1.0, animated: false)
            zoomScale = 1.0
        }

        func commitBox(_ rect: CGRect) {
            var updated = displayedBoxes
            updated.append(rect)
            displayedBoxes = updated
            contentView?.updateBoxes(updated)
            onCommitBox(rect)
        }

        func syncBoxes(_ boxes: [CGRect]) {
            guard boxes != displayedBoxes else { return }
            displayedBoxes = boxes
            contentView?.updateBoxes(boxes)
        }

        func configureLayoutIfNeeded(for bounds: CGSize) {
            guard let scrollView, bounds.width > 0 else { return }
            guard !hasConfiguredLayout || abs(lastLayoutWidth - bounds.width) > 0.5 else { return }

            let widthChanged = hasConfiguredLayout && abs(lastLayoutWidth - bounds.width) > 0.5
            lastLayoutWidth = bounds.width
            hasConfiguredLayout = true

            if widthChanged {
                scrollView.setZoomScale(1.0, animated: false)
                zoomScale = 1.0
            }

            let aspect = pageImage.size.height / max(pageImage.size.width, 1)
            let contentSize = CGSize(width: bounds.width, height: bounds.width * aspect)

            zoomContainerView?.frame = CGRect(origin: .zero, size: contentSize)
            contentView?.frame = zoomContainerView?.bounds ?? .zero
            scrollView.contentSize = contentSize
            contentView?.updateBoxes(displayedBoxes)
            updatePanGesture(for: scrollView.zoomScale)
            centerContentIfNeeded(in: scrollView)
        }

        func resetZoom() {
            scrollView?.setZoomScale(1.0, animated: true)
        }

        func viewForZooming(in scrollView: UIScrollView) -> UIView? {
            zoomContainerView
        }

        func scrollViewDidZoom(_ scrollView: UIScrollView) {
            updatePanGesture(for: scrollView.zoomScale)
            if scrollView.zoomScale <= 1.01 {
                centerContentIfNeeded(in: scrollView)
            } else {
                scrollView.contentInset = .zero
            }
        }

        func scrollViewDidEndZooming(_ scrollView: UIScrollView, with view: UIView?, atScale scale: CGFloat) {
            zoomScale = scale
            updatePanGesture(for: scale)
            if scale <= 1.01 {
                centerContentIfNeeded(in: scrollView)
            } else {
                scrollView.contentInset = .zero
            }
        }

        private func updatePanGesture(for scale: CGFloat) {
            guard let scrollView else { return }
            let zoomed = scale > 1.01
            scrollView.isScrollEnabled = zoomed
            scrollView.panGestureRecognizer.isEnabled = zoomed
        }

        private func centerContentIfNeeded(in scrollView: UIScrollView) {
            guard scrollView.zoomScale <= 1.01 else {
                scrollView.contentInset = .zero
                return
            }

            let offsetX = max((scrollView.bounds.width - scrollView.contentSize.width) * 0.5, 0)
            let offsetY = max((scrollView.bounds.height - scrollView.contentSize.height) * 0.5, 0)
            scrollView.contentInset = UIEdgeInsets(
                top: offsetY,
                left: offsetX,
                bottom: offsetY,
                right: offsetX
            )
        }
    }
}

final class DocumentZoomScrollView: UIScrollView {
    var onBoundsChanged: ((CGSize) -> Void)?
    private var lastReportedWidth: CGFloat = 0

    override func layoutSubviews() {
        super.layoutSubviews()
        guard bounds.width > 0 else { return }
        guard abs(lastReportedWidth - bounds.width) > 0.5 || lastReportedWidth == 0 else { return }
        lastReportedWidth = bounds.width
        onBoundsChanged?(bounds.size)
    }

    override func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
        if gestureRecognizer === panGestureRecognizer, zoomScale <= 1.01 {
            return false
        }
        return super.gestureRecognizerShouldBegin(gestureRecognizer)
    }
}

final class RedactionCanvasContentView: UIView {
    var onBoxDrawn: ((CGRect) -> Void)?

    private let imageView = UIImageView()
    private let overlayView = UIView()
    private let previewLayer = CAShapeLayer()
    private var boxViews: [UIView] = []
    private var storedBoxes: [CGRect] = []
    private var dragStart: CGPoint?

    init(image: UIImage) {
        super.init(frame: .zero)
        imageView.image = image
        imageView.contentMode = .scaleAspectFit
        addSubview(imageView)

        overlayView.backgroundColor = .clear
        overlayView.isUserInteractionEnabled = true
        addSubview(overlayView)

        previewLayer.fillColor = UIColor.systemYellow.withAlphaComponent(0.45).cgColor
        previewLayer.zPosition = 10
        overlayView.layer.addSublayer(previewLayer)

        backgroundColor = UIColor(Color.cream200)
        isMultipleTouchEnabled = true
        overlayView.isMultipleTouchEnabled = true

        let drawGesture = UIPanGestureRecognizer(target: self, action: #selector(handleDraw(_:)))
        drawGesture.minimumNumberOfTouches = 1
        drawGesture.maximumNumberOfTouches = 1
        drawGesture.delaysTouchesBegan = false
        drawGesture.cancelsTouchesInView = false
        overlayView.addGestureRecognizer(drawGesture)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        nil
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        imageView.frame = bounds
        overlayView.frame = bounds
        previewLayer.frame = overlayView.bounds
        renderBoxes()
    }

    func updateImage(_ image: UIImage) {
        imageView.image = image
    }

    func updateBoxes(_ boxes: [CGRect]) {
        storedBoxes = boxes
        renderBoxes()
    }

    private func renderBoxes() {
        boxViews.forEach { $0.removeFromSuperview() }
        boxViews.removeAll()

        let size = overlayView.bounds.size
        guard size.width > 0, size.height > 0 else { return }

        for normalized in storedBoxes {
            let frame = viewRect(from: normalized, in: size)
            let boxView = UIView(frame: frame)
            boxView.backgroundColor = .black
            boxView.isUserInteractionEnabled = false
            overlayView.addSubview(boxView)
            boxViews.append(boxView)
        }
    }

    @objc private func handleDraw(_ gesture: UIPanGestureRecognizer) {
        let point = gesture.location(in: overlayView)
        let size = overlayView.bounds.size
        guard size.width > 0, size.height > 0 else { return }

        switch gesture.state {
        case .began:
            dragStart = point
            previewLayer.path = nil
        case .changed:
            guard let start = dragStart else { return }
            let rect = normalizedRect(from: start, to: point, in: size)
            previewLayer.path = boxPath(for: [rect], in: size).cgPath
        case .ended, .cancelled:
            guard let start = dragStart else { return }
            let rect = normalizedRect(from: start, to: point, in: size)
            dragStart = nil
            previewLayer.path = nil

            let pixelWidth = abs(point.x - start.x)
            let pixelHeight = abs(point.y - start.y)
            guard pixelWidth >= 8, pixelHeight >= 8 else { return }

            onBoxDrawn?(rect)
        default:
            break
        }
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

    private func boxPath(for boxes: [CGRect], in size: CGSize) -> UIBezierPath {
        let path = UIBezierPath()
        for normalized in boxes {
            path.append(UIBezierPath(rect: viewRect(from: normalized, in: size)))
        }
        return path
    }
}
