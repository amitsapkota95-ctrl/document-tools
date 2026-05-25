import AVFoundation
import Combine
import Speech

enum TeleprompterVoiceStatus: Equatable {
    case idle
    case requestingPermission
    case listening
    case matching
    case paused
    case error(String)
}

enum TeleprompterPermissionStatus: Equatable {
    case notDetermined
    case granted
    case denied
}

@MainActor
final class TeleprompterVoiceTracker: ObservableObject {
    @Published private(set) var status: TeleprompterVoiceStatus = .idle
    @Published private(set) var activeWordIndex = 0
    @Published private(set) var currentPhrase = ""
    @Published private(set) var interimText = ""
    @Published private(set) var isHearingAudio = false
    @Published private(set) var permissionStatus: TeleprompterPermissionStatus = .notDetermined
    @Published private(set) var usesOnDeviceRecognition = false
    @Published private(set) var statusDetail = ""

    var isPausedBySilence = false
    var sensitivity: Double = 0.5

    private var scriptWords: [String] = []
    private var speechRecognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    private var silenceTimer: Timer?
    private var wantsListening = false
    private var shouldScrollWhenListening = false
    private var processedSegmentCount = 0
    private var lastMatchedTranscript = ""

    var localeLabel: String {
        speechRecognizer?.locale.identifier ?? Locale.current.identifier
    }

    func configure(script: TeleprompterScript) {
        scriptWords = script.words
        if let recognizer = SFSpeechRecognizer(locale: Locale.current), recognizer.isAvailable {
            speechRecognizer = recognizer
        } else if let fallback = SFSpeechRecognizer(locale: Locale(identifier: "en-US")) {
            speechRecognizer = fallback
        } else {
            speechRecognizer = SFSpeechRecognizer()
        }
        refreshPermissionStatus()
    }

    func refreshPermissionStatus() {
        let speechAuthorized = SFSpeechRecognizer.authorizationStatus() == .authorized
        let micAuthorized = AVAudioApplication.shared.recordPermission == .granted

        if speechAuthorized && micAuthorized {
            permissionStatus = .granted
        } else if SFSpeechRecognizer.authorizationStatus() == .denied
            || SFSpeechRecognizer.authorizationStatus() == .restricted
            || AVAudioApplication.shared.recordPermission == .denied {
            permissionStatus = .denied
        } else {
            permissionStatus = .notDetermined
        }
    }

