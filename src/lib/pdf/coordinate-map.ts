export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const PDF_RENDER_SCALE = 1.5;

/** pdfjs text item → DOM overlay (top-left origin, scaled pixels). */
export function pdfTextBoundsToDomBox(
  tx: number,
  ty: number,
  width: number,
  height: number,
  viewportHeight: number,
  renderScale: number,
): BoundingBox {
  const rectWidth = width * renderScale;
  const rectHeight = height * renderScale;
  return {
    x: tx * renderScale,
    y: viewportHeight - ty * renderScale - rectHeight,
    width: rectWidth,
    height: rectHeight,
  };
}

/** DOM overlay box → pdf-lib bottom-left points (spec formula). */
export function domBoxToPdfPoints(
  box: BoundingBox,
  renderScale: number,
  pdfPageHeight: number,
): BoundingBox {
  const pdfWidth = box.width / renderScale;
  const pdfHeight = box.height / renderScale;
  return {
    x: box.x / renderScale,
    y: pdfPageHeight - box.y / renderScale - pdfHeight,
    width: pdfWidth,
    height: pdfHeight,
  };
}

/** Map DOM canvas coordinates (top-left origin) to pdf-lib points (bottom-left origin). */
export function canvasBoxToPdfPoints(
  box: BoundingBox,
  canvasWidth: number,
  canvasHeight: number,
  pdfWidth: number,
  pdfHeight: number,
): BoundingBox {
  return {
    x: (box.x / canvasWidth) * pdfWidth,
    y: pdfHeight - ((box.y + box.height) / canvasHeight) * pdfHeight,
    width: (box.width / canvasWidth) * pdfWidth,
    height: (box.height / canvasHeight) * pdfHeight,
  };
}
