"use client";

import { useCallback, useState } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import JSZip from "jszip";
import type { PageRotation, SplitDocument, SplitPage } from "@/app/split-pdf/types";
import { downloadBlob } from "@/lib/pdf/download";
import { loadPdfDocument } from "@/lib/pdf/load-pdfjs";
import { renderAllPageThumbnails, renderPdfPageThumbnail } from "@/lib/pdf/thumbnails";
import { useProcessingStore } from "@/stores/processing-store";

export type ImageFormat = "png" | "jpeg";

function nextRotation(current: PageRotation): PageRotation {
  if (current === 0) return 90;
  if (current === 90) return 180;
  if (current === 180) return 270;
  return 0;
}

export function usePdfToImageState(
  tryUnlock: (file: File) => Promise<{ file: File; password?: string } | null>,
) {
  const [documents, setDocuments] = useState<SplitDocument[]>([]);
  const [pages, setPages] = useState<SplitPage[]>([]);
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

  const replaceDocument = useCallback(
    async (files: File[]) => {
      const unlocked = await tryUnlock(files[0]);
      if (!unlocked) return;

      setDocuments([]);
      setPages([]);

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

  const loadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      await replaceDocument([files[0]]);
      if (files.length > 1) {
        await addMoreFiles(files.slice(1));
      }
    },
    [addMoreFiles, replaceDocument],
  );

  const removeDocument = useCallback(
    (docId: string) => {
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      setPages((prev) => prev.filter((page) => page.docId !== docId));
    },
    [],
  );

  const removePage = useCallback((pageId: string) => {
    setPages((prev) => {
      const nextPages = prev.filter((page) => page.id !== pageId);
      setDocuments((docs) => docs.filter((doc) => nextPages.some((page) => page.docId === doc.id)));
      return nextPages;
    });
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

  const exportImages = useCallback(
    async (format: ImageFormat, proOutput: boolean) => {
      if (documents.length === 0 || pages.length === 0) {
        setError("Add at least one page to export.");
        return;
      }

      reset();
      setProcessing(proOutput ? "Rendering print-ready pages…" : "Saving pages as images…");

      try {
        const pdfByDocId = new Map<string, Awaited<ReturnType<typeof loadPdfDocument>>>();
        for (const doc of documents) {
          pdfByDocId.set(doc.id, await loadPdfDocument(doc.file, doc.password));
        }

        const total = pages.length;
        const baseName =
          documents.length === 1
            ? documents[0].displayName.replace(/\.pdf$/i, "")
            : "pdf-pages";
        const scale = proOutput ? 600 / 72 : 2;
        const mime = format === "png" ? "image/png" : "image/jpeg";
        const quality = proOutput ? 1.0 : 0.92;
        const suffix = proOutput ? "-600dpi" : "";

        const renderPage = async (page: SplitPage) => {
          const pdf = pdfByDocId.get(page.docId);
          if (!pdf) throw new Error("Missing source PDF.");

          const pdfPage = await pdf.getPage(page.pageIndex + 1);
          const viewport = pdfPage.getViewport({ scale, rotation: page.rotation });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Could not create canvas.");

          await pdfPage.render({ canvasContext: ctx, viewport, canvas }).promise;
          return new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image."))),
              mime,
              quality,
            );
          });
        };

        if (total === 1) {
          const blob = await renderPage(pages[0]);
          downloadBlob(blob, `${baseName}${suffix}.${format}`);
        } else {
          const zip = new JSZip();
          for (let i = 0; i < pages.length; i++) {
            setProgress(
              Math.round(((i + 1) / total) * 90),
              `Saving page ${i + 1} of ${total}…`,
            );
            const blob = await renderPage(pages[i]);
            zip.file(`${baseName}-page-${i + 1}${suffix}.${format}`, blob);
          }
          downloadBlob(await zip.generateAsync({ type: "blob" }), `${baseName}-images.zip`);
        }

        setDone(
          `${total} page${total !== 1 ? "s" : ""} saved at ${proOutput ? "600 DPI" : "standard quality"}!`,
        );
      } catch {
        setError("Could not convert PDF. Please try another file.");
      }
    },
    [documents, pages, reset, setDone, setError, setProcessing, setProgress],
  );

  const hasPdf = pages.length > 0;
  const isWorkspaceActive = documents.length > 0 || pages.length > 0;
  const isLoadingPages = documents.length > 0 && pages.length === 0;

  return {
    documents,
    pages,
    status,
    progress,
    message,
    hasPdf,
    isWorkspaceActive,
    isLoadingPages,
    replaceDocument,
    loadFiles,
    addMoreFiles,
    removeDocument,
    removePage,
    rotatePage,
    handleDragEnd,
    exportImages,
  };
}
