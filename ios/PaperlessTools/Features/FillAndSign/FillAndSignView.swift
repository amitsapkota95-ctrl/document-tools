import PDFKit
import PencilKit
import SwiftUI
import UniformTypeIdentifiers

enum SignatureInkColor: String, CaseIterable, Identifiable {
    case black
    case green
    case blue
    case red
    case white

    var id: String { rawValue }

    var label: String {
        switch self {
        case .black: return "Black"
        case .green: return "Green"
        case .blue: return "Blue"
        case .red: return "Red"
        case .white: return "White"
        }
    }

    var uiColor: UIColor {
        switch self {
        case .black: return UIColor(red: 0.11, green: 0.10, blue: 0.09, alpha: 1)
        case .green: return UIColor(red: 0.08, green: 0.33, blue: 0.18, alpha: 1)
        case .blue: return UIColor(red: 0.11, green: 0.31, blue: 0.85, alpha: 1)
        case .red: return UIColor(red: 0.73, green: 0.11, blue: 0.11, alpha: 1)
        case .white: return .white
        }
    }

    var swiftUIColor: Color {
        Color(uiColor)
    }
}

enum SignatureFontStyle: String, CaseIterable, Identifiable {
    case script
    case handwriting
    case chancery

    var id: String { rawValue }

    var label: String {
        switch self {
        case .script: return "Script"
        case .handwriting: return "Handwriting"
        case .chancery: return "Chancery"
        }
    }

    var fontName: String {
        switch self {
        case .script: return "Snell Roundhand"
        case .handwriting: return "Bradley Hand"
        case .chancery: return "Apple Chancery"
        }
    }

    func uiFont(size: CGFloat) -> UIFont {
        UIFont(name: fontName, size: size) ?? .italicSystemFont(ofSize: size)
    }
}

enum SignatureCreatorTab: String, CaseIterable, Identifiable {
    case type
    case draw

    var id: String { rawValue }

    var label: String {
        switch self {
        case .type: return "Type"
        case .draw: return "Draw"
        }
    }
}

enum SignatureImageRenderer {
    static func typedSignature(
        text: String,
        fontStyle: SignatureFontStyle,
        color: SignatureInkColor,
        fontSize: CGFloat = 52
    ) -> UIImage? {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }

        let font = fontStyle.uiFont(size: fontSize)
        let attributes: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: color.uiColor
        ]
        let textSize = (trimmed as NSString).size(withAttributes: attributes)
        let canvasSize = CGSize(
            width: max(textSize.width + 48, 280),
            height: max(textSize.height + 32, 96)
        )

        let renderer = UIGraphicsImageRenderer(size: canvasSize)
        return renderer.image { _ in
            let origin = CGPoint(
                x: 24,
                y: (canvasSize.height - textSize.height) / 2
            )
            (trimmed as NSString).draw(at: origin, withAttributes: attributes)
        }
    }
}

struct FillAndSignView: View {
    @State private var pdfURL: URL?
    @State private var pdfData: Data?
    @State private var pdfDocument: PDFDocument?
    @State private var currentPageIndex = 0
    @State private var showPicker = false
    @State private var showSignatureSheet = false
    @State private var signatureImage: UIImage?
    @State private var signaturePageIndex = 0
    @State private var signatureNormalizedRect = CGRect(x: 0.52, y: 0.78, width: 0.38, height: 0.12)
    @State private var applyToAllPages = false
    @State private var isProcessing = false
    @State private var errorMessage: String?
    @State private var exportedURL: URL?
    @State private var showShareSheet = false
    @State private var savedSignatures: [SavedSignature] = StorageService.loadSignatures()

    private var shouldShowSignatureOverlay: Bool {
        guard signatureImage != nil else { return false }
        return applyToAllPages || signaturePageIndex == currentPageIndex
    }

