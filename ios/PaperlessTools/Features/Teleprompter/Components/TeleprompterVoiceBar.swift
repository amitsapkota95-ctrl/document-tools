import SwiftUI

struct TeleprompterVoiceBar: View {
    let theme: TeleprompterTheme
    let status: TeleprompterVoiceStatus
    let currentPhrase: String
    let interimText: String
    let isHearingAudio: Bool
    let usesOnDeviceRecognition: Bool
    let statusDetail: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: isHearingAudio ? "mic.fill" : "mic")
                .foregroundStyle(isHearingAudio ? Color.sage : theme.text.opacity(0.7))
                .symbolEffect(.pulse, isActive: isHearingAudio)

            VStack(alignment: .leading, spacing: 2) {
                if !currentPhrase.isEmpty {
                    Text("Reading: \(currentPhrase)")
                        .font(.caption.weight(.semibold))
                        .lineLimit(1)
                } else if case .error = status {
                    Text("Voice tracking issue")
                        .font(.caption.weight(.semibold))
                } else {
                    Text("Listening for your voice")
                        .font(.caption.weight(.semibold))
                }

                if !interimText.isEmpty {
                    Text("Heard: \(interimText)")
                        .font(.caption2)
                        .foregroundStyle(theme.text.opacity(0.6))
                        .lineLimit(2)
                } else if !statusDetail.isEmpty {
                    Text(statusDetail)
                        .font(.caption2)
                        .foregroundStyle(theme.text.opacity(0.6))
                        .lineLimit(2)
                } else {
                    Text("Speak clearly toward the microphone.")
                        .font(.caption2)
                        .foregroundStyle(theme.text.opacity(0.6))
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(statusLabel)
                    .font(.caption2.weight(.semibold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(theme.border.opacity(0.25))
                    .clipShape(Capsule())

                if usesOnDeviceRecognition {
                    Text("On device")
                        .font(.caption2)
                        .foregroundStyle(theme.text.opacity(0.55))
                }
            }
        }
        .foregroundStyle(theme.text)
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial)
    }

    private var statusLabel: String {
        switch status {
        case .idle: return "Idle"
        case .requestingPermission: return "Permission"
        case .listening: return "Listening"
        case .matching: return "Matching"
        case .paused: return "Paused"
        case .error: return "Error"
        }
    }
}
