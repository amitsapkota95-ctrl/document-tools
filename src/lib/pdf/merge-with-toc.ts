import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface MergeFileInput {
  bytes: ArrayBuffer;
  name: string;
  displayName?: string;
  password?: string;
}

export interface MergeSection {
  name: string;
  startPage: number; // 1-based in final doc (after TOC)
  pageCount: number;
}

export async function mergePdfsWithToc(files: MergeFileInput[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  const font = await merged.embedFont(StandardFonts.Helvetica);
  const bold = await merged.embedFont(StandardFonts.HelveticaBold);
  const sections: MergeSection[] = [];

  // Reserve page 1 for TOC — add placeholder, we'll rebuild after knowing page counts
  const tocPage = merged.addPage([612, 792]);
  let currentPage = 2; // 1-based page after TOC

  for (const file of files) {
    const doc = await PDFDocument.load(file.bytes, { ignoreEncryption: true });
    const pageCount = doc.getPageCount();
    const displayName = file.displayName ?? file.name.replace(/\.pdf$/i, "");

    sections.push({ name: displayName, startPage: currentPage, pageCount });
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
    currentPage += pageCount;
  }

  // Draw TOC on first page
  const { height } = tocPage.getSize();
  tocPage.drawText("Table of Contents", {
    x: 72,
    y: height - 72,
    size: 24,
    font: bold,
    color: rgb(0.08, 0.32, 0.18),
  });

  let y = height - 120;
  for (const section of sections) {
    const line = `${section.name}  ........  Page ${section.startPage}`;
    tocPage.drawText(line, { x: 72, y, size: 12, font, color: rgb(0.12, 0.1, 0.09) });
    y -= 22;
  }

  tocPage.drawText("Use your PDF reader's bookmarks panel to jump between sections.", {
    x: 72,
    y: 72,
    size: 9,
    font,
    color: rgb(0.4, 0.45, 0.42),
  });

  return merged.save();
}
