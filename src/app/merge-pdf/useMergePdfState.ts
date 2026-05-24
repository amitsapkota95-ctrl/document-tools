"use client";

import { useCallback, useMemo, useState } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type {
  DocumentEntry,
  MergeGridItem,
  PageEntry,
  PageRotation,
  ViewMode,
} from "@/app/merge-pdf/types";
import { detectBlankPages } from "@/lib/pdf/blank-page-detection";
import { loadPdfDocument } from "@/lib/pdf/load-pdfjs";
import { renderPdfPageThumbnail } from "@/lib/pdf/thumbnails";

function buildPageEntries(docId: string, totalPages: number): PageEntry[] {
  return Array.from({ length: totalPages }, (_, index) => ({
    id: crypto.randomUUID(),
    parentDocId: docId,
    originalPageNumber: index + 1,
    thumbnailDataUrl: "",
    rotation: 0,
  }));
}

function flattenPagesInDocOrder(documents: DocumentEntry[], allPages: PageEntry[]): string[] {
  const pagesByDoc = new Map<string, PageEntry[]>();
  for (const page of allPages) {
    const existing = pagesByDoc.get(page.parentDocId) ?? [];
    existing.push(page);
    pagesByDoc.set(page.parentDocId, existing);
  }

  const orderedPageIds: string[] = [];
  for (const doc of documents) {
    const pages = pagesByDoc.get(doc.id) ?? [];
    pages
      .sort((a, b) => a.originalPageNumber - b.originalPageNumber)
      .forEach((page) => orderedPageIds.push(page.id));
  }

  return orderedPageIds;
}

function deriveDocumentOrderFromPages(
  itemsOrder: string[],
  allPages: PageEntry[],
): string[] {
  const pageById = new Map(allPages.map((page) => [page.id, page]));
  const seen = new Set<string>();
  const docOrder: string[] = [];

  for (const id of itemsOrder) {
    const page = pageById.get(id);
    if (!page || seen.has(page.parentDocId)) continue;
    seen.add(page.parentDocId);
    docOrder.push(page.parentDocId);
  }

  return docOrder;
}

function nextRotation(current: PageRotation): PageRotation {
  if (current === 0) return 90;
  if (current === 90) return 180;
  if (current === 180) return 270;
  return 0;
}

