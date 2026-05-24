import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { calculateInvoiceTotals } from "./calculations";
import { formatMoney } from "./currencies";
import { formatDate, getLocaleStrings } from "./locales";
import type { BusinessProfile, InvoiceDraft } from "./types";

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

type Rgb = [number, number, number];

/** Matches preview tokens from globals.css */
const FOREST: Rgb = [20, 83, 45]; // #14532d — business/client names, doc number
const SAND: Rgb = [63, 82, 72]; // #3f5248 — section labels
const SAND_LIGHT: Rgb = [100, 121, 108]; // #64796c — uppercase/meta labels
const INK: Rgb = [20, 20, 20]; // near-black — body text for crisp print

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  if (h.length !== 6) return [20, 83, 45];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
  return pdf.splitTextToSize(text, maxWidth) as string[];
}

function drawWrappedText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: "left" | "right" = "left",
): number {
  const lines = wrapText(pdf, text, maxWidth);
  for (const line of lines) {
    pdf.text(line, x, y, align === "right" ? { align: "right" } : undefined);
    y += lineHeight;
  }
  return y;
}

function drawMultilineField(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  for (const paragraph of text.split(/\r?\n/)) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;
    y = drawWrappedText(pdf, trimmed, x, y, maxWidth, lineHeight);
  }
  return y;
}

function ensureSpace(pdf: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_H - MARGIN) {
    pdf.addPage();
    return MARGIN;
  }
  return y;
}

