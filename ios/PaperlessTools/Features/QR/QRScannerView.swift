import AVFoundation
import SwiftUI
import UIKit

struct QRScannerView: View {
    @State private var scannedCode: String?
    @State private var triggerHaptic = false
    @State private var scannerResetTrigger = 0
    @State private var cameraSetupError: String?

    var body: some View {
        VStack(spacing: 20) {
            CameraPermissionGate(deniedMessage: "Camera access is required to scan QR codes.") {
                QRScannerRepresentable(
                    resetTrigger: scannerResetTrigger,
                    onCodeScanned: { code in
                        scannedCode = code
                        triggerHaptic.toggle()
                    },
                    onSetupFailed: { message in
                        cameraSetupError = message
                    }
                )
                .frame(maxWidth: .infinity)
                .frame(height: 320)
                .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
                .padding(.horizontal, 20)
            }
            .frame(height: 320)
            .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
            .padding(.horizontal, 20)

            if let cameraSetupError {
                Text(cameraSetupError)
                    .font(.captionText)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 20)
            } else if let scannedCode {
                ScannedResultCard(payload: scannedCode) {
                    self.scannedCode = nil
                    scannerResetTrigger += 1
                }
                .padding(.horizontal, 20)
            } else {
                VStack(spacing: 8) {
                    Text("Point your camera at a QR code")
                        .font(.bodyText)
                        .foregroundStyle(Color.ink)
                }
            }

            Spacer()
        }
        .padding(.top, 20)
        .paperlessScreenBackground()
        .navigationTitle("Scan QR")
        .navigationBarTitleDisplayMode(.inline)
        .sensoryFeedback(.success, trigger: triggerHaptic)
    }
}

struct ScannedResultCard: View {
    let payload: String
    let onScanAgain: () -> Void
    @State private var copied = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Scanned result")
                .font(.cardTitle)

            Text(payload)
                .font(.bodyText)
                .foregroundStyle(Color.ink)
                .textSelection(.enabled)

            HStack(spacing: 12) {
                Button {
                    UIPasteboard.general.string = payload
                    copied = true
                } label: {
                    Label(copied ? "Copied" : "Copy", systemImage: copied ? "checkmark" : "doc.on.doc")
                        .font(.captionText.weight(.semibold))
                }
                .buttonStyle(.bordered)

                Button(action: onScanAgain) {
                    Label("Scan Again", systemImage: "qrcode.viewfinder")
                        .font(.captionText.weight(.semibold))
                }
                .buttonStyle(.bordered)

                if let url = actionableURL(from: payload) {
                    Link(destination: url) {
                        Label("Open", systemImage: "arrow.up.right")
                            .font(.captionText.weight(.semibold))
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.forest)
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.cream)
        .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
    }

    private func actionableURL(from payload: String) -> URL? {
        if payload.hasPrefix("http://") || payload.hasPrefix("https://") {
            return URL(string: payload)
        }
        if payload.hasPrefix("mailto:") || payload.hasPrefix("tel:") || payload.hasPrefix("sms:") {
            return URL(string: payload)
        }
        if payload.hasPrefix("geo:") {
            let coords = payload.replacingOccurrences(of: "geo:", with: "").components(separatedBy: "?").first ?? ""
            return URL(string: "http://maps.apple.com/?ll=\(coords)")
        }
        return nil
    }
}

struct QRScannerRepresentable: UIViewControllerRepresentable {
    let resetTrigger: Int
    let onCodeScanned: (String) -> Void
    let onSetupFailed: (String) -> Void

    func makeUIViewController(context: Context) -> QRScannerViewController {
        let controller = QRScannerViewController()
        controller.onCodeScanned = onCodeScanned
        controller.onSetupFailed = onSetupFailed
        return controller
    }

    func updateUIViewController(_ uiViewController: QRScannerViewController, context: Context) {
        if context.coordinator.lastResetTrigger != resetTrigger {
            context.coordinator.lastResetTrigger = resetTrigger
            uiViewController.resetScan()
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    final class Coordinator {
        var lastResetTrigger = 0
    }
}

final class QRScannerViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    var onCodeScanned: ((String) -> Void)?
    var onSetupFailed: ((String) -> Void)?

    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var lastScannedCode: String?
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
        configureCameraIfNeeded()
        startSessionIfNeeded()
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        captureSession?.stopRunning()
    }

    func resetScan() {
        lastScannedCode = nil
        startSessionIfNeeded()
    }

    private func configureCameraIfNeeded() {
        guard !isSessionConfigured else { return }
        guard CameraPermissionChecker.currentState() == .authorized else { return }

        let session = AVCaptureSession()
        guard let device = AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device),
              session.canAddInput(input) else {
            DispatchQueue.main.async { [weak self] in
                self?.onSetupFailed?("Unable to access the camera.")
            }
            return
        }

        session.addInput(input)

        let output = AVCaptureMetadataOutput()
        guard session.canAddOutput(output) else {
            DispatchQueue.main.async { [weak self] in
                self?.onSetupFailed?("Unable to access the camera.")
            }
            return
        }
        session.addOutput(output)
        output.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
        output.metadataObjectTypes = [.qr]

        let preview = AVCaptureVideoPreviewLayer(session: session)
        preview.videoGravity = .resizeAspectFill
        preview.frame = view.bounds
        view.layer.addSublayer(preview)

        captureSession = session
        previewLayer = preview
        isSessionConfigured = true
    }

    private func startSessionIfNeeded() {
        guard let captureSession, !captureSession.isRunning else { return }
        DispatchQueue.global(qos: .userInitiated).async {
            captureSession.startRunning()
        }
    }

    func metadataOutput(
        _ output: AVCaptureMetadataOutput,
        didOutput metadataObjects: [AVMetadataObject],
        from connection: AVCaptureConnection
    ) {
        guard let object = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              object.type == .qr,
              let value = object.stringValue,
              value != lastScannedCode else { return }
        lastScannedCode = value
        captureSession?.stopRunning()
        onCodeScanned?(value)
    }
}
