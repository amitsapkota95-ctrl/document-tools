import AVFoundation
import SwiftUI
import UIKit
import VisionKit

struct DocumentScannerView: View {
    @AppStorage("scan.autoCaptureEnabled") private var autoCaptureEnabled = true
    @State private var scannedImages: [UIImage] = []
    @State private var showScanner = false
    @State private var isProcessing = false
    @State private var errorMessage: String?
    @State private var exportedURL: URL?
    @State private var showShareSheet = false

    private var visionKitSupported: Bool {
        VNDocumentCameraViewController.isSupported
    }

    private var effectiveAutoCaptureEnabled: Bool {
        visionKitSupported && autoCaptureEnabled
    }

    var body: some View {
        VStack(spacing: 20) {
            if scannedImages.isEmpty {
                emptyState
            } else {
                scannedPagesView
            }

            scanSettings

            if let errorMessage {
                Text(errorMessage)
                    .font(.captionText)
                    .foregroundStyle(.red)
                    .padding(.horizontal)
            }

            VStack(spacing: 12) {
                PrimaryButton(title: scannedImages.isEmpty ? "Start Scanning" : "Add Pages", icon: "doc.viewfinder") {
                    showScanner = true
                }
                .accessibilityLabel(scannedImages.isEmpty ? "Start scanning" : "Add pages")

                if !scannedImages.isEmpty {
                    PrimaryButton(title: "Save as PDF", icon: "square.and.arrow.up", isLoading: isProcessing) {
                        Task { await exportPDF() }
                    }
                    .accessibilityLabel("Save as PDF")
                }
            }
            .padding(.horizontal, 20)

            Spacer()
        }
        .padding(.top, 20)
        .paperlessScreenBackground()
        .navigationTitle("Scan Document")
        .navigationBarTitleDisplayMode(.inline)
        .fullScreenCover(isPresented: $showScanner) {
            if effectiveAutoCaptureEnabled {
                DocumentScannerRepresentable(
                    onScanComplete: { images in
                        scannedImages.append(contentsOf: images)
                    },
                    onScanError: { message in
                        errorMessage = message
                    }
                )
            } else {
                ManualDocumentCameraView(
                    onComplete: { images in
                        scannedImages.append(contentsOf: images)
                    },
                    onError: { message in
                        errorMessage = message
                    }
                )
            }
        }
        .sheet(isPresented: $showShareSheet) {
            if let exportedURL {
                ShareSheet(items: [exportedURL])
            }
        }
        .overlay {
            if isProcessing {
                ProcessingOverlay(message: "Creating PDF…")
            }
        }
    }

