import CoreImage
import UIKit
import Vision

enum DocumentScanProcessor {
    static func processCapturedImage(_ image: UIImage) async -> UIImage {
        guard let cgImage = image.cgImage else { return image }

        return await withCheckedContinuation { continuation in
            DispatchQueue.global(qos: .userInitiated).async {
                let processed = cropImage(cgImage: cgImage, orientation: image.imageOrientation)
                continuation.resume(returning: processed)
            }
        }
    }

    private struct DocumentQuad {
        let topLeft: CGPoint
        let topRight: CGPoint
        let bottomLeft: CGPoint
        let bottomRight: CGPoint

        static func from(_ observation: VNRectangleObservation) -> DocumentQuad {
            DocumentQuad(
                topLeft: observation.topLeft,
                topRight: observation.topRight,
                bottomLeft: observation.bottomLeft,
                bottomRight: observation.bottomRight
            )
        }
    }

    private static func cropImage(cgImage: CGImage, orientation: UIImage.Orientation) -> UIImage {
        let exifOrientation = cgOrientation(from: orientation)
        guard let quad = detectQuadFromStillImage(cgImage: cgImage, orientation: exifOrientation) else {
            return UIImage(cgImage: cgImage, scale: 1, orientation: orientation)
        }

        let orientedImage = CIImage(cgImage: cgImage).oriented(forExifOrientation: Int32(exifOrientation.rawValue))
        let extent = orientedImage.extent

        let topLeft = mapPoint(quad.topLeft, to: extent.size)
        let topRight = mapPoint(quad.topRight, to: extent.size)
        let bottomLeft = mapPoint(quad.bottomLeft, to: extent.size)
        let bottomRight = mapPoint(quad.bottomRight, to: extent.size)

        guard let cropped = perspectiveCorrect(
            image: orientedImage,
            topLeft: topLeft,
            topRight: topRight,
            bottomLeft: bottomLeft,
            bottomRight: bottomRight
        ) else {
            return UIImage(cgImage: cgImage, scale: 1, orientation: orientation)
        }

        return UIImage(cgImage: cropped, scale: 1, orientation: .up)
    }

    private static func detectQuadFromStillImage(
        cgImage: CGImage,
        orientation: CGImagePropertyOrientation
    ) -> DocumentQuad? {
        let rectangleRequest = VNDetectRectanglesRequest()
        rectangleRequest.minimumAspectRatio = 0.25
        rectangleRequest.maximumAspectRatio = 1.0
        rectangleRequest.minimumSize = 0.15
        rectangleRequest.maximumObservations = 1
        rectangleRequest.minimumConfidence = 0.5

        let handler = VNImageRequestHandler(cgImage: cgImage, orientation: orientation, options: [:])

        do {
            try handler.perform([rectangleRequest])
            if let rectangle = rectangleRequest.results?.first {
                return DocumentQuad.from(rectangle)
            }
        } catch {
            return nil
        }

        return detectDocumentQuadFromSegmentation(cgImage: cgImage, orientation: orientation)
    }

    private static func detectDocumentQuadFromSegmentation(
        cgImage: CGImage,
        orientation: CGImagePropertyOrientation
    ) -> DocumentQuad? {
        let request = VNDetectDocumentSegmentationRequest()
        let handler = VNImageRequestHandler(cgImage: cgImage, orientation: orientation, options: [:])

        do {
            try handler.perform([request])
            guard let observation = request.results?.first as? VNPixelBufferObservation else { return nil }
            return quadFromSegmentationMask(observation.pixelBuffer)
        } catch {
            return nil
        }
    }

    private static func quadFromSegmentationMask(_ pixelBuffer: CVPixelBuffer) -> DocumentQuad? {
        CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly) }

        let width = CVPixelBufferGetWidth(pixelBuffer)
        let height = CVPixelBufferGetHeight(pixelBuffer)
        guard width > 0, height > 0,
              let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else {
            return nil
        }

        let bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer)
        let buffer = baseAddress.assumingMemoryBound(to: UInt8.self)

        var foregroundPoints: [CGPoint] = []
        foregroundPoints.reserveCapacity(512)

        let step = max(1, min(width, height) / 128)
        for y in stride(from: 0, to: height, by: step) {
            let row = buffer.advanced(by: y * bytesPerRow)
            for x in stride(from: 0, to: width, by: step) {
                if row[x] > 127 {
                    foregroundPoints.append(
                        CGPoint(x: CGFloat(x) / CGFloat(width), y: 1 - CGFloat(y) / CGFloat(height))
                    )
                }
            }
        }

        guard foregroundPoints.count >= 4 else { return nil }

        var topLeft = foregroundPoints[0]
        var topRight = foregroundPoints[0]
        var bottomLeft = foregroundPoints[0]
        var bottomRight = foregroundPoints[0]

        for point in foregroundPoints {
            let sum = point.x + point.y
            let diff = point.x - point.y

            if sum < topLeft.x + topLeft.y { topLeft = point }
            if diff > topRight.x - topRight.y { topRight = point }
            if diff < bottomLeft.x - bottomLeft.y { bottomLeft = point }
            if sum > bottomRight.x + bottomRight.y { bottomRight = point }
        }

        return DocumentQuad(
            topLeft: topLeft,
            topRight: topRight,
            bottomLeft: bottomLeft,
            bottomRight: bottomRight
        )
    }

    private static func perspectiveCorrect(
        image: CIImage,
        topLeft: CGPoint,
        topRight: CGPoint,
        bottomLeft: CGPoint,
        bottomRight: CGPoint
    ) -> CGImage? {
        guard let filter = CIFilter(name: "CIPerspectiveCorrection") else { return nil }
        filter.setValue(image, forKey: kCIInputImageKey)
        filter.setValue(CIVector(cgPoint: topLeft), forKey: "inputTopLeft")
        filter.setValue(CIVector(cgPoint: topRight), forKey: "inputTopRight")
        filter.setValue(CIVector(cgPoint: bottomLeft), forKey: "inputBottomLeft")
        filter.setValue(CIVector(cgPoint: bottomRight), forKey: "inputBottomRight")

        let context = CIContext(options: nil)
        guard let output = filter.outputImage,
              let cgImage = context.createCGImage(output, from: output.extent) else {
            return nil
        }
        return cgImage
    }

    private static func mapPoint(_ point: CGPoint, to size: CGSize) -> CGPoint {
        CGPoint(x: point.x * size.width, y: point.y * size.height)
    }

    private static func cgOrientation(from orientation: UIImage.Orientation) -> CGImagePropertyOrientation {
        switch orientation {
        case .up: return .up
        case .down: return .down
        case .left: return .left
        case .right: return .right
        case .upMirrored: return .upMirrored
        case .downMirrored: return .downMirrored
        case .leftMirrored: return .leftMirrored
        case .rightMirrored: return .rightMirrored
        @unknown default: return .up
        }
    }
}
