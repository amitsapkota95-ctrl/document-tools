"use client";

import { useCallback } from "react";
import { ToolWorkflowLayout } from "@/components/layout/ToolWorkflowLayout";
import { ToolSidebarDocumentList } from "@/components/layout/ToolSidebarDocumentList";
import { ToolSidebarFileControls } from "@/components/layout/ToolSidebarFileControls";
import { FileUploader } from "@/components/tools/FileUploader";
import { AdvancedToolsToggle } from "@/components/tools/AdvancedToolsToggle";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { ToolButton } from "@/components/tools/ToolButton";
import { TOOL_SIDEBAR_CTA_CLASS, TOOL_THUMBNAIL_WORKSPACE } from "@/lib/ui/classes";
import { usePdfPasswordUnlock } from "@/hooks/usePdfPasswordUnlock";
import { SortableMergeGrid } from "@/app/merge-pdf/components/SortableMergeGrid";
import { useMergePdfState } from "@/app/merge-pdf/useMergePdfState";
import { downloadBytes, sanitizeFilename } from "@/lib/pdf/download";
import { mergePdfByOrder } from "@/lib/pdf/merge-by-order";
import { useProcessingStore } from "@/stores/processing-store";

export default function MergePdfTool() {
  const {
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
  } = useMergePdfState();

  const { tryUnlock, modal } = usePdfPasswordUnlock();
  const { status, progress, message, setProcessing, setProgress, setDone, setError, reset } =
    useProcessingStore();

  const addFiles = useCallback(
    async (incoming: File[]) => {
      for (const file of incoming) {
        const unlocked = await tryUnlock(file);
        if (!unlocked) continue;
        await addDocument(unlocked.file, unlocked.password);
      }
    },
    [addDocument, tryUnlock],
  );

  const merge = async () => {
    if (itemsOrder.length < 2) {
      setError("Add at least two items to combine.");
      return;
    }

    reset();
    setProcessing("Combining your PDFs…");

    try {
      const result = await mergePdfByOrder({
        documents,
        allPages,
        itemsOrder,
        viewMode,
        addToc: addToc && viewMode === "document",
        onProgress: (value, msg) => setProgress(value, msg),
      });

      setProgress(98, "Preparing download…");
      const firstDoc = documents[0];
      const baseName = firstDoc
        ? sanitizeFilename(firstDoc.displayName || firstDoc.name.replace(/\.pdf$/i, ""))
        : "combined";
      downloadBytes(result, `${baseName}-combined.pdf`, "application/pdf");

      setDone(
        addToc && viewMode === "document" && documents.length > 1
          ? "Combined PDF ready with Table of Contents page!"
          : "Your combined PDF is ready!",
      );
    } catch {
      setError("Something went wrong while combining PDFs. Please try again.");
    }
  };

  const handleRemoveBlanks = async () => {
    try {
      const removed = await removeBlankPages();
      if (removed > 0) {
        setDone(
          `Removed ${removed} blank page${removed === 1 ? "" : "s"}. Switched to page view so you can review the order.`,
        );
      } else {
        setDone("No blank pages detected.");
      }
    } catch {
      setError("Could not scan for blank pages. Please try again.");
    }
  };

  const replaceAll = useCallback(
    async (files: File[]) => {
      resetWorkspace();
      await addFiles(files);
    },
    [addFiles, resetWorkspace],
  );

  const canMerge = itemsOrder.length >= 2 && status !== "processing";
  const showAdvanced = documents.length > 1 || viewMode === "page";

  return (
    <>
      <ToolWorkflowLayout
        hasFiles={documents.length > 0}
        sidebarLabel="Merge options"
        upload={
          <FileUploader
            onFiles={addFiles}
            accept={{ "application/pdf": [".pdf"] }}
            multiple
            label="Drop PDF files here"
            hint="Add two or more PDFs to combine them in order"
          />
        }
        workspace={
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
            <p className="shrink-0 text-sm text-sand">
              {viewMode === "page"
                ? "Drag thumbnails to reorder, use the icons to rotate or remove pages, then combine from the sidebar."
                : "Drag thumbnails to reorder files, use the icons to remove files, then combine from the sidebar."}
            </p>
            {loadingCount > 0 ? (
              <p className="shrink-0 text-sm font-medium text-forest-muted">
                Preparing previews… ({loadingCount} file
                {loadingCount === 1 ? "" : "s"} remaining). Page thumbnails load as you scroll.
              </p>
            ) : null}

            <div className={TOOL_THUMBNAIL_WORKSPACE}>
              {gridItems.length > 0 ? (
                <SortableMergeGrid
                  items={gridItems}
                  onDragEnd={handleDragEnd}
                  onRemove={removeItem}
                  onRotate={viewMode === "page" ? rotatePage : undefined}
                  onRename={viewMode === "document" ? renameDocument : undefined}
                  onThumbnailLoaded={setPageThumbnail}
                />
              ) : (
                <p className="py-8 text-center text-sm text-sand">
                  Loading previews…
                </p>
              )}
            </div>
          </div>
        }
        sidebar={
          <>
            <ToolSidebarFileControls
              mode="multi"
              accept={{ "application/pdf": [".pdf"] }}
              onAdd={addFiles}
              onReplace={replaceAll}
              disabled={status === "processing"}
              addLabel="Add PDF"
              replaceLabel="Replace all"
            />

            <ToolSidebarDocumentList
              documents={documents.map((doc) => ({
                id: doc.id,
                displayName: doc.displayName,
                pageCount: doc.totalPages,
              }))}
              onRemove={removeDocument}
              disabled={status === "processing"}
            />

            {showAdvanced ? (
              <AdvancedToolsToggle variant="sidebar" label="Advanced Tools">
                <label className="flex items-start gap-3 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={viewMode === "page"}
                    onChange={(event) => setPageViewMode(event.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-sage"
                  />
                  <span>
                    Show individual pages
                    <span className="mt-1 block text-xs font-normal text-sand-light">
                      Switch to page cards to mix pages, rotate, or remove individual pages before
                      merging.
                    </span>
                  </span>
                </label>

                <label
                  className={`flex items-start gap-3 text-sm font-semibold ${
                    viewMode === "page" ? "opacity-50" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={addToc}
                    onChange={(event) => setAddToc(event.target.checked)}
                    disabled={viewMode === "page"}
                    className="mt-0.5 h-4 w-4 accent-sage"
                  />
                  <span>
                    Auto-generate Table of Contents page
                    <span className="mt-1 block text-xs font-normal text-sand-light">
                      {viewMode === "page"
                        ? "Available in document view only."
                        : "Click a document title on its card to rename the TOC entry before merging."}
                    </span>
                  </span>
                </label>

                <div className="space-y-2 border-t border-moss/40 pt-4">
                  <p className="text-sm font-semibold text-forest">Auto-Remove Blank Pages</p>
                  <p className="text-xs text-sand-light">
                    Detects near-white scanner blank backsides and removes them from the merge order.
                  </p>
                  <ToolButton
                    variant="secondary"
                    onClick={handleRemoveBlanks}
                    disabled={blankScanning || allPages.length === 0 || status === "processing"}
                  >
                    {blankScanning ? "Scanning…" : "Remove Blank Pages"}
                  </ToolButton>
                </div>
              </AdvancedToolsToggle>
            ) : (
              <p className="text-sm text-sand">
                Add at least two PDFs to unlock merge options and advanced tools.
              </p>
            )}

            {status === "processing" ? <ProgressBar progress={progress} label={message} /> : null}

            <div className={TOOL_SIDEBAR_CTA_CLASS}>
              <ToolButton onClick={merge} disabled={!canMerge} className="w-full">
                Combine PDFs
              </ToolButton>
            </div>
          </>
        }
      />
      {modal}
    </>
  );
}