    var body: some View {
        VStack(spacing: 16) {
            if pdfDocument == nil {
                emptyState
            } else {
                pdfViewer
                signatureControls
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.captionText)
                    .foregroundStyle(.red)
                    .padding(.horizontal)
            }

            VStack(spacing: 12) {
                PrimaryButton(title: pdfDocument == nil ? "Choose PDF" : "Change PDF", icon: "doc") {
                    showPicker = true
                }

                if pdfDocument != nil, signatureImage != nil {
                    PrimaryButton(title: "Apply & Export", icon: "square.and.arrow.up", isLoading: isProcessing) {
                        Task { await exportSignedPDF() }
                    }
                }
            }
            .padding(.horizontal, 20)

            Spacer()
        }
        .padding(.top, 12)
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle("Fill & Sign")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showPicker) {
            DocumentPicker(contentTypes: [.pdf], allowsMultipleSelection: false) { urls in
                if let url = urls.first {
                    loadPDF(from: url)
                }
            }
        }
        .sheet(isPresented: $showSignatureSheet) {
            SignatureCreatorSheet { image, name in
                saveAndPlaceSignature(image, name: name)
            }
        }
        .sheet(isPresented: $showShareSheet) {
            if let exportedURL {
                ShareSheet(items: [exportedURL])
            }
        }
        .overlay {
            if isProcessing {
                ProcessingOverlay(message: "Applying signature…")
            }
        }
        .onAppear {
            if pdfDocument == nil, let sharedURL = SharedPDFImportStore.consumeSharedPDFURL() {
                loadPDF(from: sharedURL)
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "signature")
                .font(.system(size: 48))
                .foregroundStyle(Color.forest)
            Text("Sign any PDF")
                .font(.sectionTitle)
            Text("Type or draw your signature, place it on a page, then export the signed PDF.")
                .font(.bodyText)
                .foregroundStyle(Color.sandLight)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 40)
    }

    private var pdfViewer: some View {
        VStack(spacing: 8) {
            if let pdfDocument, let page = pdfDocument.page(at: currentPageIndex) {
                PageSignatureOverlay(
                    pageImage: page.thumbnail(of: CGSize(width: 600, height: 800), for: .mediaBox),
                    signatureImage: shouldShowSignatureOverlay ? signatureImage : nil,
                    normalizedRect: $signatureNormalizedRect
                )
                .frame(maxHeight: 360)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .padding(.horizontal, 16)

                HStack {
                    Button {
                        currentPageIndex = max(0, currentPageIndex - 1)
                    } label: {
                        Image(systemName: "chevron.left")
                    }
                    .disabled(currentPageIndex == 0)

                    Text("Page \(currentPageIndex + 1) of \(pdfDocument.pageCount)")
                        .font(.captionText)

                    Button {
                        currentPageIndex = min(pdfDocument.pageCount - 1, currentPageIndex + 1)
                    } label: {
                        Image(systemName: "chevron.right")
                    }
                    .disabled(currentPageIndex >= pdfDocument.pageCount - 1)
                }

                if signatureImage != nil {
                    Toggle("Apply signature to all pages", isOn: $applyToAllPages)
                        .font(.captionText)
                        .padding(.horizontal, 20)

                    if !applyToAllPages {
                        Text("Signature will be placed on page \(signaturePageIndex + 1) only.")
                            .font(.caption2)
                            .foregroundStyle(Color.sandLight)
                            .padding(.horizontal, 20)
                    }
                }
            }
        }
    }

    private var signatureControls: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Signature")
                .font(.cardTitle)
                .padding(.horizontal, 20)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    Button {
                        showSignatureSheet = true
                    } label: {
                        VStack {
                            Image(systemName: "plus")
                            Text("Create")
                                .font(.caption2)
                        }
                        .frame(width: 80, height: 60)
                        .background(Color.forest50)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }

                    ForEach(savedSignatures) { signature in
                        Button {
                            placeSignature(signature.image)
                        } label: {
                            if let image = signature.image {
                                Image(uiImage: image)
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 80, height: 60)
                                    .background(Color.white)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(Color.forest.opacity(0.3), lineWidth: 1)
                                    )
                            }
                        }
                    }
                }
                .padding(.horizontal, 20)
            }
        }
    }

    private func placeSignature(_ image: UIImage?) {
        guard let image else { return }
        signatureImage = image
        signaturePageIndex = currentPageIndex
        signatureNormalizedRect = CGRect(x: 0.52, y: 0.78, width: 0.38, height: 0.12)
    }

    private func saveAndPlaceSignature(_ image: UIImage?, name: String) {
        guard let image else { return }
        placeSignature(image)
        try? StorageService.saveSignature(name: name, image: image)
        savedSignatures = StorageService.loadSignatures()
    }

    private func loadPDF(from url: URL) {
        errorMessage = nil
        signatureImage = nil
        applyToAllPages = false

        do {
            let data = try Data(contentsOf: url)
            guard let document = PDFDocument(data: data), document.pageCount > 0 else {
                throw PDFServiceError.invalidPDF
            }
            pdfDocument = document
            pdfData = data
            pdfURL = try PDFService.writeTemporaryPDF(
                data,
                filename: url.deletingPathExtension().lastPathComponent
            )
            currentPageIndex = 0
            signaturePageIndex = 0
        } catch {
            pdfDocument = nil
            pdfData = nil
            pdfURL = nil
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    @MainActor
    private func exportSignedPDF() async {
        guard let pdfData, let signatureImage else { return }
        isProcessing = true
        errorMessage = nil
        defer { isProcessing = false }

        do {
            let data = pdfData
            let signature = signatureImage
            let pageIndex = signaturePageIndex
            let rect = signatureNormalizedRect
            let applyAll = applyToAllPages
            let baseName = pdfURL?.deletingPathExtension().lastPathComponent ?? "signed-document"

            let signedData = try await Task.detached(priority: .userInitiated) {
                try PDFService.stampSignature(
                    on: data,
                    signatureImage: signature,
                    pageIndex: pageIndex,
                    normalizedRect: rect,
                    applyToAllPages: applyAll
                )
            }.value

            exportedURL = try PDFService.writeTemporaryPDF(signedData, filename: "\(baseName)-signed")
            showShareSheet = true
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }
}

struct PageSignatureOverlay: View {
    let pageImage: UIImage
    let signatureImage: UIImage?
    @Binding var normalizedRect: CGRect

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Image(uiImage: pageImage)
                    .resizable()
                    .scaledToFit()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                if let signatureImage {
                    signatureView(signatureImage, in: geometry.size)
                }
            }
        }
        .aspectRatio(pageImage.size, contentMode: .fit)
    }

    private func signatureView(_ image: UIImage, in size: CGSize) -> some View {
        let frame = viewRect(from: normalizedRect, in: size)
        return Image(uiImage: image)
            .resizable()
            .scaledToFit()
            .frame(width: frame.width, height: frame.height)
            .position(x: frame.midX, y: frame.midY)
            .gesture(
                DragGesture()
                    .onChanged { value in
                        let halfWidth = normalizedRect.width * size.width / 2
                        let halfHeight = normalizedRect.height * size.height / 2
                        let x = min(max(value.location.x, halfWidth), size.width - halfWidth)
                        let y = min(max(value.location.y, halfHeight), size.height - halfHeight)
                        normalizedRect.origin = CGPoint(
                            x: (x - halfWidth) / size.width,
                            y: (y - halfHeight) / size.height
                        )
                    }
            )
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

struct SignatureCreatorSheet: View {
    let onSave: (UIImage, String) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var tab: SignatureCreatorTab = .type
    @State private var typedName = ""
    @State private var selectedFont: SignatureFontStyle = .script
    @State private var selectedColor: SignatureInkColor = .black
    @State private var penColor: SignatureInkColor = .black
    @State private var hasDrawnStrokes = false
    @State private var hasSaved = false
    @State private var clearNonce = 0
    @State private var saveTrigger = 0
    @StateObject private var canvasController = SignatureCanvasController()

    private var typedPreviewBackground: Color {
        selectedColor == .white ? Color(white: 0.2) : Color.cream200
    }

    private var drawCanvasBackground: UIColor {
        penColor == .white
            ? UIColor(white: 0.2, alpha: 1)
            : UIColor(red: 244 / 255, green: 241 / 255, blue: 234 / 255, alpha: 1)
    }

    var body: some View {
        VStack(spacing: 0) {
            sheetHeader

            Picker("Mode", selection: $tab) {
                ForEach(SignatureCreatorTab.allCases) { mode in
                    Text(mode.label).tag(mode)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 8)

            ScrollView {
                VStack(spacing: 20) {
                    switch tab {
                    case .type:
                        typeSignatureContent
                    case .draw:
                        drawSignatureContent
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
            }
        }
        .background(Color.paper)
        .presentationDetents(tab == .draw ? [.height(540)] : [.large])
        .presentationDragIndicator(.visible)
    }

    private var sheetHeader: some View {
        ZStack {
            Text("Create Signature")
                .font(.sectionTitle)
                .foregroundStyle(Color.ink)

            HStack {
                Button("Cancel") { dismiss() }
                    .font(.bodyText)
                    .foregroundStyle(Color.forest)
                Spacer()
            }
        }
        .padding(.horizontal, 20)
        .frame(height: 44)
        .padding(.top, 8)
    }

    private var typeSignatureContent: some View {
        VStack(spacing: 20) {
            typedSignaturePreviewCard

            FormField(title: "Type your name", text: $typedName)

            VStack(alignment: .leading, spacing: 8) {
                Text("Color")
                    .font(.captionText)
                    .foregroundStyle(Color.sandLight)
                SignatureColorPicker(selection: $selectedColor)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Style")
                    .font(.captionText)
                    .foregroundStyle(Color.sandLight)
                ForEach(SignatureFontStyle.allCases) { font in
                    Button {
                        selectedFont = font
                    } label: {
                        HStack {
                            Text(font.label)
                                .font(.captionText.weight(.semibold))
                                .foregroundStyle(Color.sandLight)
                            Spacer()
                            if selectedFont == font {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(Color.forest)
                            }
                        }
                        .padding(12)
                        .background(selectedFont == font ? Color.forest50 : Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(selectedFont == font ? Color.forest : Color.cream200, lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                    .tint(.primary)
                }
            }

            PrimaryButton(
                title: "Use Signature",
                icon: "checkmark",
                isDisabled: typedName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            ) {
                guard let image = SignatureImageRenderer.typedSignature(
                    text: typedName,
                    fontStyle: selectedFont,
                    color: selectedColor
                ) else { return }
                onSave(image, typedName.trimmingCharacters(in: .whitespacesAndNewlines))
                dismiss()
            }
        }
    }

    private var typedSignaturePreviewCard: some View {
        let previewText = typedName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            ? "Your Name"
            : typedName

        return VStack(spacing: 8) {
            Text("Preview")
                .font(.captionText)
                .foregroundStyle(Color.sandLight)
                .frame(maxWidth: .infinity, alignment: .leading)

            Text(previewText)
                .font(.custom(selectedFont.fontName, size: 36))
                .foregroundColor(selectedColor.swiftUIColor)
                .lineLimit(1)
                .minimumScaleFactor(0.4)
                .frame(maxWidth: .infinity)
                .frame(height: 72)
        }
        .padding(16)
        .background(typedPreviewBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.forest.opacity(0.2), lineWidth: 1)
        )
        .id("\(selectedFont.id)-\(selectedColor.id)")
    }

    private var drawSignatureContent: some View {
        VStack(spacing: 16) {
            signatureDrawingCanvas

            Text("Select a pen color below before signing if you want anything other than black.")
                .font(.caption2)
                .foregroundStyle(Color.sandLight)
                .multilineTextAlignment(.center)

            Text("Your signature saves automatically when you finish drawing.")
                .font(.caption2)
                .foregroundStyle(Color.sandLight)
                .multilineTextAlignment(.center)

            VStack(alignment: .leading, spacing: 8) {
                Text("Pen color")
                    .font(.captionText)
                    .foregroundStyle(Color.sandLight)
                SignatureColorPicker(selection: $penColor)
            }

            HStack(spacing: 12) {
                PrimaryButton(title: "Clear", icon: "arrow.counterclockwise") {
                    clearDrawing()
                }
                PrimaryButton(
                    title: "Done",
                    icon: "checkmark",
                    isDisabled: !hasDrawnStrokes || hasSaved
                ) {
                    saveTrigger += 1
                }
            }
        }
    }

    private var signatureDrawingCanvas: some View {
        ZStack {
            SignatureCanvasRepresentable(
                controller: canvasController,
                penColor: penColor,
                canvasBackgroundColor: drawCanvasBackground,
                clearNonce: clearNonce,
                saveTrigger: saveTrigger,
                onAutoSave: { image in
                    finishDrawnSignature(image)
                },
                onStrokesChanged: { hasDrawnStrokes = $0 }
            )
            .onChange(of: penColor) { _, newColor in
                canvasController.setPenColor(newColor)
            }
            .onAppear {
                canvasController.setPenColor(penColor)
            }

            VStack {
                Spacer()
                if !hasDrawnStrokes {
                    Text("Sign here")
                        .font(.custom(SignatureFontStyle.script.fontName, size: 34))
                        .foregroundStyle(
                            penColor == .white
                                ? Color.white.opacity(0.35)
                                : Color.sandLight.opacity(0.45)
                        )
                        .padding(.bottom, 48)
                }
                Rectangle()
                    .fill(Color.sandLight.opacity(penColor == .white ? 0.5 : 0.35))
                    .frame(height: 1)
                    .padding(.horizontal, 32)
                    .padding(.bottom, 32)
            }
            .allowsHitTesting(false)
        }
        .frame(height: 220)
        .background(penColor == .white ? Color(white: 0.2) : Color.cream200)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.forest.opacity(0.25), lineWidth: 1)
        )
        .accessibilityLabel("Signature drawing area")
    }

    private func finishDrawnSignature(_ image: UIImage) {
        guard !hasSaved else { return }
        hasSaved = true
        onSave(image, "Drawn signature")
        dismiss()
    }

    private func clearDrawing() {
        clearNonce += 1
        hasDrawnStrokes = false
        hasSaved = false
    }
}

struct SignatureColorPicker: View {
    @Binding var selection: SignatureInkColor

    var body: some View {
        HStack(spacing: 10) {
            ForEach(SignatureInkColor.allCases) { color in
                Button {
                    selection = color
                } label: {
                    Circle()
                        .fill(color.swiftUIColor)
                        .frame(width: 28, height: 28)
                        .overlay(
                            Circle()
                                .stroke(selection == color ? Color.forest : Color.cream200, lineWidth: selection == color ? 2 : 1)
                        )
                        .overlay {
                            if color == .white {
                                Circle()
                                    .stroke(Color.sandLight.opacity(0.5), lineWidth: 1)
                            }
                        }
                }
                .buttonStyle(.plain)
                .accessibilityLabel(color.label)
            }
        }
    }
}

@MainActor
final class SignatureCanvasController: ObservableObject {
    weak var canvasView: PKCanvasView?
    private var currentPenColor: SignatureInkColor?

    func attach(_ canvasView: PKCanvasView) {
        self.canvasView = canvasView
        if let currentPenColor {
            applyPenColor(currentPenColor, to: canvasView)
        }
    }

    func setPenColor(_ color: SignatureInkColor) {
        currentPenColor = color
        guard let canvasView else { return }
        applyPenColor(color, to: canvasView)
    }

    private func applyPenColor(_ color: SignatureInkColor, to canvasView: PKCanvasView) {
        canvasView.tool = PKInkingTool(.pen, color: color.uiColor, width: 3)
    }
}

struct SignatureCanvasRepresentable: UIViewRepresentable {
    var controller: SignatureCanvasController
    var penColor: SignatureInkColor
    var canvasBackgroundColor: UIColor
    var clearNonce: Int
    var saveTrigger: Int
    var onAutoSave: (UIImage) -> Void
    var onStrokesChanged: (Bool) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(onAutoSave: onAutoSave, onStrokesChanged: onStrokesChanged)
    }

    func makeUIView(context: Context) -> PKCanvasView {
        let canvasView = PKCanvasView()
        canvasView.drawingPolicy = .anyInput
        canvasView.backgroundColor = canvasBackgroundColor
        canvasView.isOpaque = true
        canvasView.delegate = context.coordinator
        context.coordinator.canvasView = canvasView
        context.coordinator.lastClearNonce = clearNonce
        context.coordinator.lastSaveTrigger = saveTrigger
        controller.attach(canvasView)
        controller.setPenColor(penColor)
        return canvasView
    }

    func updateUIView(_ uiView: PKCanvasView, context: Context) {
        uiView.backgroundColor = canvasBackgroundColor
        controller.attach(uiView)
        controller.setPenColor(penColor)

        if context.coordinator.lastClearNonce != clearNonce {
            context.coordinator.lastClearNonce = clearNonce
            context.coordinator.clearCanvas()
        }

        if context.coordinator.lastSaveTrigger != saveTrigger {
            context.coordinator.lastSaveTrigger = saveTrigger
            context.coordinator.performSave()
        }
    }

    final class Coordinator: NSObject, PKCanvasViewDelegate {
        var onAutoSave: (UIImage) -> Void
        var onStrokesChanged: (Bool) -> Void
        weak var canvasView: PKCanvasView?
        var lastClearNonce = 0
        var lastSaveTrigger = 0
        var debounceWorkItem: DispatchWorkItem?
        var hasSaved = false

        init(onAutoSave: @escaping (UIImage) -> Void, onStrokesChanged: @escaping (Bool) -> Void) {
            self.onAutoSave = onAutoSave
            self.onStrokesChanged = onStrokesChanged
        }

        func canvasViewDrawingDidChange(_ canvasView: PKCanvasView) {
            debounceWorkItem?.cancel()
            onStrokesChanged(!canvasView.drawing.strokes.isEmpty)
        }

        func canvasViewDidEndUsingTool(_ canvasView: PKCanvasView) {
            scheduleAutoSave(on: canvasView)
        }

        func clearCanvas() {
            cancelAutoSave()
            hasSaved = false
            canvasView?.drawing = PKDrawing()
            onStrokesChanged(false)
        }

        func performSave() {
            guard let canvasView, !hasSaved else { return }
            cancelAutoSave()
            saveDrawing(from: canvasView)
        }

        private func scheduleAutoSave(on canvasView: PKCanvasView) {
            guard !canvasView.drawing.strokes.isEmpty, !hasSaved else { return }

            debounceWorkItem?.cancel()
            let work = DispatchWorkItem { [weak self] in
                guard let self, let canvasView = self.canvasView, !self.hasSaved else { return }
                guard !canvasView.drawing.strokes.isEmpty else { return }
                self.saveDrawing(from: canvasView)
            }
            debounceWorkItem = work
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0, execute: work)
        }

        private func saveDrawing(from canvasView: PKCanvasView) {
            guard !hasSaved else { return }
            hasSaved = true
            let image = canvasView.drawing.image(from: canvasView.bounds, scale: 2)
            onAutoSave(image)
        }

        private func cancelAutoSave() {
            debounceWorkItem?.cancel()
            debounceWorkItem = nil
        }
    }
}