    func requestPermissions() async -> Bool {
        status = .requestingPermission

        let speechGranted = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status == .authorized)
            }
        }

        guard speechGranted else {
            refreshPermissionStatus()
            status = .error("Speech recognition permission denied.")
            statusDetail = "Enable Speech Recognition in Settings."
            return false
        }

        let micGranted = await AVAudioApplication.requestRecordPermission()
        refreshPermissionStatus()

        guard micGranted else {
            status = .error("Microphone permission denied.")
            statusDetail = "Enable Microphone access in Settings."
            return false
        }

        status = .idle
        statusDetail = ""
        return true
    }

    func setAnchorWordIndex(_ index: Int) {
        activeWordIndex = min(max(0, index), max(scriptWords.count - 1, 0))
        processedSegmentCount = 0
        lastMatchedTranscript = ""
    }

    func startListening(shouldScroll: Bool) {
        guard !wantsListening else { return }

        refreshPermissionStatus()
        guard permissionStatus == .granted else {
            status = .error("Microphone permission required.")
            statusDetail = "Grant microphone and speech access before using voice mode."
            return
        }
        guard let speechRecognizer, speechRecognizer.isAvailable else {
            status = .error("Speech recognition unavailable.")
            statusDetail = "Try again on a physical device with an internet connection."
            return
        }

        stopListening()

        wantsListening = true
        shouldScrollWhenListening = shouldScroll
        processedSegmentCount = 0
        lastMatchedTranscript = ""
        isPausedBySilence = false

        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .measurement, options: [.duckOthers, .defaultToSpeaker, .allowBluetooth])
            try session.setActive(true, options: .notifyOthersOnDeactivation)

            if !audioEngine.isRunning {
                let inputNode = audioEngine.inputNode
                let format = inputNode.outputFormat(forBus: 0)
                inputNode.removeTap(onBus: 0)
                inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
                    self?.recognitionRequest?.append(buffer)
                }
                audioEngine.prepare()
                try audioEngine.start()
            }

            beginRecognitionTask()
            status = .listening
            statusDetail = "Speak your script aloud. Words appear below as they're heard."
        } catch {
            wantsListening = false
            status = .error(error.localizedDescription)
            statusDetail = "Could not start the microphone."
            stopListening()
        }
    }

    func stopListening() {
        wantsListening = false
        shouldScrollWhenListening = false
        silenceTimer?.invalidate()
        silenceTimer = nil
        isHearingAudio = false
        processedSegmentCount = 0
        lastMatchedTranscript = ""

        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }

        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionRequest = nil
        recognitionTask = nil

        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)

        if case .error = status {
            return
        }
        status = .idle
        interimText = ""
        statusDetail = ""
    }

    private func beginRecognitionTask() {
        guard wantsListening, let speechRecognizer else { return }

        recognitionRequest?.endAudio()
        recognitionTask?.cancel()

        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest else { return }

        recognitionRequest.shouldReportPartialResults = true
        recognitionRequest.taskHint = .dictation

        if speechRecognizer.supportsOnDeviceRecognition {
            recognitionRequest.requiresOnDeviceRecognition = false
            usesOnDeviceRecognition = false
        }

        recognitionTask = speechRecognizer.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            Task { @MainActor in
                self?.handleRecognitionEvent(result: result, error: error)
            }
        }
    }

    private func handleRecognitionEvent(result: SFSpeechRecognitionResult?, error: Error?) {
        if let result {
            handleRecognitionResult(result)
        }

        if let error {
            if isBenignSpeechError(error) {
                if wantsListening {
                    beginRecognitionTask()
                }
                return
            }
            status = .error(error.localizedDescription)
            statusDetail = "Voice tracking stopped. Tap play to try again."
            stopListening()
            return
        }

        if result?.isFinal == true, wantsListening {
            beginRecognitionTask()
        }
    }

    private func handleRecognitionResult(_ result: SFSpeechRecognitionResult) {
        let transcript = result.bestTranscription.formattedString.trimmingCharacters(in: .whitespacesAndNewlines)
        interimText = transcript
        registerSpeechActivity()

        let segments = result.bestTranscription.segments
        guard processedSegmentCount < segments.count else {
            matchFromFullTranscript(transcript)
            return
        }

        for index in processedSegmentCount..<segments.count {
            let segment = segments[index]
            let spoken = segment.substring.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !spoken.isEmpty else { continue }
            _ = advanceToWord(spoken)
        }
        processedSegmentCount = segments.count

        if transcript != lastMatchedTranscript {
            lastMatchedTranscript = transcript
            matchFromFullTranscript(transcript)
        }
    }

    private func matchFromFullTranscript(_ transcript: String) {
        let spokenWords = TeleprompterScriptParser.extractWords(from: transcript)
        guard let lastWords = Array(spokenWords.suffix(phraseWindowSize)).nonEmpty else { return }

        if let matchedIndex = TeleprompterScriptParser.matchPhrase(
            spokenWords: lastWords,
            scriptWords: scriptWords,
            from: activeWordIndex,
            maxLookahead: maxLookahead
        ) {
            activeWordIndex = max(activeWordIndex, matchedIndex)
            currentPhrase = lastWords.joined(separator: " ")
            status = shouldScrollWhenListening ? .matching : .listening
            isPausedBySilence = false
        }
    }

    @discardableResult
    private func advanceToWord(_ spoken: String) -> Bool {
        guard !spoken.isEmpty else { return false }

        var idx = activeWordIndex
        let searchEnd = min(scriptWords.count, activeWordIndex + maxLookahead)

        while idx < searchEnd {
            if TeleprompterScriptParser.fuzzyMatchWord(spoken: spoken, expected: scriptWords[idx]) {
                activeWordIndex = idx
                let phraseStart = max(0, idx - 2)
                currentPhrase = scriptWords[phraseStart...idx].joined(separator: " ")
                status = shouldScrollWhenListening ? .matching : .listening
                isPausedBySilence = false
                return true
            }
            idx += 1
        }
        return false
    }

    private func registerSpeechActivity() {
        isHearingAudio = true
        silenceTimer?.invalidate()
        silenceTimer = Timer.scheduledTimer(withTimeInterval: silenceTimeout, repeats: false) { [weak self] _ in
            Task { @MainActor in
                guard let self else { return }
                self.isHearingAudio = false
                if self.shouldScrollWhenListening {
                    self.isPausedBySilence = true
                    self.status = .paused
                }
            }
        }
    }

    private func isBenignSpeechError(_ error: Error) -> Bool {
        let nsError = error as NSError
        if nsError.domain == "kAFAssistantErrorDomain" && (nsError.code == 1110 || nsError.code == 203) {
            return true
        }
        if nsError.domain == "kLSRErrorDomain" && nsError.code == 301 {
            return true
        }
        if nsError.code == 216 {
            return true
        }
        return false
    }

    private var phraseWindowSize: Int {
        Int(round(3 + sensitivity * 2))
    }

    private var maxLookahead: Int {
        Int(round(8 + sensitivity * 10))
    }

    private var silenceTimeout: TimeInterval {
        2.0 - (sensitivity * 0.5)
    }
}

private extension Array {
    var nonEmpty: Self? {
        isEmpty ? nil : self
    }
}
