import AVFoundation
import SwiftUI
import UIKit

struct QRScannerView: View {
    @State private var scannedCode: String?
    @State private var cameraPermissionDenied = false
    @State private var triggerHaptic = false

    var body: some View {
        VStack(spacing: 20) {
            if cameraPermissionDenied {
                cameraDeniedView
            } else {
                QRScannerRepresentable { code in
                    scannedCode = code
                    triggerHaptic.toggle()
                }
                .frame(maxWidth: .infinity)
                .frame(height: 320)
                .clipShape(RoundedRectangle(cornerRadius: PaperlessTheme.cardCornerRadius))
                .padding(.horizontal, 20)
            }

            if let scannedCode {
                ScannedResultCard(payload: scannedCode)
                    .padding(.horizontal, 20)
            } else {
                VStack(spacing: 8) {
                    Text("Point your camera at a QR code")
                        .font(.bodyText)
                        .foregroundStyle(Color.ink)
                    PrivacyBadge()
                }
            }

            Spacer()
        }
        .padding(.top, 20)
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle("Scan QR")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            checkCameraPermission()
        }
        .sensoryFeedback(.success, trigger: triggerHaptic)
    }

    private var cameraDeniedView: some View {
        VStack(spacing: 12) {
            Image(systemName: "camera.fill")
                .font(.largeTitle)
                .foregroundStyle(Color.sandLight)
            Text("Camera access is required to scan QR codes.")
                .font(.bodyText)
                .multilineTextAlignment(.center)
            Button("Open Settings") {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            }
            .foregroundStyle(Color.forest)
        }
        .padding(24)
    }

    private func checkCameraPermission() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            cameraPermissionDenied = false
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { granted in
                DispatchQueue.main.async {
                    cameraPermissionDenied = !granted
                }
            }
        default:
            cameraPermissionDenied = true
        }
    }
}

struct ScannedResultCard: View {
    let payload: String
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
    let onCodeScanned: (String) -> Void

    func makeUIViewController(context: Context) -> QRScannerViewController {
        let controller = QRScannerViewController()
        controller.onCodeScanned = onCodeScanned
        return controller
    }

    func updateUIViewController(_ uiViewController: QRScannerViewController, context: Context) {}
}

final class QRScannerViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    var onCodeScanned: ((String) -> Void)?
    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var lastScannedCode: String?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        setupCamera()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        previewLayer?.frame = view.bounds
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        captureSession?.stopRunning()
    }

    private func setupCamera() {
        let session = AVCaptureSession()
        guard let device = AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device),
              session.canAddInput(input) else { return }

        session.addInput(input)

        let output = AVCaptureMetadataOutput()
        guard session.canAddOutput(output) else { return }
        session.addOutput(output)
        output.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
        output.metadataObjectTypes = [.qr]

        let preview = AVCaptureVideoPreviewLayer(session: session)
        preview.videoGravity = .resizeAspectFill
        preview.frame = view.bounds
        view.layer.addSublayer(preview)

        captureSession = session
        previewLayer = preview

        DispatchQueue.global(qos: .userInitiated).async {
            session.startRunning()
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
        onCodeScanned?(value)
    }
}
