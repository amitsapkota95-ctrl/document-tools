package tools.paperless.app.services

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.RectF
import android.graphics.pdf.PdfDocument
import android.net.Uri
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.pdmodel.PDPage
import com.tom_roush.pdfbox.pdmodel.PDPageContentStream
import com.tom_roush.pdfbox.pdmodel.common.PDRectangle
import com.tom_roush.pdfbox.pdmodel.graphics.image.JPEGFactory
import com.tom_roush.pdfbox.rendering.PDFRenderer
import com.tom_roush.pdfbox.text.PDFTextStripper
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream

enum class PdfPageSize(val label: String, val width: Float, val height: Float) {
    FIT("Fit to image", 0f, 0f),
    A4("A4", 595.28f, 841.89f),
    LETTER("Letter", 612f, 792f),
}

enum class ExportImageFormat(val label: String, val extension: String, val compressFormat: Bitmap.CompressFormat) {
    PNG("PNG", "png", Bitmap.CompressFormat.PNG),
    JPEG("JPEG", "jpg", Bitmap.CompressFormat.JPEG),
}

enum class SplitMode(val label: String) {
    SELECTED_PAGES("Selected pages"),
    EVERY_PAGE("Every page"),
    BY_INTERVAL("Every N pages"),
}

sealed class PdfServiceError(message: String) : Exception(message) {
    class InvalidPdf : PdfServiceError("Could not read the PDF file.")
    class MergeFailed : PdfServiceError("Could not merge PDF files.")
    class SplitFailed : PdfServiceError("Could not split the PDF.")
    class ExportFailed : PdfServiceError("Could not export the PDF.")
    class NoPages : PdfServiceError("No pages to export.")
    class InvalidInterval : PdfServiceError("Enter a page interval of at least 1.")
    class CompressFailed : PdfServiceError("Could not compress the PDF.")
    class CropFailed : PdfServiceError("Could not crop the PDF.")
    class RedactFailed : PdfServiceError("Could not redact the PDF.")
}

object PdfService {
    fun mergePdfs(context: Context, uris: List<Uri>): ByteArray {
        if (uris.isEmpty()) throw PdfServiceError.NoPages()

        val merged = PDDocument()
        try {
            for (uri in uris) {
                context.contentResolver.openInputStream(uri)?.use { input ->
                    PDDocument.load(input).use { source ->
                        for (page in source.pages) {
                            merged.importPage(page)
                        }
                    }
                } ?: throw PdfServiceError.InvalidPdf()
            }

            if (merged.numberOfPages == 0) throw PdfServiceError.MergeFailed()

            return ByteArrayOutputStream().use { output ->
                merged.save(output)
                output.toByteArray()
            }
        } catch (e: PdfServiceError) {
            throw e
        } catch (_: Exception) {
            throw PdfServiceError.MergeFailed()
        } finally {
            merged.close()
        }
    }

    fun imagesToPdf(bitmaps: List<Bitmap>, pageSize: PdfPageSize): ByteArray {
        if (bitmaps.isEmpty()) throw PdfServiceError.NoPages()

        val document = PdfDocument()
        try {
            for (bitmap in bitmaps) {
                val pageRect = if (pageSize == PdfPageSize.FIT) {
                    android.graphics.Rect(0, 0, bitmap.width, bitmap.height)
                } else {
                    android.graphics.Rect(0, 0, pageSize.width.toInt(), pageSize.height.toInt())
                }

                val pageInfo = PdfDocument.PageInfo.Builder(
                    pageRect.width(),
                    pageRect.height(),
                    document.pages.size + 1,
                ).create()

                val page = document.startPage(pageInfo)
                val canvas = page.canvas
                val drawRect = aspectFitRect(bitmap.width, bitmap.height, pageRect.width(), pageRect.height())
                canvas.drawBitmap(bitmap, null, drawRect, null)
                document.finishPage(page)
            }

            return ByteArrayOutputStream().use { output ->
                document.writeTo(output)
                output.toByteArray()
            }
        } catch (_: Exception) {
            throw PdfServiceError.ExportFailed()
        } finally {
            document.close()
        }
    }

    fun splitEveryPage(context: Context, uri: Uri, baseName: String): List<Pair<String, ByteArray>> {
        val document = loadDocument(context, uri)
        val results = mutableListOf<Pair<String, ByteArray>>()

        try {
            for (index in 0 until document.numberOfPages) {
                val single = PDDocument()
                try {
                    single.importPage(document.getPage(index))
                    val name = "${sanitizeFilename(baseName)}_page_${index + 1}.pdf"
                    val data = ByteArrayOutputStream().use { output ->
                        single.save(output)
                        output.toByteArray()
                    }
                    results.add(name to data)
                } finally {
                    single.close()
                }
            }
        } finally {
            document.close()
        }

        if (results.isEmpty()) throw PdfServiceError.SplitFailed()
        return results
    }

    fun splitByInterval(context: Context, uri: Uri, interval: Int, baseName: String): List<Pair<String, ByteArray>> {
        if (interval < 1) throw PdfServiceError.InvalidInterval()

        val document = loadDocument(context, uri)
        val results = mutableListOf<Pair<String, ByteArray>>()

        try {
            var chunkIndex = 1
            var start = 0
            while (start < document.numberOfPages) {
                val end = minOf(start + interval, document.numberOfPages)
                val chunk = PDDocument()
                try {
                    for (pageIndex in start until end) {
                        chunk.importPage(document.getPage(pageIndex))
                    }
                    val name = "${sanitizeFilename(baseName)}_part_$chunkIndex.pdf"
                    val data = ByteArrayOutputStream().use { output ->
                        chunk.save(output)
                        output.toByteArray()
                    }
                    results.add(name to data)
                } finally {
                    chunk.close()
                }
                start = end
                chunkIndex++
            }
        } finally {
            document.close()
        }

        if (results.isEmpty()) throw PdfServiceError.SplitFailed()
        return results
    }

