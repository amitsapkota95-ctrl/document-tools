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
    static let mvpSlugs: Set<ToolSlug> = Set(ToolSlug.allCases)

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
                    slug: .splitPdf,
                    title: "Split a PDF",
                    description: "Separate pages into individual files.",
                    actionLabel: "Split PDF",
                    iconName: "scissors",
                    isAvailableInMVP: true
                ),
                ToolDefinition(
                    slug: .compressPdf,
                    title: "Make File Smaller",
                    description: "Reduce PDF file size while keeping documents readable.",
                    actionLabel: "Make Smaller",
                    iconName: "arrow.down.right.and.arrow.up.left",
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
                    slug: .pdfToImage,
                    title: "PDF to Image",
                    description: "Save each PDF page as a PNG or JPEG image.",
                    actionLabel: "Convert to Images",
                    iconName: "photo.on.rectangle.angled",
                    isAvailableInMVP: true
                ),
                ToolDefinition(
                    slug: .redactPdf,
                    title: "Redact PDF",
                    description: "Cover sensitive information with black boxes.",
                    actionLabel: "Redact PDF",
                    iconName: "eye.slash",
                    isAvailableInMVP: true
                ),
                ToolDefinition(
                    slug: .cropPdf,
                    title: "Crop PDF",
                    description: "Trim margins or keep part of each page.",
                    actionLabel: "Crop PDF",
                    iconName: "crop",
                    isAvailableInMVP: true
                ),
                ToolDefinition(
                    slug: .extractText,
                    title: "Extract Text",
                    description: "Pull text from PDFs with OCR fallback.",
                    actionLabel: "Extract Text",
                    iconName: "text.viewfinder",
                    isAvailableInMVP: true
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
                    isAvailableInMVP: true
                ),
                ToolDefinition(
                    slug: .invoiceBuilder,
                    title: "Build an Invoice",
                    description: "Create invoices and export searchable PDFs.",
                    actionLabel: "Build Invoice",
                    iconName: "doc.text",
                    isAvailableInMVP: true
                ),
                ToolDefinition(
                    slug: .teleprompter,
                    title: "Teleprompter",
                    description: "Read scripts with voice tracking, themes, and section markers.",
                    actionLabel: "Open Teleprompter",
                    iconName: "text.viewfinder",
                    isAvailableInMVP: true
                ),
            ]
        ),
    ]

    static var allTools: [ToolDefinition] {
        categories.flatMap(\.tools)
    }

    static let homeFeaturedSlugs: [ToolSlug] = [
        .documentScanner,
        .mergePdf,
        .splitPdf,
        .compressPdf,
        .fillAndSign,
        .qrTools,
    ]

    static var homeFeaturedTools: [ToolDefinition] {
        homeFeaturedSlugs.compactMap { tool(for: $0) }
    }

    static var availableTools: [ToolDefinition] {
        allTools.filter(\.isAvailableInMVP)
    }

    static var comingSoonTools: [ToolDefinition] {
        allTools.filter { !$0.isAvailableInMVP }
    }

    static func category(for slug: ToolSlug) -> ToolCategoryID? {
        categories.first { $0.tools.contains { $0.slug == slug } }?.id
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
    case splitPdf
    case compressPdf
    case pdfToImage
    case fillAndSign
    case imageToPdf
    case redactPdf
    case cropPdf
    case extractText
    case compareText
    case invoiceBuilder
    case teleprompter
    case qrScanner
}
