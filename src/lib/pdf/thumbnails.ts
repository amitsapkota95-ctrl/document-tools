"use client";

import { loadPdfDocument } from "@/lib/pdf/load-pdfjs";
import { renderPdfPageToDataUrl } from "@/lib/pdf/render-page-to-canvas";

export async function renderPdfPageThumbnail(
  file: File,
  pageIndex = 0,
  scale = 0.3,
  password?: string,
  rotation = 0,
): Promise<string> {
  const pdf = await loadPdfDocument(file, password);
  const page = await pdf.getPage(pageIndex + 1);
  return renderPdfPageToDataUrl(page, scale, 0.8, rotation);
}

export async function renderAllPageThumbnails(
  file: File,
  scale = 0.25,
  onProgress?: (current: number, total: number) => void,
  password?: string,
): Promise<string[]> {
  const pdf = await loadPdfDocument(file, password);
  const total = pdf.numPages;
  const thumbs: string[] = [];

  for (let i = 1; i <= total; i++) {
    onProgress?.(i, total);
    const page = await pdf.getPage(i);
    thumbs.push(await renderPdfPageToDataUrl(page, scale));
  }

  return thumbs;
}