    fun pdfToImages(context: Context, uri: Uri, format: ExportImageFormat, dpi: Float = 150f): List<Pair<String, ByteArray>> {
        val document = loadDocument(context, uri)
        val renderer = PDFRenderer(document)
        val results = mutableListOf<Pair<String, ByteArray>>()

        try {
            for (index in 0 until document.numberOfPages) {
                val bitmap = renderer.renderImageWithDPI(index, dpi)
                val name = "page_${index + 1}.${format.extension}"
                val data = ByteArrayOutputStream().use { output ->
                    bitmap.compress(format.compressFormat, if (format == ExportImageFormat.JPEG) 90 else 100, output)
                    output.toByteArray()
                }
                results.add(name to data)
            }
        } finally {
            document.close()
        }

        if (results.isEmpty()) throw PdfServiceError.ExportFailed()
        return results
    }

    fun extractText(context: Context, uri: Uri): String {
        val document = loadDocument(context, uri)
        return try {
            PDFTextStripper().getText(document).trim()
        } finally {
            document.close()
        }
    }

    fun compressPdf(context: Context, uri: Uri, quality: Int = 75): ByteArray {
        val document = loadDocument(context, uri)
        val renderer = PDFRenderer(document)
        val output = PDDocument()

        try {
            for (index in 0 until document.numberOfPages) {
                val sourcePage = document.getPage(index)
                val mediaBox = sourcePage.mediaBox
                val bitmap = renderer.renderImageWithDPI(index, 150f)

                val page = PDPage(PDRectangle(mediaBox.width, mediaBox.height))
                output.addPage(page)

                val image = JPEGFactory.createFromImage(output, bitmap, quality / 100f)
                PDPageContentStream(output, page).use { contentStream ->
                    contentStream.drawImage(image, 0f, 0f, mediaBox.width, mediaBox.height)
                }
            }

            return ByteArrayOutputStream().use { stream ->
                output.save(stream)
                stream.toByteArray()
            }
        } catch (_: Exception) {
            throw PdfServiceError.CompressFailed()
        } finally {
            output.close()
            document.close()
        }
    }

    fun redactPdf(
        context: Context,
        uri: Uri,
        redactions: List<RectF>,
        pageIndex: Int,
    ): ByteArray {
        val document = loadDocument(context, uri)
        if (pageIndex < 0 || pageIndex >= document.numberOfPages) {
            document.close()
            throw PdfServiceError.InvalidPdf()
        }

        try {
            val page = document.getPage(pageIndex)
            val mediaBox = page.mediaBox

            PDPageContentStream(document, page, PDPageContentStream.AppendMode.APPEND, true, true).use { stream ->
                for (rect in redactions) {
                    val pdfRect = RectF(
                        rect.left * mediaBox.width,
                        mediaBox.height - rect.bottom * mediaBox.height,
                        rect.right * mediaBox.width,
                        mediaBox.height - rect.top * mediaBox.height,
                    )
                    stream.setNonStrokingColor(0f, 0f, 0f)
                    stream.addRect(pdfRect.left, pdfRect.bottom, pdfRect.width(), pdfRect.height())
                    stream.fill()
                }
            }

            return ByteArrayOutputStream().use { output ->
                document.save(output)
                output.toByteArray()
            }
        } catch (_: Exception) {
            throw PdfServiceError.RedactFailed()
        } finally {
            document.close()
        }
    }

    fun loadBitmapFromUri(context: Context, uri: Uri): Bitmap? =
        context.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it) }

    fun pageCount(context: Context, uri: Uri): Int {
        val document = loadDocument(context, uri)
        return try {
            document.numberOfPages
        } finally {
            document.close()
        }
    }

    fun writeTemporaryFile(context: Context, data: ByteArray, filename: String): Uri {
        val file = File(context.cacheDir, sanitizeFilename(filename))
        FileOutputStream(file).use { it.write(data) }
        return Uri.fromFile(file)
    }

    fun writeTemporaryPdf(context: Context, data: ByteArray, filename: String): Uri =
        writeTemporaryFile(context, data, "${sanitizeFilename(filename)}.pdf")

    private fun loadDocument(context: Context, uri: Uri): PDDocument {
        val input = context.contentResolver.openInputStream(uri)
            ?: throw PdfServiceError.InvalidPdf()
        return try {
            val doc = PDDocument.load(input)
            if (doc.numberOfPages == 0) {
                doc.close()
                throw PdfServiceError.InvalidPdf()
            }
            doc
        } catch (e: PdfServiceError) {
            throw e
        } catch (_: Exception) {
            throw PdfServiceError.InvalidPdf()
        } finally {
            input.close()
        }
    }

    private fun aspectFitRect(srcW: Int, srcH: Int, dstW: Int, dstH: Int): RectF {
        val srcRatio = srcW.toFloat() / srcH
        val dstRatio = dstW.toFloat() / dstH
        return if (srcRatio > dstRatio) {
            val height = dstW / srcRatio
            val top = (dstH - height) / 2f
            RectF(0f, top, dstW.toFloat(), top + height)
        } else {
            val width = dstH * srcRatio
            val left = (dstW - width) / 2f
            RectF(left, 0f, left + width, dstH.toFloat())
        }
    }

    private fun sanitizeFilename(name: String): String =
        name.replace(Regex("[^a-zA-Z0-9._-]"), "_").ifBlank { "document" }
}
