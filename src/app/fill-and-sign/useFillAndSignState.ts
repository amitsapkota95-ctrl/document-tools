"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_SIGNATURE_HEIGHT,
  DEFAULT_SIGNATURE_WIDTH,
  type PageRenderInfo,
  type PlacedSignature,
  type SignDocumentEntry,
  type SignaturePlacementSize,
} from "@/app/fill-and-sign/types";
import { loadPdfDocument } from "@/lib/pdf/load-pdfjs";
import { renderPdfPageToCanvas } from "@/lib/pdf/render-page-to-canvas";
import {
  SIGN_PAGE_RENDER_SCALE,
  computeSignPageDisplaySize,
} from "@/app/fill-and-sign/sign-page-display";

function getRelativePlacement(
  signature: Pick<PlacedSignature, "x" | "y" | "width" | "height">,
  page: PageRenderInfo,
) {
  return {
    xRatio: signature.x / page.displayWidth,
    yRatio: signature.y / page.displayHeight,
    widthRatio: signature.width / page.displayWidth,
    heightRatio: signature.height / page.displayHeight,
  };
}

function placementFromRatios(
  ratios: { xRatio: number; yRatio: number; widthRatio: number; heightRatio: number },
  page: PageRenderInfo,
) {
  return {
    x: ratios.xRatio * page.displayWidth,
    y: ratios.yRatio * page.displayHeight,
    width: ratios.widthRatio * page.displayWidth,
    height: ratios.heightRatio * page.displayHeight,
  };
}

function displayNameFromFile(file: File): string {
  return file.name.replace(/\.pdf$/i, "") || file.name;
}

async function renderDocumentPages(
  doc: SignDocumentEntry,
  globalStartIndex: number,
): Promise<PageRenderInfo[]> {
  const pdf = await loadPdfDocument(doc.file, doc.password);
  const renderedPages: PageRenderInfo[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const canvas = await renderPdfPageToCanvas(page, SIGN_PAGE_RENDER_SCALE);
    const pdfViewport = page.getViewport({ scale: 1 });
    const naturalWidth =
      parseFloat(canvas.style.width) || canvas.width / (window.devicePixelRatio || 1);
    const naturalHeight =
      parseFloat(canvas.style.height) || canvas.height / (window.devicePixelRatio || 1);
    const { displayWidth, displayHeight } = computeSignPageDisplaySize(
      naturalWidth,
      naturalHeight,
    );

    renderedPages.push({
      pageIndex: globalStartIndex + pageNumber - 1,
      sourceDocId: doc.id,
      sourcePageIndex: pageNumber - 1,
      dataUrl: canvas.toDataURL("image/jpeg", 0.92),
      displayWidth,
      displayHeight,
      pdfWidth: pdfViewport.width,
      pdfHeight: pdfViewport.height,
    });
  }

  return renderedPages;
}

function reindexAfterPageRemoval(
  pages: PageRenderInfo[],
  signatures: PlacedSignature[],
  removedPageIndices: Set<number>,
) {
  const indexMap = new Map<number, number>();
  let nextIndex = 0;

  for (const page of [...pages].sort((a, b) => a.pageIndex - b.pageIndex)) {
    if (removedPageIndices.has(page.pageIndex)) continue;
    indexMap.set(page.pageIndex, nextIndex++);
  }

  const nextPages = pages
    .filter((page) => !removedPageIndices.has(page.pageIndex))
    .map((page) => ({ ...page, pageIndex: indexMap.get(page.pageIndex)! }))
    .sort((a, b) => a.pageIndex - b.pageIndex);

  const nextSignatures = signatures
    .filter((signature) => !removedPageIndices.has(signature.pageIndex))
    .map((signature) => ({
      ...signature,
      pageIndex: indexMap.get(signature.pageIndex)!,
    }));

  return { nextPages, nextSignatures };
}

