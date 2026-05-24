import type { DocumentEntry, PageEntry, ViewMode } from "@/app/merge-pdf/types";
import { mergePdfsWithToc, type MergeFileInput } from "@/lib/pdf/merge-with-toc";

interface MergePdfByOrderOptions {
  documents: DocumentEntry[];
  allPages: PageEntry[];
  itemsOrder: string[];
  viewMode: ViewMode;
  addToc: boolean;
  onProgress?: (pct: number, message?: string) => void;
}

export async function mergePdfByOrder({
  documents,
  allPages,
  itemsOrder,
  viewMode,
  addToc,
  onProgress,
}: MergePdfByOrderOptions): Promise<Uint8Array> {
  if (itemsOrder.length < 2) {
    throw new Error("Add at least two items to combine.");
  }

  const docById = new Map(documents.map((doc) => [doc.id, doc]));
  const pageById = new Map(allPages.map((page) => [page.id, page]));

  if (viewMode === "document" && addToc && itemsOrder.length > 1) {
    onProgress?.(10, "Building table of contents…");
    const files: MergeFileInput[] = [];

    for (const id of itemsOrder) {
      const doc = docById.get(id);
      if (!doc) continue;
      files.push({
        bytes: await doc.file.arrayBuffer(),
        name: doc.name,
        displayName: doc.displayName,
        password: doc.password,
      });
    }

    if (files.length < 2) {
      throw new Error("Add at least two PDF files to combine.");
    }

    onProgress?.(80, "Finalizing combined PDF…");
    return mergePdfsWithToc(files);
  }

  const { PDFDocument, degrees } = await import("pdf-lib");
  const merged = await PDFDocument.create();
  const loadedDocs = new Map<string, Awaited<ReturnType<typeof PDFDocument.load>>>();
  const total = itemsOrder.length;

  for (let i = 0; i < itemsOrder.length; i++) {
    const id = itemsOrder[i];
    onProgress?.(
      Math.round(((i + 1) / total) * 90),
      viewMode === "document" ? `Adding document ${i + 1} of ${total}…` : `Adding page ${i + 1} of ${total}…`,
    );

    if (viewMode === "document") {
      const doc = docById.get(id);
      if (!doc) continue;

      let source = loadedDocs.get(doc.id);
      if (!source) {
        const bytes = await doc.file.arrayBuffer();
        source = await PDFDocument.load(bytes, { ignoreEncryption: true });
        loadedDocs.set(doc.id, source);
      }

      const pages = await merged.copyPages(source, source.getPageIndices());
      pages.forEach((page) => merged.addPage(page));
      continue;
    }

    const pageEntry = pageById.get(id);
    if (!pageEntry) continue;

    const parentDoc = docById.get(pageEntry.parentDocId);
    if (!parentDoc) continue;

    let source = loadedDocs.get(parentDoc.id);
    if (!source) {
      const bytes = await parentDoc.file.arrayBuffer();
      source = await PDFDocument.load(bytes, { ignoreEncryption: true });
      loadedDocs.set(parentDoc.id, source);
    }

    const [page] = await merged.copyPages(source, [pageEntry.originalPageNumber - 1]);
    if (pageEntry.rotation) {
      page.setRotation(degrees(pageEntry.rotation));
    }
    merged.addPage(page);
  }

  onProgress?.(95, "Saving combined PDF…");
  return merged.save();
}