export function useMergePdfState() {
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [allPages, setAllPages] = useState<PageEntry[]>([]);
  const [itemsOrder, setItemsOrder] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("document");
  const [addToc, setAddToc] = useState(true);
  const [loadingCount, setLoadingCount] = useState(0);
  const [blankScanning, setBlankScanning] = useState(false);

  const addDocument = useCallback(async (file: File, password?: string) => {
    setLoadingCount((count) => count + 1);

    try {
      const pdf = await loadPdfDocument(file, password);
      const totalPages = pdf.numPages;
      const docId = crypto.randomUUID();
      const thumbnailDataUrl = await renderPdfPageThumbnail(file, 0, 0.3, password);
      const pageEntries = buildPageEntries(docId, totalPages);
      const displayName = file.name.replace(/\.pdf$/i, "");

      const documentEntry: DocumentEntry = {
        id: docId,
        file,
        name: file.name,
        displayName,
        size: file.size,
        totalPages,
        thumbnailDataUrl,
        password,
      };

      setDocuments((prev) => [...prev, documentEntry]);
      setAllPages((prev) => [...prev, ...pageEntries]);
      setItemsOrder((prev) =>
        viewMode === "page"
          ? [...prev, ...pageEntries.map((page) => page.id)]
          : [...prev, docId],
      );
    } finally {
      setLoadingCount((count) => Math.max(0, count - 1));
    }
  }, [viewMode]);

  const removeDocument = useCallback((docId: string) => {
    const removedPageIds = new Set(
      allPages.filter((page) => page.parentDocId === docId).map((page) => page.id),
    );

    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    setAllPages((prev) => prev.filter((page) => page.parentDocId !== docId));
    setItemsOrder((prev) =>
      prev.filter((itemId) => itemId !== docId && !removedPageIds.has(itemId)),
    );
  }, [allPages]);

  const removeItem = useCallback(
    (id: string) => {
      if (viewMode === "document") {
        removeDocument(id);
        return;
      }

      const page = allPages.find((entry) => entry.id === id);
      const parentDocId = page?.parentDocId;

      setAllPages((prev) => {
        const nextPages = prev.filter((entry) => entry.id !== id);
        if (parentDocId) {
          const hasRemainingPages = nextPages.some((entry) => entry.parentDocId === parentDocId);
          if (!hasRemainingPages) {
            setDocuments((docs) => docs.filter((doc) => doc.id !== parentDocId));
          }
        }
        return nextPages;
      });
      setItemsOrder((prev) => prev.filter((itemId) => itemId !== id));
    },
    [allPages, removeDocument, viewMode],
  );

  const setPageViewMode = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        setViewMode("page");
        setItemsOrder((prev) => {
          const docOrder =
            prev.length > 0 ? prev : documents.map((doc) => doc.id);
          const docById = new Map(documents.map((doc) => [doc.id, doc]));
          const orderedDocs = docOrder
            .map((id) => docById.get(id))
            .filter((doc): doc is DocumentEntry => Boolean(doc));
          return flattenPagesInDocOrder(orderedDocs, allPages);
        });
        return;
      }

      setViewMode("document");
      setItemsOrder((prev) => deriveDocumentOrderFromPages(prev, allPages));
    },
    [allPages, documents],
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItemsOrder((items) => {
      const oldIndex = items.indexOf(String(active.id));
      const newIndex = items.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  }, []);

  const rotatePage = useCallback((pageId: string) => {
    setAllPages((prev) =>
      prev.map((page) => {
        if (page.id !== pageId) return page;
        const rotation = nextRotation(page.rotation);
        return { ...page, rotation, thumbnailDataUrl: "" };
      }),
    );
  }, []);

  const renameDocument = useCallback((docId: string, displayName: string) => {
    const trimmed = displayName.trim();
    if (!trimmed) return;
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, displayName: trimmed } : doc)),
    );
  }, []);

  const setPageThumbnail = useCallback((pageId: string, dataUrl: string) => {
    setAllPages((prev) =>
      prev.map((page) =>
        page.id === pageId ? { ...page, thumbnailDataUrl: dataUrl } : page,
      ),
    );
  }, []);

  const removeBlankPages = useCallback(async (): Promise<number> => {
    if (allPages.length === 0) return 0;

    setBlankScanning(true);
    try {
      let pagesToScan: PageEntry[];
      if (viewMode === "page") {
        pagesToScan = itemsOrder
          .map((id) => allPages.find((page) => page.id === id))
          .filter((page): page is PageEntry => Boolean(page));
      } else {
        const docById = new Map(documents.map((doc) => [doc.id, doc]));
        const orderedDocs = itemsOrder
          .map((id) => docById.get(id))
          .filter((doc): doc is DocumentEntry => Boolean(doc));
        const pageIds = flattenPagesInDocOrder(orderedDocs, allPages);
        pagesToScan = pageIds
          .map((id) => allPages.find((page) => page.id === id))
          .filter((page): page is PageEntry => Boolean(page));
      }

      const blankIds = new Set<string>();
      const canvases: HTMLCanvasElement[] = [];
      const pageIds: string[] = [];

      for (const page of pagesToScan) {
        const parent = documents.find((doc) => doc.id === page.parentDocId);
        if (!parent) continue;

        const pdf = await loadPdfDocument(parent.file, parent.password);
        const pdfPage = await pdf.getPage(page.originalPageNumber);
        const viewport = pdfPage.getViewport({ scale: 0.3, rotation: page.rotation });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        await pdfPage.render({ canvasContext: ctx, viewport, canvas }).promise;
        canvases.push(canvas);
        pageIds.push(page.id);
      }

      const results = await detectBlankPages(canvases);
      results.forEach((result, index) => {
        if (result.isBlank) blankIds.add(pageIds[index]);
      });

      const remainingIds = pagesToScan
        .filter((page) => !blankIds.has(page.id))
        .map((page) => page.id);

      setAllPages((prev) =>
        prev.map((page) => ({
          ...page,
          isBlank: blankIds.has(page.id),
        })),
      );
      setViewMode("page");
      setItemsOrder(remainingIds);

      return blankIds.size;
    } finally {
      setBlankScanning(false);
    }
  }, [allPages, documents, itemsOrder, viewMode]);

  const gridItems = useMemo<MergeGridItem[]>(() => {
    const docById = new Map(documents.map((doc) => [doc.id, doc]));
    const pageById = new Map(allPages.map((page) => [page.id, page]));
    const items: MergeGridItem[] = [];

    for (const id of itemsOrder) {
      if (viewMode === "document") {
        const doc = docById.get(id);
        if (!doc) continue;
        items.push({
          id: doc.id,
          thumbnailDataUrl: doc.thumbnailDataUrl,
          label: doc.displayName,
          sublabel: `${doc.totalPages} page${doc.totalPages === 1 ? "" : "s"}`,
          kind: "document",
        });
        continue;
      }

      const page = pageById.get(id);
      if (!page) continue;
      const parent = docById.get(page.parentDocId);
      if (!parent) continue;

      items.push({
        id: page.id,
        thumbnailDataUrl: page.thumbnailDataUrl,
        label: parent.displayName,
        sublabel: `Page ${page.originalPageNumber}`,
        rotation: page.rotation,
        isBlank: page.isBlank,
        kind: "page",
        lazyThumbnail: page.thumbnailDataUrl
          ? undefined
          : {
              file: parent.file,
              pageIndex: page.originalPageNumber - 1,
              password: parent.password,
              rotation: page.rotation,
            },
      });
    }

    return items;
  }, [allPages, documents, itemsOrder, viewMode]);

  const resetWorkspace = useCallback(() => {
    setDocuments([]);
    setAllPages([]);
    setItemsOrder([]);
    setViewMode("document");
    setAddToc(true);
  }, []);

  return {
    documents,
    allPages,
    itemsOrder,
    viewMode,
    addToc,
    loadingCount,
    blankScanning,
    gridItems,
    addDocument,
    removeDocument,
    removeItem,
    resetWorkspace,
    setPageViewMode,
    setAddToc,
    handleDragEnd,
    rotatePage,
    renameDocument,
    setPageThumbnail,
    removeBlankPages,
  };
}
