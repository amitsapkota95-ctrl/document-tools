import { Document, Packer, Paragraph, TextRun } from "docx";

const BODY_SIZE = 24; // 12pt
const LINE_SPACING_AFTER = 120; // ~6pt gap between lines

function splitPages(fullText: string): string[] {
  const pages = fullText
    .split(/\n?--- Page \d+ ---\n?/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);

  return pages.length > 0 ? pages : [fullText.trim()];
}

/** Export scanned text as a readable Word document (flowing text, one page break per PDF page). */
export async function exportTextToDocx(fullText: string): Promise<Blob> {
  const pageTexts = splitPages(fullText);
  const children: Paragraph[] = [];

  for (let pageIndex = 0; pageIndex < pageTexts.length; pageIndex++) {
    if (pageIndex > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ break: 1 })],
          pageBreakBefore: true,
        }),
      );
    }

    const lines = pageTexts[pageIndex].split("\n");
    for (const line of lines) {
      const trimmed = line.trimEnd();
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.length > 0 ? trimmed : " ",
              size: BODY_SIZE,
            }),
          ],
          spacing: { after: LINE_SPACING_AFTER },
        }),
      );
    }
  }

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBlob(doc);
}
