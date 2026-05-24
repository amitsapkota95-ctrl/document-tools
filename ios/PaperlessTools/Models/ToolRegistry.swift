import Foundation

enum ToolSlug: String, CaseIterable, Identifiable {
    case mergePdf = "merge-pdf"
    case splitPdf = "split-pdf"
    case compressPdf = "compress-pdf"
    case imageToPdf = "image-to-pdf"
    case pdfToImage = "pdf-to-image"
    case fillAndSign = "fill-and-sign"
    case redactPdf = "redact-pdf"
    case cropPdf = "crop-pdf"
    case extractText = "extract-text-from-pdf"
    case compareText = "compare-text"
    case invoiceBuilder = "invoice-builder"
    case teleprompter = "teleprompter"
    case qrTools = "qr-tools"
    case urlShortener = "url-shortener"
    case documentScanner = "document-scanner"

    var id: String { rawValue }
}

enum ToolCategoryID: String {
    case pdf
    case content
    case utilities
}

struct ToolDefinition: Identifiable {
    let slug: ToolSlug
    let title: String
    let description: String
    let actionLabel: String
    let iconName: String
    let isAvailableInMVP: Bool

    var id: String { slug.rawValue }
}

struct ToolCategory: Identifiable {
    let id: ToolCategoryID
    let title: String
    let tools: [ToolDefinition]
}

enum ToolRegistry {
    static let mvpSlugs: Set<ToolSlug> = [
        .qrTools,
        .urlShortener,
        .documentScanner,
        .mergePdf,
        .fillAndSign,
        .imageToPdf,
    ]

    static let categories: [ToolCategory] = [
        ToolCategory(
            id: .pdf,
            title: "PDF Tools",
            tools: [
                ToolDefinition(
                    slug: .documentScanner,
                    title: "Scan Document",
                    description: "Capture pages with auto-crop and save as PDF.",
                    actionLabel: "Scan",
                    iconName: "doc.viewfinder",
                    isAvailableInMVP: true
                ),
                ToolDefinition(
                    slug: .mergePdf,
                    title: "Combine PDF Files",
                    description: "Join multiple PDFs into one document in the order you choose.",
                    actionLabel: "Combine PDFs",
                    iconName: "doc.on.doc",
                    isAvailableInMVP: true
                ),
                ToolDefinition(
                    slug: .fillAndSign,
                    title: "Fill & Sign PDF",
                    description: "Add your signature and text to any PDF page.",
                    actionLabel: "Sign PDF",
                    iconName: "signature",
                    isAvailableInMVP: true
                ),
                ToolDefinition(
                    slug: .imageToPdf,
                    title: "Turn Images into PDF",
                    description: "Convert photos into a single PDF document.",
                    actionLabel: "Create PDF",
                    iconName: "photo.on.rectangle",
                    isAvailableInMVP: true
                ),
                ToolDefinition(
                    slug: .splitPdf,
                    title: "Split a PDF",
                    description: "Separate pages into individual files.",
                    actionLabel: "Split PDF",
                    iconName: "scissors",
                    isAvailableInMVP: false
                ),
                ToolDefinition(
                    slug: .compressPdf,
                    title: "Make File Smaller",
                    description: "Reduce PDF file size while keeping documents readable.",
                    actionLabel: "Make Smaller",
                    iconName: "arrow.down.right.and.arrow.up.left",
                    isAvailableInMVP: false
                ),
            ]
        ),
        ToolCategory(
            id: .utilities,
            title: "Utilities",
            tools: [
                ToolDefinition(
                    slug: .qrTools,
                    title: "QR Code Generator",
                    description: "Create QR codes for links, WiFi, contacts, and more.",
                    actionLabel: "Open QR Generator",
                    iconName: "qrcode",
                    isAvailableInMVP: true
                ),
                ToolDefinition(
                    slug: .urlShortener,
                    title: "Shorten a Link",
                    description: "Create a short link you can share anywhere.",
                    actionLabel: "Shorten Link",
                    iconName: "link",
                    isAvailableInMVP: true
                ),
            ]
        ),
        ToolCategory(
            id: .content,
            title: "Content Tools",
            tools: [
                ToolDefinition(
                    slug: .compareText,
                    title: "Compare Two Texts",
                    description: "See what changed between two versions side by side.",
                    actionLabel: "Compare Texts",
                    iconName: "arrow.left.arrow.right",
                    isAvailableInMVP: false
                ),
                ToolDefinition(
                    slug: .invoiceBuilder,
                    title: "Build an Invoice",
                    description: "Create invoices and export searchable PDFs.",
                    actionLabel: "Build Invoice",
                    iconName: "doc.text",
                    isAvailableInMVP: false
                ),
                ToolDefinition(
                    slug: .teleprompter,
                    title: "Teleprompter",
                    description: "Read scripts with voice tracking and section markers.",
                    actionLabel: "Open Teleprompter",
                    iconName: "text.viewfinder",
                    isAvailableInMVP: false
                ),
            ]
        ),
    ]

    static var allTools: [ToolDefinition] {
        categories.flatMap(\.tools)
    }

    static func tool(for slug: ToolSlug) -> ToolDefinition? {
        allTools.first { $0.slug == slug }
    }
}

enum ToolDestination: Hashable {
    case qrTools
    case urlShortener
    case documentScanner
    case mergePdf
    case fillAndSign
    case imageToPdf
    case qrScanner
}
