import type { PDFPageProxy } from "pdfjs-dist";

export async function renderPdfPageToCanvas(
  page: PDFPageProxy,
  scale: number,
  rotation = 0,
): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale, rotation });
  const pixelRatio = window.devicePixelRatio || 1;
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width * pixelRatio;
  canvas.height = viewport.height * pixelRatio;
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create canvas context.");
  }

  ctx.scale(pixelRatio, pixelRatio);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return canvas;
}

export async function renderPdfPageToDataUrl(
  page: PDFPageProxy,
  scale: number,
  quality = 0.8,
  rotation = 0,
): Promise<string> {
  const canvas = await renderPdfPageToCanvas(page, scale, rotation);
  return canvas.toDataURL("image/jpeg", quality);
}
