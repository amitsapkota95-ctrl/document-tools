"use client";

import { loadPdfDocumentFromBytes } from "@/lib/pdf/load-pdfjs";
import { loadPdfDocumentWithLib } from "@/lib/pdf/load-pdf-lib";
import {
  getCompressionJpegQuality,
  getCompressionRenderScale,
} from "@/lib/pdf/compress-shared";

export interface CompressPdfOptions {
  quality: number;
  crushImages: boolean;
  stripMetadata: boolean;
  imageDpi: number;
  password?: string;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer;
}

function stripDocumentMetadata(doc: Awaited<ReturnType<typeof loadPdfDocumentWithLib>>) {
  doc.setTitle("");
  doc.setAuthor("");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setProducer("paperless.tools");
  doc.setCreator("paperless.tools");
}

async function compressWithoutCrush(
  pdfBytes: ArrayBuffer,
  stripMetadata: boolean,
  password?: string,
): Promise<ArrayBuffer> {
  const doc = await loadPdfDocumentWithLib(pdfBytes, password);
  if (stripMetadata) {
    stripDocumentMetadata(doc);
  }
  return toArrayBuffer(await doc.save({ useObjectStreams: true }));
}

async function compressWithCrush(
  pdfBytes: ArrayBuffer,
  options: CompressPdfOptions,
  onProgress?: (value: number, message?: string) => void,
): Promise<ArrayBuffer> {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await loadPdfDocumentFromBytes(pdfBytes, options.password);
  const total = pdf.numPages;
  const outDoc = await PDFDocument.create();
  const scale = getCompressionRenderScale(options.imageDpi);
  const jpegQuality = getCompressionJpegQuality(options.quality);

  for (let pageNumber = 1; pageNumber <= total; pageNumber++) {
    onProgress?.(
      Math.round((pageNumber / total) * 90),
      `Compressing page ${pageNumber} of ${total}…`,
    );

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not create canvas for compression.");
    }

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    const jpegBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode JPEG."))),
        "image/jpeg",
        jpegQuality,
      );
    });

    const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
    const embedded = await outDoc.embedJpg(jpegBytes);
    const outPage = outDoc.addPage([viewport.width, viewport.height]);
    outPage.drawImage(embedded, {
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });
  }

  if (options.stripMetadata) {
    outDoc.setProducer("paperless.tools");
    outDoc.setCreator("paperless.tools");
  }

  onProgress?.(95, "Saving compressed PDF…");
  return toArrayBuffer(await outDoc.save({ useObjectStreams: true }));
}

export async function compressPdfBytes(
  pdfBytes: ArrayBuffer,
  options: CompressPdfOptions,
  onProgress?: (value: number, message?: string) => void,
): Promise<ArrayBuffer> {
  if (!options.crushImages) {
    onProgress?.(40, "Optimizing PDF structure…");
    return compressWithoutCrush(pdfBytes, options.stripMetadata, options.password);
  }

  return compressWithCrush(pdfBytes, options, onProgress);
}
