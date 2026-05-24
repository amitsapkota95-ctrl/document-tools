import type { PDFDocumentProxy } from "pdfjs-dist";
import type { OcrWord } from "@/components/tools/OcrOverlayViewer";
import { loadPdfDocument } from "@/lib/pdf/load-pdfjs";

const RENDER_SCALE = 2;

const TESSERACT_OPTIONS = {
  workerPath: "/tesseract/worker.min.js",
  corePath: "/tesseract/tesseract-core-lstm.wasm.js",
  langPath: "/tesseract/lang",
};

export interface OcrPageResult {
  pageNum: number;
  text: string;
  words: OcrWord[];
  imageUrl: string;
  pageWidth: number;
  pageHeight: number;
}

export interface ScanResult {
  fullText: string;
  method: "embedded" | "ocr";
  pages: OcrPageResult[];
}

interface TesseractWord {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

interface TesseractRecognizeData {
  text: string;
  blocks?: Array<{
    paragraphs?: Array<{
      lines?: Array<{
        words?: TesseractWord[];
      }>;
    }>;
  }>;
}

export function mapScanError(err: unknown): string {
  console.error("[extract-text]", err);

  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();

  if (
    msg.includes("traineddata") ||
    msg.includes("language") ||
    (msg.includes("fetch") && msg.includes("lang"))
  ) {
    return "Could not download OCR language files. Check your connection.";
  }

  if (
    msg.includes("worker") ||
    msg.includes("importscripts") ||
    msg.includes("loading worker") ||
    msg.includes("failed to construct")
  ) {
    return "Scanner failed to start. Refresh and try again.";
  }

  if (msg.includes("network") || msg.includes("failed to fetch") || msg.includes("load failed")) {
    return "Could not download OCR language files. Check your connection.";
  }

  if (msg.includes("password") || msg.includes("encrypted")) {
    return "This PDF is password-protected. Enter the password and try again.";
  }

  if (msg.includes("invalid pdf") || msg.includes("corrupt") || msg.includes("could not read")) {
    return "Could not read this PDF. Make sure the file is valid.";
  }

  if (msg.includes("no text found")) {
    return "No text found. Try a clearer scan or a different language.";
  }

  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }

  return "Could not scan PDF. Try again or use a different file.";
}

function parseOcrWords(data: TesseractRecognizeData): OcrWord[] {
  const words: OcrWord[] = [];

  for (const block of data.blocks ?? []) {
    for (const paragraph of block.paragraphs ?? []) {
      for (const line of paragraph.lines ?? []) {
        for (const word of line.words ?? []) {
          if (word.text.trim()) {
            words.push({ text: word.text, bbox: word.bbox });
          }
        }
      }
    }
  }

  return words;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not render page image."));
      },
      "image/png",
    );
  });
}

async function tryExtractEmbeddedText(
  pdf: PDFDocumentProxy,
  onProgress: (progress: number, message?: string) => void,
): Promise<ScanResult | null> {
  const pageTexts: string[] = [];
  let totalChars = 0;

  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress(
      Math.round((i / pdf.numPages) * 90),
      `Reading page ${i} of ${pdf.numPages}…`,
    );

    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    pageTexts.push(pageText);
    totalChars += pageText.length;
  }

  const hasMeaningfulText =
    pageTexts.some((pageText) => pageText.length > 20) || totalChars > 50;

  if (!hasMeaningfulText) {
    return null;
  }

  const fullText = pageTexts
    .map((pageText, index) => {
      if (pdf.numPages === 1) return pageText;
      return `--- Page ${index + 1} ---\n${pageText}`;
    })
    .join("\n\n")
    .trim();

  return {
    fullText,
    method: "embedded",
    pages: [],
  };
}

async function scanWithOcr(
  pdf: PDFDocumentProxy,
  language: string,
  onProgress: (progress: number, message?: string) => void,
): Promise<ScanResult> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(language, 1, TESSERACT_OPTIONS);

  const pages: OcrPageResult[] = [];
  let fullText = "";

  try {
    const total = pdf.numPages;

    for (let i = 1; i <= total; i++) {
      onProgress(
        10 + Math.round((i / total) * 85),
        `Scanning page ${i} of ${total}…`,
      );

      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not read this PDF page.");
      }

      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      const blob = await canvasToBlob(canvas);
      const { data } = await worker.recognize(blob, {}, { text: true, blocks: true });
      const recognizeData = data as TesseractRecognizeData;
      const words = parseOcrWords(recognizeData);
      const pageText = recognizeData.text.trim();
      const imageUrl = canvas.toDataURL("image/jpeg", 0.8);

      pages.push({
        pageNum: i,
        text: pageText,
        words,
        imageUrl,
        pageWidth: canvas.width,
        pageHeight: canvas.height,
      });

      fullText += `\n--- Page ${i} ---\n${pageText}\n`;
    }
  } finally {
    await worker.terminate();
  }

  return {
    fullText: fullText.trim(),
    method: "ocr",
    pages,
  };
}

export async function extractTextFromPdf(
  file: File,
  language: string,
  password: string | undefined,
  onProgress: (progress: number, message?: string) => void,
): Promise<ScanResult> {
  onProgress(0, "Preparing scanner…");
  const pdf = await loadPdfDocument(file, password);

  onProgress(5, "Checking for existing text…");
  const embedded = await tryExtractEmbeddedText(pdf, onProgress);
  if (embedded) {
    return embedded;
  }

  onProgress(10, "Starting OCR…");
  return scanWithOcr(pdf, language, onProgress);
}
