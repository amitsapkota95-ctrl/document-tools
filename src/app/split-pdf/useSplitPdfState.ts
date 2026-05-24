"use client";

import { useCallback, useState } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import JSZip from "jszip";
import type { PageRotation, SplitDocument, SplitPage } from "@/app/split-pdf/types";
import { detectBlankPages, suggestSplitPoints } from "@/lib/pdf/blank-page-detection";
import { downloadBlob, downloadBytes, sanitizeFilename } from "@/lib/pdf/download";
import { loadPdfDocument } from "@/lib/pdf/load-pdfjs";
import { loadPdfDocumentWithLib } from "@/lib/pdf/load-pdf-lib";
import { renderAllPageThumbnails, renderPdfPageThumbnail } from "@/lib/pdf/thumbnails";
import { useProcessingStore } from "@/stores/processing-store";

function nextRotation(current: PageRotation): PageRotation {
  if (current === 0) return 90;
  if (current === 90) return 180;
  if (current === 180) return 270;
  return 0;
}

function remapPageIdSet(ids: Set<string>, removedIds: Set<string>): Set<string> {
  const next = new Set<string>();
  for (const id of ids) {
    if (!removedIds.has(id)) next.add(id);
  }
  return next;
}

export function useSplitPdfState(tryUnlock: (file: File) => Promise<{ file: File; password?: string } | null>) {
  const [documents, setDocuments] = useState<SplitDocument[]>([]);
  const [pages, setPages] = useState<SplitPage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [blankPages, setBlankPages] = useState<Set<string>>(new Set());
  const { status, progress, message, setProcessing, setProgress, setDone, setError, reset } =
    useProcessingStore();

  const appendDocument = useCallback(
    async (pdfFile: File, password?: string) => {
      reset();
      setProcessing("Loading page previews…");

      try {
        const offset = pages.length;
        const thumbs = await renderAllPageThumbnails(
          pdfFile,
          0.25,
          (cur, total) => {
            setProgress(Math.round((cur / total) * 100), `Loading page ${offset + cur}…`);
          },
          password,
        );

        const docId = crypto.randomUUID();
        const newDoc: SplitDocument = {
          id: docId,
          file: pdfFile,
          password,
          displayName: pdfFile.name,
        };
        const newPages: SplitPage[] = thumbs.map((thumbnail, pageIndex) => ({
          id: crypto.randomUUID(),
          docId,
          pageIndex,
          thumbnail,
          rotation: 0,
        }));

        setDocuments((prev) => [...prev, newDoc]);
        setPages((prev) => [...prev, ...newPages]);
        reset();
      } catch {
        setError("Could not load this PDF.");
      }
    },
    [pages.length, reset, setError, setProcessing, setProgress],
  );

  const replaceDocuments = useCallback(
    async (files: File[]) => {
      const unlocked = await tryUnlock(files[0]);
      if (!unlocked) return;

      setDocuments([]);
      setPages([]);
      setSelected(new Set());
      setBlankPages(new Set());

      const docId = crypto.randomUUID();
      setDocuments([
        {
          id: docId,
          file: unlocked.file,
          password: unlocked.password,
          displayName: unlocked.file.name,
        },
      ]);

      reset();
      setProcessing("Loading page previews…");

      try {
        const thumbs = await renderAllPageThumbnails(
          unlocked.file,
          0.25,
          (cur, total) => {
            setProgress(Math.round((cur / total) * 100), `Loading page ${cur} of ${total}…`);
          },
          unlocked.password,
        );
        const newPages: SplitPage[] = thumbs.map((thumbnail, pageIndex) => ({
          id: crypto.randomUUID(),
          docId,
          pageIndex,
          thumbnail,
          rotation: 0,
        }));

        setPages(newPages);
        reset();
      } catch {
        setError("Could not load this PDF.");
        setDocuments([]);
        setPages([]);
      }
    },
    [reset, setError, setProcessing, setProgress, tryUnlock],
  );

  const addMoreFiles = useCallback(
    async (files: File[]) => {
      for (const incoming of files) {
        const unlocked = await tryUnlock(incoming);
        if (!unlocked) continue;
        await appendDocument(unlocked.file, unlocked.password);
      }
    },
    [appendDocument, tryUnlock],
  );

  const removeDocument = useCallback((docId: string) => {
    const removedPageIds = new Set(pages.filter((page) => page.docId === docId).map((page) => page.id));

    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    setPages((prev) => prev.filter((page) => page.docId !== docId));
    setSelected((prev) => remapPageIdSet(prev, removedPageIds));
    setBlankPages((prev) => remapPageIdSet(prev, removedPageIds));
  }, [pages]);

  const removePage = useCallback((pageId: string) => {
    const removed = new Set([pageId]);
    setPages((prev) => {
      const nextPages = prev.filter((page) => page.id !== pageId);
      setDocuments((docs) => docs.filter((doc) => nextPages.some((page) => page.docId === doc.id)));
      return nextPages;
    });
    setSelected((prev) => remapPageIdSet(prev, removed));
    setBlankPages((prev) => remapPageIdSet(prev, removed));
  }, []);

  const rotatePage = useCallback(
    async (pageId: string) => {
      const page = pages.find((entry) => entry.id === pageId);
      if (!page) return;

      const doc = documents.find((entry) => entry.id === page.docId);
      if (!doc) return;

      const rotation = nextRotation(page.rotation);
      setPages((prev) =>
        prev.map((entry) =>
          entry.id === pageId ? { ...entry, rotation, thumbnail: "" } : entry,
        ),
      );

      try {
        const thumbnail = await renderPdfPageThumbnail(
          doc.file,
          page.pageIndex,
          0.25,
          doc.password,
          rotation,
        );
        setPages((prev) =>
          prev.map((entry) => (entry.id === pageId ? { ...entry, thumbnail } : entry)),
        );
      } catch {
        setError("Could not rotate this page.");
      }
    },
    [documents, pages, setError],
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPages((prev) => {
      const oldIndex = prev.findIndex((page) => page.id === active.id);
      const newIndex = prev.findIndex((page) => page.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const togglePage = useCallback((pageId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });
  }, []);

  const loadSources = useCallback(async () => {
    const sources = new Map<string, Awaited<ReturnType<typeof loadPdfDocumentWithLib>>>();
    for (const doc of documents) {
      if (!sources.has(doc.id)) {
        sources.set(doc.id, await loadPdfDocumentWithLib(await doc.file.arrayBuffer(), doc.password));
      }
    }
    return sources;
  }, [documents]);

  const copyPage = async (
    target: Awaited<ReturnType<typeof import("pdf-lib").PDFDocument.create>>,
    page: SplitPage,
    sources: Map<string, Awaited<ReturnType<typeof loadPdfDocumentWithLib>>>,
  ) => {
    const { degrees } = await import("pdf-lib");
    const source = sources.get(page.docId);
    if (!source) return;
    const [copied] = await target.copyPages(source, [page.pageIndex]);
    if (page.rotation) {
      copied.setRotation(degrees(page.rotation));
    }
    target.addPage(copied);
  };

  const smartSplitDetect = useCallback(async () => {
    if (pages.length === 0) return;
    setProcessing("Analyzing pages for blank dividers…");

    try {
      const canvases: HTMLCanvasElement[] = [];

      for (let index = 0; index < pages.length; index++) {
        const page = pages[index];
        setProgress(
          Math.round(((index + 1) / pages.length) * 90),
          `Scanning page ${index + 1}…`,
        );
        const doc = documents.find((entry) => entry.id === page.docId);
        if (!doc) continue;

        const pdf = await loadPdfDocument(doc.file, doc.password);
        const pdfPage = await pdf.getPage(page.pageIndex + 1);
        const viewport = pdfPage.getViewport({ scale: 0.3, rotation: page.rotation });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await pdfPage.render({ canvasContext: ctx, viewport, canvas }).promise;
        canvases.push(canvas);
      }

      const results = await detectBlankPages(canvases);
      const splitIndices = suggestSplitPoints(results);
      const splitIds = new Set(splitIndices.map((index) => pages[index]?.id).filter(Boolean) as string[]);
      setBlankPages(splitIds);
      setSelected(splitIds);
      reset();
      setDone(
        splitIds.size
          ? `Found ${splitIds.size} blank divider page${splitIds.size !== 1 ? "s" : ""} — marked as split points.`
          : "No blank divider pages detected.",
      );
    } catch {
      setError("Smart split analysis failed.");
    }
  }, [documents, pages, reset, setDone, setError, setProcessing, setProgress]);

  const extract = useCallback(async () => {
    if (selected.size === 0) {
      setError("Click at least one page to extract.");
      return;
    }

    reset();
    setProcessing("Extracting selected pages…");

    try {
      const sources = await loadSources();
      const { PDFDocument } = await import("pdf-lib");
      const newDoc = await PDFDocument.create();

      for (const page of pages) {
        if (!selected.has(page.id)) continue;
        await copyPage(newDoc, page, sources);
      }

      const bytes = await newDoc.save();
      const baseName =
        documents.length === 1
          ? sanitizeFilename(documents[0].displayName.replace(/\.pdf$/i, ""))
          : "extracted-pages";
      downloadBytes(bytes, `${baseName}.pdf`, "application/pdf");
      setDone("Your extracted PDF is ready!");
    } catch {
      setError("Could not extract pages.");
    }
  }, [documents, loadSources, pages, reset, selected, setDone, setError, setProcessing]);

  const splitByInterval = useCallback(
    async (interval: number) => {
      if (pages.length === 0 || interval < 1) return;
      reset();
      setProcessing("Splitting your PDF…");

      try {
        const sources = await loadSources();
        const { PDFDocument } = await import("pdf-lib");
        const zip = new JSZip();
        const baseName =
          documents.length === 1
            ? sanitizeFilename(documents[0].displayName.replace(/\.pdf$/i, ""))
            : "combined-split";
        let part = 1;

        for (let start = 0; start < pages.length; start += interval) {
          setProgress(Math.round((start / pages.length) * 90), `Creating part ${part}…`);
          const end = Math.min(start + interval, pages.length);
          const newDoc = await PDFDocument.create();

          for (let index = start; index < end; index++) {
            await copyPage(newDoc, pages[index], sources);
          }

          zip.file(`${baseName}-part-${part}.pdf`, await newDoc.save());
          part++;
        }

        downloadBlob(await zip.generateAsync({ type: "blob" }), `${baseName}-split.zip`);
        setDone(`${part - 1} files saved in a zip!`);
      } catch {
        setError("Could not split PDF.");
      }
    },
    [documents, loadSources, pages, reset, setDone, setError, setProcessing, setProgress],
  );

  const splitAtBlankPages = useCallback(async () => {
    if (blankPages.size === 0) return;
    reset();
    setProcessing("Splitting at blank dividers…");

    try {
      const sources = await loadSources();
      const { PDFDocument } = await import("pdf-lib");
      const splitIndices = pages
        .map((page, index) => (blankPages.has(page.id) ? index : -1))
        .filter((index) => index >= 0);
      const ranges: number[][] = [];
      let start = 0;

      for (const point of splitIndices) {
        if (point > start) {
          ranges.push(Array.from({ length: point - start }, (_, i) => start + i));
        }
        start = point + 1;
      }
      if (start < pages.length) {
        ranges.push(Array.from({ length: pages.length - start }, (_, i) => start + i));
      }

      const zip = new JSZip();
      const baseName =
        documents.length === 1
          ? sanitizeFilename(documents[0].displayName.replace(/\.pdf$/i, ""))
          : "combined-split";

      for (let i = 0; i < ranges.length; i++) {
        if (ranges[i].length === 0) continue;
        const newDoc = await PDFDocument.create();

        for (const index of ranges[i]) {
          await copyPage(newDoc, pages[index], sources);
        }

        zip.file(`${baseName}-section-${i + 1}.pdf`, await newDoc.save());
      }

      downloadBlob(await zip.generateAsync({ type: "blob" }), `${baseName}-smart-split.zip`);
      setDone(`${ranges.length} sections saved!`);
    } catch {
      setError("Could not split PDF.");
    }
  }, [blankPages, documents, loadSources, pages, reset, setDone, setError, setProcessing]);

  const hasPdf = pages.length > 0;
  const isWorkspaceActive = documents.length > 0 || pages.length > 0;
  const isLoadingPages = documents.length > 0 && pages.length === 0;

  return {
    documents,
    pages,
    selected,
    blankPages,
    status,
    progress,
    message,
    hasPdf,
    isWorkspaceActive,
    isLoadingPages,
    replaceDocuments,
    addMoreFiles,
    removeDocument,
    removePage,
    rotatePage,
    handleDragEnd,
    togglePage,
    smartSplitDetect,
    extract,
    splitByInterval,
    splitAtBlankPages,
  };
}
