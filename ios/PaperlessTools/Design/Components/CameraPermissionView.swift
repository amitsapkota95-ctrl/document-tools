import AVFoundation
import SwiftUI

enum CameraPermissionState: Equatable {
    case unknown
    case authorized
    case denied
}

enum CameraPermissionChecker {
    static func currentState() -> CameraPermissionState {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            return .authorized
        case .notDetermined:
            return .unknown
        default:
            return .denied
        }
    }

    static func requestAccess() async -> CameraPermissionState {
        let granted = await AVCaptureDevice.requestAccess(for: .video)
        return granted ? .authorized : .denied
    }
}

struct CameraPermissionDeniedView: View {
    let message: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "camera.fill")
                .font(.largeTitle)
                .foregroundStyle(Color.sandLight)
            Text(message)
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
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black.opacity(0.85))
    }
}

struct CameraPermissionGate<Content: View>: View {
    @Environment(\.scenePhase) private var scenePhase
    @State private var permissionState: CameraPermissionState = .unknown
    let deniedMessage: String
    @ViewBuilder let content: () -> Content

    var body: some View {
        Group {
            switch permissionState {
            case .unknown:
                ProgressView("Checking camera access…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.black.opacity(0.85))
            case .denied:
                CameraPermissionDeniedView(message: deniedMessage)
            case .authorized:
                content()
            }
        }
        .task {
            await refreshPermission(requestIfNeeded: true)
        }
        .onChange(of: scenePhase) { _, newPhase in
            guard newPhase == .active else { return }
            Task { await refreshPermission(requestIfNeeded: false) }
        }
    }

    private func refreshPermission(requestIfNeeded: Bool) async {
        let current = CameraPermissionChecker.currentState()

        if current == .unknown, requestIfNeeded {
            permissionState = await CameraPermissionChecker.requestAccess()
            return
        }

        permissionState = current
    }
}