    private var scanSettings: some View {
        VStack(alignment: .leading, spacing: 8) {
            if visionKitSupported {
                Toggle("Auto-capture pages", isOn: $autoCaptureEnabled)
                    .font(.bodyText)
                    .tint(.forest)

                Text(effectiveAutoCaptureEnabled
                     ? "Uses Apple's scanner with automatic page detection."
                     : "Manual mode: tap the shutter for each page.")
                    .font(.captionText)
                    .foregroundStyle(Color.sandLight)
            } else {
                Text("Auto-capture isn't available on this device. Manual camera mode is used instead.")
                    .font(.captionText)
                    .foregroundStyle(Color.sandLight)
            }
        }
        .padding(16)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
        .padding(.horizontal, 20)
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "doc.viewfinder")
                .font(.system(size: 48))
                .foregroundStyle(Color.forest)
            Text("Scan documents page by page")
                .font(.sectionTitle)
            Text("Tap the shutter for each page. Enable auto-capture if you prefer Apple's automatic scanner.")
                .font(.bodyText)
                .foregroundStyle(Color.sandLight)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 40)
    }

    private var scannedPagesView: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(Array(scannedImages.enumerated()), id: \.offset) { index, image in
                    VStack(spacing: 6) {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFill()
                            .frame(width: 100, height: 140)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        Text("Page \(index + 1)")
                            .font(.caption2)
                            .foregroundStyle(Color.sandLight)
                    }
                }
            }
            .padding(.horizontal, 20)
        }
    }

    @MainActor
    private func exportPDF() async {
        isProcessing = true
        errorMessage = nil
        defer { isProcessing = false }

        do {
            let images = scannedImages
            let data = try await Task.detached(priority: .userInitiated) {
                try PDFService.scannedPagesToPDF(images)
            }.value
            exportedURL = try PDFService.writeTemporaryPDF(data, filename: "scanned-document")
            showShareSheet = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct DocumentScannerRepresentable: UIViewControllerRepresentable {
    let onScanComplete: ([UIImage]) -> Void
    let onScanError: (String) -> Void
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> VNDocumentCameraViewController {
        let scanner = VNDocumentCameraViewController()
        scanner.delegate = context.coordinator
        return scanner
    }

    func updateUIViewController(_ uiViewController: VNDocumentCameraViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(onScanComplete: onScanComplete, onScanError: onScanError, dismiss: dismiss)
    }

    final class Coordinator: NSObject, VNDocumentCameraViewControllerDelegate {
        let onScanComplete: ([UIImage]) -> Void
        let onScanError: (String) -> Void
        let dismiss: DismissAction

        init(onScanComplete: @escaping ([UIImage]) -> Void, onScanError: @escaping (String) -> Void, dismiss: DismissAction) {
            self.onScanComplete = onScanComplete
            self.onScanError = onScanError
            self.dismiss = dismiss
        }

        func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFinishWith scan: VNDocumentCameraScan) {
            var images: [UIImage] = []
            for index in 0..<scan.pageCount {
                images.append(scan.imageOfPage(at: index))
            }
            onScanComplete(images)
            dismiss()
        }

        func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
            dismiss()
        }

        func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFailWithError error: Error) {
            onScanError(error.localizedDescription)
            dismiss()
        }
    }
}

// MARK: - Manual camera (default scan mode)

struct ManualDocumentCameraView: View {
    let onComplete: ([UIImage]) -> Void
    let onError: (String) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var capturedImages: [UIImage] = []
    @State private var isProcessingCapture = false
    @State private var captureTrigger = 0
    @State private var cameraErrorMessage: String?

    var body: some View {
        ZStack {
            CameraPermissionGate(deniedMessage: "Camera access is required to capture documents.") {
                ManualCameraPreview(
                    captureTrigger: $captureTrigger,
                    isProcessing: $isProcessingCapture,
                    onPhotoCaptured: { image in
                        Task { await handleCapture(image) }
                    },
                    onSetupFailed: { message in
                        cameraErrorMessage = message
                        onError(message)
                    }
                )
                .ignoresSafeArea()
            }

            VStack {
                HStack {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(.white)
                        .accessibilityLabel("Cancel scanning")

                    Spacer()

                    if !capturedImages.isEmpty {
                        Text("\(capturedImages.count) page\(capturedImages.count == 1 ? "" : "s")")
                            .font(.captionText.weight(.semibold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.black.opacity(0.45))
                            .clipShape(Capsule())
                    }

                    Spacer()

                    Button("Done") {
                        onComplete(capturedImages)
                        dismiss()
                    }
                    .foregroundStyle(capturedImages.isEmpty ? .white.opacity(0.4) : .white)
                    .disabled(capturedImages.isEmpty)
                    .accessibilityLabel("Finish scanning")
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)

                Spacer()

                Button {
                    guard !isProcessingCapture else { return }
                    captureTrigger += 1
                } label: {
                    ZStack {
                        Circle()
                            .strokeBorder(.white, lineWidth: 4)
                            .frame(width: 78, height: 78)
                        Circle()
                            .fill(isProcessingCapture ? Color.white.opacity(0.5) : Color.white)
                            .frame(width: 64, height: 64)
                    }
                }
                .disabled(isProcessingCapture)
                .accessibilityLabel("Capture page")
                .padding(.bottom, 36)

                Text("Tap shutter for each page")
                    .font(.captionText)
                    .foregroundStyle(.white.opacity(0.85))
                    .padding(.bottom, 20)

                if let cameraErrorMessage {
                    Text(cameraErrorMessage)
                        .font(.captionText)
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 20)
                        .padding(.bottom, 12)
                }
            }
        }
        .background(Color.black.ignoresSafeArea())
    }

