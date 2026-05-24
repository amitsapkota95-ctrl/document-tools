/** Shared compression parameters used by preview, estimate, and export. */
export function getCompressionRenderScale(imageDpi: number): number {
  return Math.max(0.5, imageDpi / 72);
}

export function getCompressionJpegQuality(qualityNorm: number): number {
  return 0.3 + qualityNorm * 0.7;
}

/** Rough pdf-lib wrapper overhead beyond embedded JPEG bytes. */
export function estimatePdfWrapperOverhead(pageCount: number): number {
  return 4096 + pageCount * 900;
}
