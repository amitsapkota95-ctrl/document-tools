type PDFJSModule = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PDFJSModule> | null = null;

export async function loadPdfJs(): Promise<PDFJSModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/build/pdf.min.mjs").then((pdfjs: PDFJSModule) => {
      if (typeof window !== "undefined") {
        // Local copy from postinstall — cdnjs does not host pdf.js 5.x workers.
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      }
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

export async function loadPdfDocument(file: File, password?: string) {
  const pdfjs = await loadPdfJs();
  const data = await readFileAsArrayBuffer(file);
  return pdfjs.getDocument({ data, password }).promise;
}

export async function loadPdfDocumentFromBytes(bytes: ArrayBuffer, password?: string) {
  const pdfjs = await loadPdfJs();
  return pdfjs.getDocument({ data: bytes, password }).promise;
}
