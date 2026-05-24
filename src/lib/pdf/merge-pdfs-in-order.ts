import { loadPdfDocumentWithLib } from "@/lib/pdf/load-pdf-lib";

export interface MergePdfInput {
  bytes: ArrayBuffer;
  password?: string;
}

export async function mergePdfsInOrder(files: MergePdfInput[]): Promise<Uint8Array> {
  if (files.length === 0) {
    throw new Error("No PDF files to merge.");
  }

  if (files.length === 1) {
    return new Uint8Array(files[0].bytes);
  }

  const { PDFDocument } = await import("pdf-lib");
  const merged = await PDFDocument.create();

  for (const file of files) {
    const source = await loadPdfDocumentWithLib(file.bytes, file.password);
    const copied = await merged.copyPages(source, source.getPageIndices());
    copied.forEach((page) => merged.addPage(page));
  }

  return merged.save();
}
