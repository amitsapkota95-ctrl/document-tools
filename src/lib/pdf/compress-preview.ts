"use client";

import type { PDFPageProxy } from "pdfjs-dist";
import { loadPdfDocument } from "@/lib/pdf/load-pdfjs";
import type { PdfDiagnostics } from "@/lib/pdf/pdf-diagnostics";
import {
  estimatePdfWrapperOverhead,
  getCompressionJpegQuality,
  getCompressionRenderScale,
} from "@/lib/pdf/compress-shared";

export interface CompressSizeEstimate {
  estimatedBytes: number;
  mayIncrease: boolean;
}

export interface CompressEstimateOptions {
  quality: number;
  crushImages: boolean;
  stripMetadata: boolean;
  imageDpi: number;
  password?: string;
  diagnostics?: PdfDiagnostics | null;
}

function samplePageNumbers(total: number): number[] {
  if (total <= 0) return [];
  if (total === 1) return [1];
  if (total === 2) return [1, 2];
  return [1, Math.ceil(total / 2), total];
}

async function rasterizePageToJpegBytes(
  page: PDFPageProxy,
  imageDpi: number,
  qualityNorm: number,
): Promise<number> {
  const scale = getCompressionRenderScale(imageDpi);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas for estimate.");

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Could not encode JPEG."))),
      "image/jpeg",
      getCompressionJpegQuality(qualityNorm),
    );
  });

  return blob.size;
}

function estimateWithoutCrush(
  originalSize: number,
  stripMetadata: boolean,
  diagnostics?: PdfDiagnostics | null,
): CompressSizeEstimate {
  if (!stripMetadata) {
    return {
      estimatedBytes: Math.round(originalSize * 0.98),
      mayIncrease: false,
    };
  }

  const metaFraction = diagnostics ? diagnostics.metadataPct / 100 : 0.02;
  const savedBytes = originalSize * metaFraction + 1024;
  const estimatedBytes = Math.round(Math.max(originalSize * 0.94, originalSize - savedBytes));

  return { estimatedBytes, mayIncrease: false };
}

export async function estimateCompressedSize(
  file: File,
  options: CompressEstimateOptions,
): Promise<CompressSizeEstimate> {
  if (!options.crushImages) {
    return estimateWithoutCrush(file.size, options.stripMetadata, options.diagnostics);
  }

  const pdf = await loadPdfDocument(file, options.password);
  const pageCount = pdf.numPages;
  const samples = samplePageNumbers(pageCount);

  let sampledJpegBytes = 0;
  for (const pageNumber of samples) {
    const page = await pdf.getPage(pageNumber);
    sampledJpegBytes += await rasterizePageToJpegBytes(
      page,
      options.imageDpi,
      options.quality,
    );
  }

  const avgJpegBytes = sampledJpegBytes / samples.length;
  const estimatedBytes = Math.round(
    avgJpegBytes * pageCount + estimatePdfWrapperOverhead(pageCount),
  );

  return {
    estimatedBytes,
    mayIncrease: estimatedBytes >= file.size * 0.95,
  };
}