export function useFillAndSignState() {
  const [documents, setDocuments] = useState<SignDocumentEntry[]>([]);
  const [pages, setPages] = useState<PageRenderInfo[]>([]);
  const [placedSignatures, setPlacedSignatures] = useState<PlacedSignature[]>([]);
  const [activeSignatureId, setActiveSignatureId] = useState<string | null>(null);
  const [visiblePageIndex, setVisiblePageIndex] = useState(0);
  const [loadingPages, setLoadingPages] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const pagesRef = useRef(pages);
  pagesRef.current = pages;

  const registerPageRef = useCallback((pageIndex: number, node: HTMLDivElement | null) => {
    if (node) {
      pageRefs.current.set(pageIndex, node);
    } else {
      pageRefs.current.delete(pageIndex);
    }
  }, []);

  useEffect(() => {
    if (pages.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          const pageIndex = Number(visible[0].target.getAttribute("data-page-index"));
          if (!Number.isNaN(pageIndex)) {
            setVisiblePageIndex(pageIndex);
          }
        }
      },
      { threshold: [0.35, 0.5, 0.75] },
    );

    for (const node of pageRefs.current.values()) {
      observer.observe(node);
    }

    return () => observer.disconnect();
  }, [pages]);

  const addDocument = useCallback(async (pdfFile: File, password?: string) => {
    const entry: SignDocumentEntry = {
      id: crypto.randomUUID(),
      file: pdfFile,
      password,
      displayName: displayNameFromFile(pdfFile),
      pageCount: 0,
    };

    setLoadingPages(true);

    try {
      const startIndex = pagesRef.current.length;
      const renderedPages = await renderDocumentPages(entry, startIndex);
      entry.pageCount = renderedPages.length;

      setDocuments((prev) => [...prev, entry]);
      setPages((prev) => [...prev, ...renderedPages]);
    } finally {
      setLoadingPages(false);
    }
  }, []);

  const removeDocument = useCallback((docId: string) => {
    const prevPages = pagesRef.current;
    const removedPageIndices = new Set(
      prevPages.filter((page) => page.sourceDocId === docId).map((page) => page.pageIndex),
    );

    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    setPages((prevPagesState) => {
      const { nextPages } = reindexAfterPageRemoval(prevPagesState, [], removedPageIndices);
      return nextPages;
    });
    setPlacedSignatures((prevSignatures) => {
      const { nextSignatures } = reindexAfterPageRemoval(
        prevPages,
        prevSignatures,
        removedPageIndices,
      );
      return nextSignatures;
    });
    setActiveSignatureId(null);
    setVisiblePageIndex(0);
  }, []);

  const placeSignature = useCallback(
    (dataUrl: string, label: string, size?: SignaturePlacementSize) => {
      const page = pages.find((entry) => entry.pageIndex === visiblePageIndex) ?? pages[0];
      if (!page) return;

      const width = Math.min(size?.width ?? DEFAULT_SIGNATURE_WIDTH, page.displayWidth * 0.85);
      const height = Math.min(size?.height ?? DEFAULT_SIGNATURE_HEIGHT, page.displayHeight * 0.35);
      const id = crypto.randomUUID();

      const nextSignature: PlacedSignature = {
        id,
        pageIndex: page.pageIndex,
        dataUrl,
        label,
        x: (page.displayWidth - width) / 2,
        y: (page.displayHeight - height) / 2,
        width,
        height,
      };

      setPlacedSignatures((prev) => [...prev, nextSignature]);
      setActiveSignatureId(id);
    },
    [pages, visiblePageIndex],
  );

  const updateSignature = useCallback((id: string, patch: Partial<PlacedSignature>) => {
    setPlacedSignatures((prev) =>
      prev.map((signature) => (signature.id === id ? { ...signature, ...patch } : signature)),
    );
  }, []);

  const removeSignature = useCallback((id: string) => {
    setPlacedSignatures((prev) => prev.filter((signature) => signature.id !== id));
    setActiveSignatureId((current) => (current === id ? null : current));
  }, []);

  const applySignatureToAllPages = useCallback(
    (id: string) => {
      if (pages.length === 0) return 0;

      let applied = false;
      setPlacedSignatures((prev) => {
        const source = prev.find((signature) => signature.id === id);
        const sourcePage = pages.find((page) => page.pageIndex === source?.pageIndex);
        if (!source || !sourcePage) return prev;

        applied = true;
        const ratios = getRelativePlacement(source, sourcePage);
        const remaining = prev.filter(
          (signature) => signature.id === source.id || signature.dataUrl !== source.dataUrl,
        );

        const clones = pages
          .filter((page) => page.pageIndex !== source.pageIndex)
          .map((page) => ({
            id: crypto.randomUUID(),
            pageIndex: page.pageIndex,
            dataUrl: source.dataUrl,
            label: source.label,
            ...placementFromRatios(ratios, page),
          }));

        return [...remaining, ...clones];
      });

      return applied ? pages.length : 0;
    },
    [pages],
  );

  const resetWorkspace = useCallback(() => {
    setDocuments([]);
    setPages([]);
    setPlacedSignatures([]);
    setActiveSignatureId(null);
    setVisiblePageIndex(0);
    setShowVaultModal(false);
    pageRefs.current.clear();
  }, []);

  return {
    documents,
    pages,
    placedSignatures,
    activeSignatureId,
    visiblePageIndex,
    loadingPages,
    showVaultModal,
    addDocument,
    removeDocument,
    registerPageRef,
    placeSignature,
    updateSignature,
    removeSignature,
    applySignatureToAllPages,
    setActiveSignatureId,
    setShowVaultModal,
    resetWorkspace,
  };
}
