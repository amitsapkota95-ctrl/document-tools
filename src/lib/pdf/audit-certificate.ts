import { PDFDocument, PDFPage, rgb, StandardFonts } from "pdf-lib";

export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function appendAuditCertificate(
  pdfBytes: Uint8Array,
  preSignHash: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { height } = page.getSize();

  const timestamp = new Date().toISOString();
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";

  const lines = [
    "Certificate of Completion",
    "",
    "This document was electronically signed using paperless.tools.",
    "All processing occurred locally in your browser — no data was uploaded.",
    "",
    `Signed at: ${timestamp}`,
    `Device: ${userAgent.slice(0, 120)}`,
    "",
    "Document integrity hash (SHA-256, pre-signature):",
    preSignHash,
    "",
    "This hash proves the document state at the time of signing.",
    "Any modification after signing will produce a different hash.",
  ];

  page.drawText(lines[0], { x: 72, y: height - 72, size: 20, font: bold, color: rgb(0.08, 0.32, 0.18) });

  let y = height - 110;
  for (const line of lines.slice(2)) {
    page.drawText(line, {
      x: 72,
      y,
      size: line.length > 60 ? 8 : 11,
      font,
      color: rgb(0.12, 0.1, 0.09),
      maxWidth: 468,
    });
    y -= line === "" ? 10 : line.length > 60 ? 14 : 18;
  }

  drawBorder(page);
  return doc.save();
}

function drawBorder(page: PDFPage) {
  const { width, height } = page.getSize();
  page.drawRectangle({
    x: 36,
    y: 36,
    width: width - 72,
    height: height - 72,
    borderColor: rgb(0.08, 0.32, 0.18),
    borderWidth: 2,
  });
}