export async function exportInvoicePdf(
  draft: InvoiceDraft,
  business: BusinessProfile,
): Promise<Blob> {
  const pdf = new jsPDF("p", "mm", "a4");
  const strings = getLocaleStrings(draft.locale);
  const totals = calculateInvoiceTotals(draft);
  const accent = hexToRgb(business.accentColor || "#14532d");
  const docTitle = strings.documentTypes[draft.documentType];
  const money = (n: number) => formatMoney(n, draft.currency, draft.locale);

  let y = MARGIN;
  const headerTop = y;
  const logoOffset = business.logoDataUrl ? 36 : 0;
  const leftX = MARGIN + logoOffset;
  const leftMaxW = PAGE_W / 2 - MARGIN - 6;
  const rightMaxW = CONTENT_W / 2 - 4;
  const lineHeightSm = 4.5;
  const lineHeightMd = 5.5;

  if (business.logoDataUrl) {
    try {
      pdf.addImage(business.logoDataUrl, "PNG", MARGIN, headerTop, 32, 14);
    } catch {
      /* logo format unsupported */
    }
  }

  let leftY = headerTop + 6;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(...FOREST);
  leftY = drawWrappedText(
    pdf,
    business.businessName || "Business",
    leftX,
    leftY,
    leftMaxW,
    lineHeightMd,
  );

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...INK);

  if (business.address) {
    leftY = drawMultilineField(pdf, business.address, leftX, leftY + 1, leftMaxW, lineHeightSm);
  }

  for (const line of [business.email, business.phone, business.website].filter(Boolean)) {
    leftY = drawWrappedText(pdf, line, leftX, leftY, leftMaxW, lineHeightSm);
  }

  let rightY = headerTop + 4;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(accent[0], accent[1], accent[2]);
  rightY = drawWrappedText(
    pdf,
    docTitle,
    PAGE_W - MARGIN,
    rightY,
    rightMaxW,
    lineHeightMd,
    "right",
  );

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...FOREST);
  rightY = drawWrappedText(
    pdf,
    draft.documentNumber,
    PAGE_W - MARGIN,
    rightY,
    rightMaxW,
    lineHeightSm,
    "right",
  );

  if (strings.status[draft.status]) {
    pdf.setFontSize(9);
    pdf.setTextColor(...SAND_LIGHT);
    rightY = drawWrappedText(
      pdf,
      strings.status[draft.status],
      PAGE_W - MARGIN,
      rightY,
      rightMaxW,
      lineHeightSm,
      "right",
    );
  }

  y = Math.max(leftY, rightY, headerTop + (business.logoDataUrl ? 16 : 0)) + 6;

  pdf.setDrawColor(accent[0], accent[1], accent[2]);
  pdf.setLineWidth(0.4);
  pdf.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 8;

  const colW = CONTENT_W / 2 - 4;
  const sectionStartY = y;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...SAND_LIGHT);
  pdf.text(strings.billTo.toUpperCase(), MARGIN, y);

  let clientY = y + 5;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...FOREST);
  clientY = drawWrappedText(
    pdf,
    draft.clientName || "—",
    MARGIN,
    clientY,
    colW,
    lineHeightSm,
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...INK);

  if (draft.clientAddress) {
    clientY = drawMultilineField(pdf, draft.clientAddress, MARGIN, clientY + 1, colW, lineHeightSm);
  }
  if (draft.clientEmail) {
    clientY = drawWrappedText(pdf, draft.clientEmail, MARGIN, clientY, colW, lineHeightSm);
  }
  if (draft.clientTaxId) {
    clientY = drawWrappedText(pdf, draft.clientTaxId, MARGIN, clientY, colW, lineHeightSm);
  }

  let metaY = sectionStartY;
  const metaRows: [string, string][] = [
    [strings.issueDate, formatDate(draft.issueDate, draft.locale)],
  ];
  if (draft.documentType === "estimate") {
    metaRows.push([strings.validUntil, formatDate(draft.validUntil, draft.locale)]);
  } else {
    metaRows.push([strings.dueDate, formatDate(draft.dueDate, draft.locale)]);
  }
  if (draft.paymentTerms) metaRows.push([strings.paymentTerms, draft.paymentTerms]);
  if (draft.referenceNumber) metaRows.push([strings.reference, draft.referenceNumber]);
  if (draft.relatedDocumentNumber) {
    metaRows.push([strings.relatedDocument, draft.relatedDocumentNumber]);
  }

  pdf.setFontSize(10);
  metaRows.forEach(([label, value]) => {
    const line = `${label}: ${value}`;
    wrapText(pdf, line, colW).forEach((wrappedLine) => {
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...INK);
      pdf.text(wrappedLine, PAGE_W - MARGIN, metaY, { align: "right" });
      metaY += lineHeightSm;
    });
  });

  y = Math.max(clientY + 4, metaY) + 6;

  if (draft.documentType === "estimate") {
    pdf.setFontSize(8);
    pdf.setTextColor(...SAND_LIGHT);
    pdf.text(strings.notTaxInvoice, MARGIN, y);
    y += 6;
  }

  const colDesc = CONTENT_W * 0.42;
  const colQty = CONTENT_W * 0.1;
  const colUnit = CONTENT_W * 0.1;
  const colRate = CONTENT_W * 0.16;
  const colAmt = CONTENT_W * 0.22;

  pdf.setFillColor(accent[0], accent[1], accent[2]);
  pdf.rect(MARGIN, y, CONTENT_W, 7, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text(strings.description, MARGIN + 2, y + 4.5);
  pdf.text(strings.qty, MARGIN + colDesc + 2, y + 4.5);
  pdf.text(strings.unit, MARGIN + colDesc + colQty + 2, y + 4.5);
  pdf.text(strings.rate, MARGIN + colDesc + colQty + colUnit + 2, y + 4.5);
  pdf.text(strings.amount, PAGE_W - MARGIN - 2, y + 4.5, { align: "right" });
  y += 9;

  pdf.setTextColor(...INK);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  draft.items.forEach((item, idx) => {
    y = ensureSpace(pdf, y, 10);
    const calc = totals.lineCalculations[idx];
    const desc = item.expenseReference
      ? `${item.description} (${strings.expenseRef}: ${item.expenseReference})`
      : item.description;
    const descLines = wrapText(pdf, desc, colDesc - 4);
    const rowH = Math.max(7, descLines.length * 4.5);

    if (idx % 2 === 0) {
      pdf.setFillColor(248, 250, 248);
      pdf.rect(MARGIN, y - 1, CONTENT_W, rowH + 2, "F");
    }

    descLines.forEach((dl, di) => pdf.text(dl, MARGIN + 2, y + 3 + di * 4.5));
    pdf.text(String(item.quantity), MARGIN + colDesc + 2, y + 3);
    pdf.text(item.type === "time" ? strings.hours : item.unit, MARGIN + colDesc + colQty + 2, y + 3);
    pdf.text(money(item.rate), MARGIN + colDesc + colQty + colUnit + 2, y + 3);
    pdf.text(money(calc.gross), PAGE_W - MARGIN - 2, y + 3, { align: "right" });

    if (item.taxExempt) {
      pdf.setFontSize(7);
      pdf.setTextColor(...SAND_LIGHT);
      pdf.text(strings.taxExempt, MARGIN + 2, y + rowH);
      pdf.setFontSize(9);
      pdf.setTextColor(...INK);
    }

    y += rowH + 3;
  });

  y += 4;
  y = ensureSpace(pdf, y, 50);

  const totalsX = PAGE_W - MARGIN - 70;
  const addTotalRow = (label: string, value: string, bold = false, valueColor: Rgb = INK) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setTextColor(...INK);
    pdf.text(label, totalsX, y);
    pdf.setTextColor(...valueColor);
    pdf.text(value, PAGE_W - MARGIN, y, { align: "right" });
    y += 5;
  };

  addTotalRow(strings.subtotal, money(totals.subtotalNet));
  if (totals.lineDiscountTotal > 0) {
    addTotalRow(`${strings.discount} (lines)`, `-${money(totals.lineDiscountTotal)}`);
  }
  if (totals.documentDiscount > 0) {
    addTotalRow(strings.discount, `-${money(totals.documentDiscount)}`);
  }

  if (draft.reverseCharge) {
    pdf.setFontSize(8);
    pdf.setTextColor(...SAND_LIGHT);
    wrapText(pdf, strings.reverseCharge, CONTENT_W).forEach((wl) => {
      pdf.text(wl, MARGIN, y);
      y += 4;
    });
    pdf.setTextColor(...INK);
    pdf.setFontSize(9);
  } else {
    totals.taxBreakdown.forEach((t) => {
      if (t.rate > 0) addTotalRow(`${t.label} (${t.rate}%)`, money(t.amount));
    });
  }

  if (draft.zeroRatedNote) {
    pdf.setFontSize(8);
    pdf.setTextColor(...INK);
    pdf.text(`${strings.zeroRated}: ${draft.zeroRatedNote}`, MARGIN, y);
    y += 5;
    pdf.setFontSize(9);
  }

  pdf.setDrawColor(200, 200, 200);
  pdf.line(totalsX, y, PAGE_W - MARGIN, y);
  y += 4;
  addTotalRow(strings.grandTotal, money(totals.total), true, accent);

  if (draft.depositAmount > 0) {
    addTotalRow(
      draft.depositPaid ? strings.deposit : strings.depositDue,
      money(draft.depositAmount),
    );
  }
  if (draft.amountPaid > 0) {
    addTotalRow(strings.amountPaid, money(draft.amountPaid));
  }
  if (totals.balanceDue !== totals.total) {
    addTotalRow(strings.balanceDue, money(Math.abs(totals.balanceDue)), true, FOREST);
  }

  if (business.taxRegistrations) {
    y += 2;
    pdf.setFontSize(8);
    pdf.setTextColor(...SAND_LIGHT);
    pdf.text(business.taxRegistrations, MARGIN, y);
    y += 5;
  }

  draft.taxComponents.forEach((t) => {
    if (t.registrationNumber) {
      pdf.setFontSize(8);
      pdf.setTextColor(...SAND_LIGHT);
      pdf.text(`${t.label}: ${t.registrationNumber}`, MARGIN, y);
      y += 4;
    }
  });

  y += 4;

  const bank = business.bankDetails;
  const hasBank = bank.accountName || bank.iban || bank.accountNumber;
  if (hasBank) {
    y = ensureSpace(pdf, y, 30);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...FOREST);
    pdf.text(strings.bankDetails, MARGIN, y);
    y += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...INK);
    pdf.setFontSize(8);
    const bankLines: [string, string][] = [];
    if (bank.accountName) bankLines.push([strings.accountName, bank.accountName]);
    if (bank.bankName) bankLines.push(["Bank", bank.bankName]);
    if (bank.accountNumber) bankLines.push([strings.accountNumber, bank.accountNumber]);
    if (bank.routingNumber) bankLines.push([strings.routingNumber, bank.routingNumber]);
    if (bank.iban) bankLines.push([strings.iban, bank.iban]);
    if (bank.swift) bankLines.push([strings.swift, bank.swift]);
    bankLines.forEach(([l, v]) => {
      pdf.text(`${l}: ${v}`, MARGIN, y);
      y += 4;
    });
  }

  if (draft.paymentLink) {
    y = ensureSpace(pdf, y, 28);
    pdf.setFillColor(accent[0], accent[1], accent[2]);
    pdf.roundedRect(MARGIN, y, 60, 8, 2, 2, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text(strings.payNow, MARGIN + 4, y + 5.5);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...INK);
    pdf.textWithLink(draft.paymentLink, MARGIN + 66, y + 5.5, { url: draft.paymentLink });

    if (draft.showPaymentQr) {
      try {
        const qrData = await QRCode.toDataURL(draft.paymentLink, { width: 120, margin: 1 });
        pdf.addImage(qrData, "PNG", PAGE_W - MARGIN - 28, y - 2, 28, 28);
      } catch {
        /* qr failed */
      }
    }
    y += 14;
  }

  if (draft.isRecurringTemplate && draft.recurringFrequency) {
    y = ensureSpace(pdf, y, 8);
    pdf.setFontSize(8);
    pdf.setTextColor(...SAND_LIGHT);
    pdf.text(
      `${strings.recurring}: ${draft.recurringFrequency}${draft.recurringNextDate ? ` — ${strings.nextIssue}: ${formatDate(draft.recurringNextDate, draft.locale)}` : ""}`,
      MARGIN,
      y,
    );
    y += 6;
  }

  if (draft.notes) {
    y = ensureSpace(pdf, y, 16);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...SAND);
    pdf.text(strings.notes, MARGIN, y);
    y += 4;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...INK);
    pdf.setFontSize(8);
    wrapText(pdf, draft.notes, CONTENT_W).forEach((wl) => {
      y = ensureSpace(pdf, y, 5);
      pdf.text(wl, MARGIN, y);
      y += 4;
    });
  }

  if (draft.terms) {
    y = ensureSpace(pdf, y, 16);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...SAND);
    pdf.text(strings.terms, MARGIN, y);
    y += 4;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...INK);
    pdf.setFontSize(8);
    wrapText(pdf, draft.terms, CONTENT_W).forEach((wl) => {
      y = ensureSpace(pdf, y, 5);
      pdf.text(wl, MARGIN, y);
      y += 4;
    });
  }

  return pdf.output("blob");
}
