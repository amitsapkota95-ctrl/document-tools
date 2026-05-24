import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { downloadBlob } from "@/lib/pdf/download";
import { buildExportFilename } from "./encode-payload";
import type { QrEncodeResult, QrFormData, QrStyleOptions } from "./types";

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

function getErrorCorrectionLevel(logoUrl: string | null): ErrorCorrectionLevel {
  return logoUrl ? "H" : "M";
}

async function renderQrCanvas(
  payload: string,
  style: QrStyleOptions,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, payload, {
    width: style.exportSize,
    margin: 2,
    color: {
      dark: style.foreground,
      light: style.background,
    },
    errorCorrectionLevel: getErrorCorrectionLevel(style.logoUrl),
  });

  if (style.logoUrl) {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const logo = await loadImage(style.logoUrl);
      const logoSize = canvas.width * 0.22;
      const x = (canvas.width - logoSize) / 2;
      const y = (canvas.height - logoSize) / 2;
      const pad = logoSize * 0.12;
      ctx.fillStyle = style.background;
      ctx.fillRect(x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2);
      ctx.drawImage(logo, x, y, logoSize, logoSize);
    }
  }

  return canvas;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create image blob"));
      },
      type,
      quality,
    );
  });
}

export async function exportQrPng(
  payload: string,
  form: QrFormData,
  style: QrStyleOptions,
): Promise<void> {
  const canvas = await renderQrCanvas(payload, style);
  const blob = await canvasToBlob(canvas, "image/png");
  downloadBlob(blob, buildExportFilename(form, "png"));
}

export async function exportQrJpg(
  payload: string,
  form: QrFormData,
  style: QrStyleOptions,
): Promise<void> {
  const canvas = await renderQrCanvas(payload, style);
  const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
  downloadBlob(blob, buildExportFilename(form, "jpg"));
}

export function exportQrSvg(
  payload: string,
  form: QrFormData,
  style: QrStyleOptions,
): void {
  const svg = document.getElementById("live-qr-code");
  if (!svg) return;

  let svgString = new XMLSerializer().serializeToString(svg);

  if (style.logoUrl) {
    const logoEmbed = `<image href="${style.logoUrl}" x="96" y="96" width="64" height="64" preserveAspectRatio="xMidYMid meet"/>`;
    svgString = svgString.replace("</svg>", `${logoEmbed}</svg>`);
  }

  void payload;
  downloadBlob(new Blob([svgString], { type: "image/svg+xml" }), buildExportFilename(form, "svg"));
}

function drawCenteredWrappedText(
  pdf: jsPDF,
  text: string,
  centerX: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const lines = pdf.splitTextToSize(text, maxWidth) as string[];
  lines.forEach((line) => {
    pdf.text(line, centerX, y, { align: "center" });
    y += lineHeight;
  });
  return y;
}

export async function exportQrPdfCard(
  payload: string,
  form: QrFormData,
  style: QrStyleOptions,
  meta: QrEncodeResult,
): Promise<void> {
  const isBusiness = style.pdfCardSize === "business";
  const pdf = new jsPDF({
    orientation: isBusiness ? "landscape" : "portrait",
    unit: "mm",
    format: isBusiness ? [85, 55] : [105, 148],
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = isBusiness ? 6 : 10;
  const contentWidth = pageW - margin * 2;
  const centerX = pageW / 2;

  const qrSize = isBusiness ? 28 : 70;
  const qrData = await QRCode.toDataURL(payload, {
    width: 512,
    margin: 1,
    color: {
      dark: style.foreground,
      light: style.background,
    },
    errorCorrectionLevel: getErrorCorrectionLevel(style.logoUrl),
  });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(isBusiness ? 9 : 14);
  let y = margin + 4;
  y = drawCenteredWrappedText(pdf, meta.title, centerX, y, contentWidth, isBusiness ? 3.5 : 5);

  const qrX = (pageW - qrSize) / 2;
  const qrY = isBusiness ? y + 1 : 22;
  pdf.addImage(qrData, "PNG", qrX, qrY, qrSize, qrSize);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(isBusiness ? 7 : 10);
  y = qrY + qrSize + (isBusiness ? 3 : 8);
  const maxLines = isBusiness ? 2 : 5;

  meta.detailLines.slice(0, maxLines).forEach((line) => {
    y = drawCenteredWrappedText(
      pdf,
      line,
      centerX,
      y,
      contentWidth,
      isBusiness ? 3 : 4.5,
    );
  });

  if (!isBusiness) {
    pdf.setFontSize(7);
    pdf.setTextColor(120, 120, 120);
    pdf.text("Generated with paperless.tools", centerX, pageH - 6, { align: "center" });
  }

  const blob = pdf.output("blob");
  downloadBlob(blob, buildExportFilename(form, "pdf"));
}
