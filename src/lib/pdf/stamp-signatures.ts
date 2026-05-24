import type { PlacedSignature, PageRenderInfo } from "@/app/fill-and-sign/types";
import { canvasBoxToPdfPoints } from "@/lib/pdf/coordinate-map";
import { loadPdfDocumentWithLib } from "@/lib/pdf/load-pdf-lib";

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

export async function stampSignaturesOnPdf(
  fileBytes: ArrayBuffer | Uint8Array,
  password: string | undefined,
  placedSignatures: PlacedSignature[],
  pages: PageRenderInfo[],
  onProgress?: (pct: number, message?: string) => void,
): Promise<Uint8Array> {
  const doc = await loadPdfDocumentWithLib(fileBytes, password);
  const pageByIndex = new Map(pages.map((page) => [page.pageIndex, page]));
  const total = placedSignatures.length;

  for (let i = 0; i < placedSignatures.length; i++) {
    const signature = placedSignatures[i];
    const pageInfo = pageByIndex.get(signature.pageIndex);
    if (!pageInfo) continue;

    onProgress?.(
      Math.round(((i + 1) / Math.max(total, 1)) * 90),
      `Stamping signature ${i + 1} of ${total}…`,
    );

    const pdfBox = canvasBoxToPdfPoints(
      {
        x: signature.x,
        y: signature.y,
        width: signature.width,
        height: signature.height,
      },
      pageInfo.displayWidth,
      pageInfo.displayHeight,
      pageInfo.pdfWidth,
      pageInfo.pdfHeight,
    );

    const png = await doc.embedPng(dataUrlToBytes(signature.dataUrl));
    const page = doc.getPage(signature.pageIndex);
    page.drawImage(png, pdfBox);
  }

  onProgress?.(95, "Saving signed PDF…");
  return doc.save();
}
