package tools.paperless.app.models

enum class ToolSlug(val rawValue: String) {
    MERGE_PDF("merge-pdf"),
    SPLIT_PDF("split-pdf"),
    COMPRESS_PDF("compress-pdf"),
    IMAGE_TO_PDF("image-to-pdf"),
    PDF_TO_IMAGE("pdf-to-image"),
    FILL_AND_SIGN("fill-and-sign"),
    REDACT_PDF("redact-pdf"),
    CROP_PDF("crop-pdf"),
    EXTRACT_TEXT("extract-text-from-pdf"),
    COMPARE_TEXT("compare-text"),
    INVOICE_BUILDER("invoice-builder"),
    TELEPROMPTER("teleprompter"),
    QR_TOOLS("qr-tools"),
    URL_SHORTENER("url-shortener"),
    DOCUMENT_SCANNER("document-scanner"),
}

enum class ToolCategoryId {
    PDF,
    CONTENT,
    UTILITIES,
}

data class ToolDefinition(
    val slug: ToolSlug,
    val title: String,
    val description: String,
    val actionLabel: String,
    val iconName: String,
    val isAvailableInMvp: Boolean = true,
)

data class ToolCategory(
    val id: ToolCategoryId,
    val title: String,
    val tools: List<ToolDefinition>,
)

object ToolRegistry {
    val categories: List<ToolCategory> = listOf(
        ToolCategory(
            id = ToolCategoryId.PDF,
            title = "PDF Tools",
            tools = listOf(
                ToolDefinition(
                    slug = ToolSlug.DOCUMENT_SCANNER,
                    title = "Scan Document",
                    description = "Capture pages with auto-crop and save as PDF.",
                    actionLabel = "Scan",
                    iconName = "doc_scanner",
                ),
                ToolDefinition(
                    slug = ToolSlug.MERGE_PDF,
                    title = "Combine PDF Files",
                    description = "Join multiple PDFs into one document in the order you choose.",
                    actionLabel = "Combine PDFs",
                    iconName = "merge",
                ),
                ToolDefinition(
                    slug = ToolSlug.SPLIT_PDF,
                    title = "Split a PDF",
                    description = "Separate pages into individual files.",
                    actionLabel = "Split PDF",
                    iconName = "content_cut",
                ),
                ToolDefinition(
                    slug = ToolSlug.COMPRESS_PDF,
                    title = "Make File Smaller",
                    description = "Reduce PDF file size while keeping documents readable.",
                    actionLabel = "Make Smaller",
                    iconName = "compress",
                ),
                ToolDefinition(
                    slug = ToolSlug.FILL_AND_SIGN,
                    title = "Fill & Sign PDF",
                    description = "Add your signature and text to any PDF page.",
                    actionLabel = "Sign PDF",
                    iconName = "draw",
                ),
                ToolDefinition(
                    slug = ToolSlug.IMAGE_TO_PDF,
                    title = "Turn Images into PDF",
                    description = "Convert photos into a single PDF document.",
                    actionLabel = "Create PDF",
                    iconName = "image",
                ),
                ToolDefinition(
                    slug = ToolSlug.PDF_TO_IMAGE,
                    title = "PDF to Image",
                    description = "Save each PDF page as a PNG or JPEG image.",
                    actionLabel = "Convert to Images",
                    iconName = "photo_library",
                ),
                ToolDefinition(
                    slug = ToolSlug.REDACT_PDF,
                    title = "Redact PDF",
                    description = "Cover sensitive information with black boxes.",
                    actionLabel = "Redact PDF",
                    iconName = "visibility_off",
                ),
                ToolDefinition(
                    slug = ToolSlug.CROP_PDF,
                    title = "Crop PDF",
                    description = "Trim margins or keep part of each page.",
                    actionLabel = "Crop PDF",
                    iconName = "crop",
                ),
                ToolDefinition(
                    slug = ToolSlug.EXTRACT_TEXT,
                    title = "Extract Text",
                    description = "Pull text from PDFs with OCR fallback.",
                    actionLabel = "Extract Text",
                    iconName = "text_fields",
                ),
            ),
        ),
        ToolCategory(
            id = ToolCategoryId.UTILITIES,
            title = "Utilities",
            tools = listOf(
                ToolDefinition(
                    slug = ToolSlug.QR_TOOLS,
                    title = "QR Code Generator",
                    description = "Create QR codes for links, WiFi, contacts, and more.",
                    actionLabel = "Open QR Generator",
                    iconName = "qr_code",
                ),
                ToolDefinition(
                    slug = ToolSlug.URL_SHORTENER,
                    title = "Shorten a Link",
                    description = "Create a short link you can share anywhere.",
                    actionLabel = "Shorten Link",
                    iconName = "link",
                ),
            ),
        ),
        ToolCategory(
            id = ToolCategoryId.CONTENT,
            title = "Content Tools",
            tools = listOf(
                ToolDefinition(
                    slug = ToolSlug.COMPARE_TEXT,
                    title = "Compare Two Texts",
                    description = "See what changed between two versions side by side.",
                    actionLabel = "Compare Texts",
                    iconName = "compare_arrows",
                ),
                ToolDefinition(
                    slug = ToolSlug.INVOICE_BUILDER,
                    title = "Build an Invoice",
                    description = "Create invoices and export searchable PDFs.",
                    actionLabel = "Build Invoice",
                    iconName = "receipt_long",
                ),
                ToolDefinition(
                    slug = ToolSlug.TELEPROMPTER,
                    title = "Teleprompter",
                    description = "Read scripts with themes, section markers, and adjustable scroll speed.",
                    actionLabel = "Open Teleprompter",
                    iconName = "subtitles",
                ),
            ),
        ),
    )

