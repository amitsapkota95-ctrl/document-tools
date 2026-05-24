/**
 * Local verification script for extract-text-from-pdf.
 * Run: node scripts/verify-ocr-scan.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const digitalPdf = join(root, ".test-pdfs", "digital.pdf");
const blankPdf = join(root, ".test-pdfs", "scanned-blank.pdf");

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  return pdfjs;
}

async function extractEmbeddedText(data) {
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
  const pageTexts = [];
  let totalChars = 0;

  for (let i = 1; i <= pdf.numPages; i++) {
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

  return { hasMeaningfulText, pageTexts, totalChars };
}

async function main() {
  let failed = 0;

  if (!existsSync(digitalPdf)) {
    console.error("Missing digital test PDF:", digitalPdf);
    failed += 1;
  } else {
    const digital = await extractEmbeddedText(readFileSync(digitalPdf));
    if (!digital.hasMeaningfulText) {
      console.error("FAIL: digital PDF should extract embedded text");
      failed += 1;
    } else {
      console.log("PASS: digital PDF embedded text path", digital.pageTexts[0].slice(0, 40));
    }
  }

  if (!existsSync(blankPdf)) {
    console.error("Missing blank test PDF:", blankPdf);
    failed += 1;
  } else {
    const blank = await extractEmbeddedText(readFileSync(blankPdf));
    if (blank.hasMeaningfulText) {
      console.error("FAIL: blank PDF should not use embedded text path");
      failed += 1;
    } else {
      console.log("PASS: blank PDF falls back to OCR path");
    }
  }

  const protectedPdf = join(root, ".test-pdfs", "protected.pdf");
  if (!existsSync(protectedPdf)) {
    console.error("Missing protected test PDF:", protectedPdf);
    failed += 1;
  } else {
    try {
      const pdfjs = await loadPdfJs();
      await pdfjs.getDocument({ data: new Uint8Array(readFileSync(protectedPdf)), password: "secret" }).promise;
      console.log("PASS: password-protected PDF opens with correct password");
    } catch (err) {
      console.error("FAIL: password-protected PDF", err);
      failed += 1;
    }
  }

  for (const asset of [
    "public/tesseract/worker.min.js",
    "public/tesseract/tesseract-core-lstm.wasm.js",
    "public/tesseract/lang/eng.traineddata.gz",
  ]) {
    if (!existsSync(join(root, asset))) {
      console.error("FAIL: missing asset", asset);
      failed += 1;
    }
  }
  console.log("PASS: self-hosted tesseract assets present");

  if (failed > 0) {
    process.exit(1);
  }

  console.log("All OCR scan verification checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
