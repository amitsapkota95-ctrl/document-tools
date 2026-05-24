type PDFLibModule = typeof import("pdf-lib");

let pdfLibPromise: Promise<PDFLibModule> | null = null;

export function loadPdfLib(): Promise<PDFLibModule> {
  if (!pdfLibPromise) {
    pdfLibPromise = import("pdf-lib");
  }
  return pdfLibPromise;
}

/** Password is validated upstream via pdfjs; pdf-lib loads with ignoreEncryption. */
export async function loadPdfDocumentWithLib(
  _bytes: ArrayBuffer | Uint8Array,
  _password?: string,
) {
  const { PDFDocument } = await loadPdfLib();
  return PDFDocument.load(_bytes, { ignoreEncryption: true });
}
