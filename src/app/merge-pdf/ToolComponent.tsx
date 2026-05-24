"use client";

import { useCallback, useMemo, useState } from "react";
import { Layers, RotateCw, Settings2, Trash2 } from "lucide-react";
import { ToolWorkflowLayout } from "@/components/layout/ToolWorkflowLayout";
import { ToolSidebarDocumentList } from "@/components/layout/ToolSidebarDocumentList";
import { ToolSidebarFileControls } from "@/components/layout/ToolSidebarFileControls";
import { FileUploader } from "@/components/tools/FileUploader";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { ToolButton } from "@/components/tools/ToolButton";
import { FloatingActionDock } from "@/components/ui/FloatingActionDock";
import { SidebarAccordion } from "@/components/ui/SidebarAccordion";
import {
  KBD_HINT,
  SIDEBAR_ACCORDION_ACTION,
  SIDEBAR_FOOTER,
  TOOL_SIDEBAR_CTA_CLASS,
  TOOL_THUMBNAIL_WORKSPACE,
} from "@/lib/ui/classes";
import { usePdfPasswordUnlock } from "@/hooks/usePdfPasswordUnlock";
import { useHeroFileImport } from "@/hooks/useHeroFileImport";
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

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { tryUnlock, modal } = usePdfPasswordUnlock();
  const { status, progress, message, setProcessing, setProgress, setDone, setError, reset } =
    useProcessingStore();

  const pageSelectionEnabled = viewMode === "page";

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const batchRotate = useCallback(() => {
    selectedIds.forEach((id) => rotatePage(id));
  }, [rotatePage, selectedIds]);

  const batchRemove = useCallback(() => {
    selectedIds.forEach((id) => removeItem(id));
    setSelectedIds(new Set());
  }, [removeItem, selectedIds]);

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

  useHeroFileImport("merge-pdf", addFiles);

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
      setSelectedIds(new Set());
      await addFiles(files);
    },
    [addFiles, resetWorkspace],
  );

  const canMerge = itemsOrder.length >= 2 && status !== "processing";
  const showAdvanced = documents.length > 1 || viewMode === "page";

  const workspaceTitle = useMemo(() => {
    if (documents.length === 0) return "";
    if (documents.length === 1) return `${documents[0].displayName}.pdf`;
    return `${documents.length} PDFs ready to combine`;
  }, [documents]);

  const workspaceHint =
    viewMode === "page"
      ? "Click pages to select them. Drag and drop pages to change their order."
      : "Drag files to reorder, then combine from the sidebar.";

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
            label="Drop your PDF files here"
            hint="Drag-and-drop files directly here, or click to choose them. Rearranging and combining starts instantly."
          />
        }
        workspace={
          <div className="relative flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
            <div className="shrink-0 border-b border-cream-300 pb-4">
              <h2 className="font-serif text-2xl font-bold text-forest-700">{workspaceTitle}</h2>
              <p className="mt-1 text-xs font-semibold text-ink/65">{workspaceHint}</p>
            </div>

            {loadingCount > 0 ? (
              <p className="shrink-0 text-sm font-medium text-forest-600">
                Preparing previews… ({loadingCount} file
                {loadingCount === 1 ? "" : "s"} remaining). Page thumbnails load as you scroll.
              </p>
            ) : null}

            <div className={`${TOOL_THUMBNAIL_WORKSPACE} relative`}>
              {gridItems.length > 0 ? (
                <SortableMergeGrid
                  items={gridItems}
                  onDragEnd={handleDragEnd}
                  onRemove={removeItem}
                  onRotate={viewMode === "page" ? rotatePage : undefined}
                  onRename={viewMode === "document" ? renameDocument : undefined}
                  onThumbnailLoaded={setPageThumbnail}
                  selectedIds={selectedIds}
                  selectionEnabled={pageSelectionEnabled}
                  onToggleSelect={toggleSelect}
                />
              ) : (
                <p className="py-8 text-center text-sm text-ink/50">Loading previews…</p>
              )}

              {pageSelectionEnabled ? (
                <FloatingActionDock
                  count={selectedIds.size}
                  actions={[
                    {
                      id: "rotate",
                      label: "Turn right",
                      icon: RotateCw,
                      onClick: batchRotate,
                      title: "Turn selected pages clockwise",
                    },
                    {
                      id: "delete",
                      label: "Delete",
                      icon: Trash2,
                      onClick: batchRemove,
                      variant: "danger",
                      title: "Delete selected pages",
                    },
                  ]}
                />
              ) : null}
            </div>
          </div>
        }
        sidebar={
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
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

            {pageSelectionEnabled ? (
              <SidebarAccordion
                id="organize-pages"
                title="Organize Pages"
                icon={<Layers className="h-3.5 w-3.5 text-forest-500" aria-hidden />}
                defaultOpen
              >
                <div className={SIDEBAR_ACCORDION_ACTION}>
                  <span className="flex items-center gap-2">
                    <RotateCw className="h-3.5 w-3.5 text-forest-500/70" aria-hidden />
                    Turn right
                  </span>
                  <kbd className={KBD_HINT}>R</kbd>
                </div>
                <div className={`${SIDEBAR_ACCORDION_ACTION} border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50/50`}>
                  <span className="flex items-center gap-2">
                    <Trash2 className="h-3.5 w-3.5 text-rose-500/70" aria-hidden />
                    Delete pages
                  </span>
                  <kbd className={`${KBD_HINT} text-rose-700/40`}>Del</kbd>
                </div>
                <p className="pt-1 text-[10px] font-semibold leading-relaxed text-ink/50">
                  Select pages in the grid, then use the floating toolbar or shortcuts.
                </p>
              </SidebarAccordion>
            ) : null}

            {showAdvanced ? (
              <SidebarAccordion
                id="advanced-tools"
                title="Advanced Tools"
                icon={<Settings2 className="h-3.5 w-3.5 text-forest-500" aria-hidden />}
                defaultOpen={!pageSelectionEnabled}
              >
                <div className="space-y-4">
                  <label className="flex items-start gap-3 text-sm font-semibold text-forest-700">
                    <input
                      type="checkbox"
                      checked={viewMode === "page"}
                      onChange={(event) => {
                        setPageViewMode(event.target.checked);
                        setSelectedIds(new Set());
                      }}
                      className="mt-0.5 h-4 w-4 accent-forest-600"
                    />
                    <span>
                      Show individual pages
                      <span className="mt-1 block text-xs font-normal text-ink/50">
                        Switch to page cards to mix pages, rotate, or remove individual pages before
                        merging.
                      </span>
                    </span>
                  </label>

                  <label
                    className={`flex items-start gap-3 text-sm font-semibold text-forest-700 ${
                      viewMode === "page" ? "opacity-50" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={addToc}
                      onChange={(event) => setAddToc(event.target.checked)}
                      disabled={viewMode === "page"}
                      className="mt-0.5 h-4 w-4 accent-forest-600"
                    />
                    <span>
                      Auto-generate Table of Contents page
                      <span className="mt-1 block text-xs font-normal text-ink/50">
                        {viewMode === "page"
                          ? "Available in document view only."
                          : "Click a document title on its card to rename the TOC entry before merging."}
                      </span>
                    </span>
                  </label>

                  <div className="space-y-2 border-t border-cream-300 pt-4">
                    <p className="text-sm font-bold text-forest-700">Auto-Remove Blank Pages</p>
                    <p className="text-xs text-ink/50">
                      Detects near-white scanner blank backsides and removes them from the merge order.
                    </p>
                    <ToolButton
                      variant="secondary"
                      onClick={handleRemoveBlanks}
                      disabled={blankScanning || allPages.length === 0 || status === "processing"}
                      className="w-full"
                    >
                      {blankScanning ? "Scanning…" : "Remove Blank Pages"}
                    </ToolButton>
                  </div>
                </div>
              </SidebarAccordion>
            ) : (
              <p className="text-sm text-ink/50">
                Add at least two PDFs to unlock merge options and advanced tools.
              </p>
            )}

            {status === "processing" ? <ProgressBar progress={progress} label={message} /> : null}

            <div className={TOOL_SIDEBAR_CTA_CLASS}>
              <ToolButton onClick={merge} disabled={!canMerge} className="w-full">
                Combine PDFs
              </ToolButton>
            </div>

            <div className={SIDEBAR_FOOTER}>
              <div className="flex justify-between">
                <span>In merge order:</span>
                <span className="font-extrabold text-forest-700">
                  {itemsOrder.length} item{itemsOrder.length === 1 ? "" : "s"}
                </span>
              </div>
              {pageSelectionEnabled ? (
                <div className="flex justify-between">
                  <span>Selected:</span>
                  <span className="font-extrabold text-forest-700">
                    {selectedIds.size} of {itemsOrder.length}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        }
      />
      {modal}
    </>
  );
}