    val allTools: List<ToolDefinition> = categories.flatMap { it.tools }

    val homeFeaturedSlugs: List<ToolSlug> = listOf(
        ToolSlug.DOCUMENT_SCANNER,
        ToolSlug.MERGE_PDF,
        ToolSlug.SPLIT_PDF,
        ToolSlug.COMPRESS_PDF,
        ToolSlug.FILL_AND_SIGN,
        ToolSlug.QR_TOOLS,
    )

    val homeFeaturedTools: List<ToolDefinition> =
        homeFeaturedSlugs.mapNotNull { toolFor(it) }

    val availableTools: List<ToolDefinition> =
        allTools.filter { it.isAvailableInMvp }

    val comingSoonTools: List<ToolDefinition> =
        allTools.filterNot { it.isAvailableInMvp }

    fun categoryFor(slug: ToolSlug): ToolCategoryId? =
        categories.firstOrNull { category -> category.tools.any { it.slug == slug } }?.id

    fun toolFor(slug: ToolSlug): ToolDefinition? =
        allTools.firstOrNull { it.slug == slug }
}

enum class ToolDestination {
    QR_TOOLS,
    URL_SHORTENER,
    DOCUMENT_SCANNER,
    MERGE_PDF,
    SPLIT_PDF,
    COMPRESS_PDF,
    PDF_TO_IMAGE,
    FILL_AND_SIGN,
    IMAGE_TO_PDF,
    REDACT_PDF,
    CROP_PDF,
    EXTRACT_TEXT,
    COMPARE_TEXT,
    INVOICE_BUILDER,
    TELEPROMPTER,
    QR_SCANNER,
}

fun destinationFor(slug: ToolSlug): ToolDestination? = when (slug) {
    ToolSlug.QR_TOOLS -> ToolDestination.QR_TOOLS
    ToolSlug.URL_SHORTENER -> ToolDestination.URL_SHORTENER
    ToolSlug.DOCUMENT_SCANNER -> ToolDestination.DOCUMENT_SCANNER
    ToolSlug.MERGE_PDF -> ToolDestination.MERGE_PDF
    ToolSlug.SPLIT_PDF -> ToolDestination.SPLIT_PDF
    ToolSlug.COMPRESS_PDF -> ToolDestination.COMPRESS_PDF
    ToolSlug.PDF_TO_IMAGE -> ToolDestination.PDF_TO_IMAGE
    ToolSlug.FILL_AND_SIGN -> ToolDestination.FILL_AND_SIGN
    ToolSlug.IMAGE_TO_PDF -> ToolDestination.IMAGE_TO_PDF
    ToolSlug.REDACT_PDF -> ToolDestination.REDACT_PDF
    ToolSlug.CROP_PDF -> ToolDestination.CROP_PDF
    ToolSlug.EXTRACT_TEXT -> ToolDestination.EXTRACT_TEXT
    ToolSlug.COMPARE_TEXT -> ToolDestination.COMPARE_TEXT
    ToolSlug.INVOICE_BUILDER -> ToolDestination.INVOICE_BUILDER
    ToolSlug.TELEPROMPTER -> ToolDestination.TELEPROMPTER
}

fun ToolDestination.title(): String = when (this) {
    ToolDestination.QR_TOOLS -> "QR Code Generator"
    ToolDestination.URL_SHORTENER -> "Shorten Link"
    ToolDestination.DOCUMENT_SCANNER -> "Scan Document"
    ToolDestination.MERGE_PDF -> "Combine PDFs"
    ToolDestination.SPLIT_PDF -> "Split PDF"
    ToolDestination.COMPRESS_PDF -> "Make File Smaller"
    ToolDestination.PDF_TO_IMAGE -> "PDF to Image"
    ToolDestination.FILL_AND_SIGN -> "Fill & Sign"
    ToolDestination.IMAGE_TO_PDF -> "Images to PDF"
    ToolDestination.REDACT_PDF -> "Redact PDF"
    ToolDestination.CROP_PDF -> "Crop PDF"
    ToolDestination.EXTRACT_TEXT -> "Extract Text"
    ToolDestination.COMPARE_TEXT -> "Compare Texts"
    ToolDestination.INVOICE_BUILDER -> "Build Invoice"
    ToolDestination.TELEPROMPTER -> "Teleprompter"
    ToolDestination.QR_SCANNER -> "Scan QR Code"
}