    @MainActor
    private func handleCapture(_ image: UIImage) async {
        isProcessingCapture = true
        defer { isProcessingCapture = false }

        let processed = await DocumentScanProcessor.processCapturedImage(image)
        capturedImages.append(processed)
    }
}

private struct ManualCameraPreview: UIViewControllerRepresentable {
    @Binding var captureTrigger: Int
    @Binding var isProcessing: Bool
    let onPhotoCaptured: (UIImage) -> Void
    let onSetupFailed: (String) -> Void

    func makeUIViewController(context: Context) -> ManualCameraViewController {
        let controller = ManualCameraViewController()
        controller.onPhotoCaptured = onPhotoCaptured
        controller.onSetupFailed = onSetupFailed
        context.coordinator.controller = controller
        return controller
    }

    func updateUIViewController(_ uiViewController: ManualCameraViewController, context: Context) {
        context.coordinator.controller = uiViewController

        if context.coordinator.lastCaptureTrigger != captureTrigger {
            context.coordinator.lastCaptureTrigger = captureTrigger
            guard !isProcessing else { return }
            uiViewController.capturePhoto()
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    final class Coordinator {
        var controller: ManualCameraViewController?
        var lastCaptureTrigger = 0
    }
}

final class ManualCameraViewController: UIViewController, AVCapturePhotoCaptureDelegate {
    var onPhotoCaptured: ((UIImage) -> Void)?
    var onSetupFailed: ((String) -> Void)?

    private let session = AVCaptureSession()
    private let photoOutput = AVCapturePhotoOutput()
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var isSessionConfigured = false

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        previewLayer?.frame = view.bounds
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        configureSessionIfNeeded()
        startSessionIfNeeded()
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        if session.isRunning {
            session.stopRunning()
        }
    }

    func capturePhoto() {
        let settings = AVCapturePhotoSettings()
        if photoOutput.supportedFlashModes.contains(.auto) {
            settings.flashMode = .auto
        }
        photoOutput.capturePhoto(with: settings, delegate: self)
    }

    private func configureSessionIfNeeded() {
        guard !isSessionConfigured else { return }
        guard CameraPermissionChecker.currentState() == .authorized else { return }

        session.beginConfiguration()
        session.sessionPreset = .photo

        guard
            let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
            let input = try? AVCaptureDeviceInput(device: device),
            session.canAddInput(input)
        else {
            session.commitConfiguration()
            DispatchQueue.main.async { [weak self] in
                self?.onSetupFailed?("Unable to access the camera.")
            }
            return
        }

        session.addInput(input)

        if session.canAddOutput(photoOutput) {
            session.addOutput(photoOutput)
        }

        session.commitConfiguration()

        let previewLayer = AVCaptureVideoPreviewLayer(session: session)
        previewLayer.videoGravity = .resizeAspectFill
        previewLayer.frame = view.bounds
        view.layer.insertSublayer(previewLayer, at: 0)
        self.previewLayer = previewLayer
        isSessionConfigured = true
    }

    private func startSessionIfNeeded() {
        guard isSessionConfigured, !session.isRunning else { return }
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.session.startRunning()
        }
    }

    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        if let error {
            DispatchQueue.main.async { [weak self] in
                self?.onSetupFailed?(error.localizedDescription)
            }
            return
        }

        guard let data = photo.fileDataRepresentation(),
              let image = UIImage(data: data) else {
            DispatchQueue.main.async { [weak self] in
                self?.onSetupFailed?("Unable to capture photo.")
            }
            return
        }

        DispatchQueue.main.async { [weak self] in
            self?.onPhotoCaptured?(image)
        }
    }
}
