"use client";

import { useState } from "react";
import { SplitPageGrid } from "@/app/split-pdf/components/SplitPageGrid";
import { usePdfToImageState, type ImageFormat } from "@/app/pdf-to-image/usePdfToImageState";
import { ToolWorkflowLayout } from "@/components/layout/ToolWorkflowLayout";
import { ToolSidebarDocumentList } from "@/components/layout/ToolSidebarDocumentList";
import { ToolSidebarFileControls } from "@/components/layout/ToolSidebarFileControls";
import { AdvancedToolsToggle } from "@/components/tools/AdvancedToolsToggle";
import { FileUploader } from "@/components/tools/FileUploader";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { ToolButton } from "@/components/tools/ToolButton";
import { usePdfPasswordUnlock } from "@/hooks/usePdfPasswordUnlock";
import { useHeroFileImport } from "@/hooks/useHeroFileImport";
import { TOOL_SIDEBAR_CTA_CLASS, TOOL_THUMBNAIL_WORKSPACE } from "@/lib/ui/classes";

export default function PdfToImageTool() {
  const { tryUnlock, modal } = usePdfPasswordUnlock();
  const [format, setFormat] = useState<ImageFormat>("png");
  const [proOutput, setProOutput] = useState(false);

  const {
    documents,
    pages,
    status,
    progress,
    message,
    hasPdf,
    isWorkspaceActive,
    isLoadingPages,
    loadFiles,
    addMoreFiles,
    removeDocument,
    removePage,
    rotatePage,
    handleDragEnd,
    exportImages,
  } = usePdfToImageState(tryUnlock);

  useHeroFileImport("pdf-to-image", loadFiles);

  return (
    <>
      <ToolWorkflowLayout
        hasFiles={isWorkspaceActive}
        sidebarLabel="Export options"
        upload={
          <FileUploader
            onFiles={loadFiles}
            accept={{ "application/pdf": [".pdf"] }}
            multiple
            label="Drop PDF files here"
            hint="Add one or more PDFs — every page becomes an image you can reorder"
          />
        }
        workspace={
          hasPdf ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
              <p className="shrink-0 text-sm text-ink/60">
                Drag thumbnails to reorder pages from all uploaded PDFs, use the icons to rotate or remove
                pages, then download your images from the sidebar.
              </p>
              <div className={TOOL_THUMBNAIL_WORKSPACE}>
                <SplitPageGrid
                  pages={pages}
                  documents={documents}
                  selected={new Set()}
                  blankPages={new Set()}
                  selectionEnabled={false}
                  onDragEnd={handleDragEnd}
                  onToggleSelect={() => {}}
                  onRemovePage={removePage}
                  onRotatePage={rotatePage}
                />
              </div>
            </div>
          ) : isLoadingPages ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
              {status === "processing" ? (
                <ProgressBar progress={progress} label={message} />
              ) : (
                <p className="text-sm text-ink/60">Loading page previews…</p>
              )}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-ink/60">
              All pages were removed. Add a PDF from the sidebar to continue.
            </p>
          )
        }
        sidebar={
          <>
            <ToolSidebarFileControls
              mode="multi"
              accept={{ "application/pdf": [".pdf"] }}
              onAdd={addMoreFiles}
              onReplace={loadFiles}
              disabled={status === "processing"}
              addLabel="Add PDF"
              replaceLabel="Replace all"
            />

            {documents.length > 0 ? (
              <ToolSidebarDocumentList
                documents={documents.map((doc) => ({
                  id: doc.id,
                  displayName: doc.displayName,
                  pageCount: pages.filter((page) => page.docId === doc.id).length,
                }))}
                onRemove={removeDocument}
                disabled={status === "processing"}
              />
            ) : null}

            {hasPdf ? (
              <>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-semibold">Save as</legend>
                  {(["png", "jpeg"] as const).map((option) => (
                    <label key={option} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={format === option}
                        onChange={() => setFormat(option)}
                        className="h-4 w-4 accent-forest-600"
                        disabled={status === "processing"}
                      />
                      {option.toUpperCase()}
                    </label>
                  ))}
                </fieldset>

                <p className="text-sm text-ink/60">
                  {pages.length} page{pages.length !== 1 ? "s" : ""} ready to export
                  {proOutput ? " at 600 DPI" : ""}
                </p>

                <AdvancedToolsToggle variant="sidebar" label="More options">
                  <label className="flex items-start gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={proOutput}
                      onChange={(event) => setProOutput(event.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-forest-600"
                      disabled={status === "processing"}
                    />
                    <span>
                      High-resolution export (600 DPI)
                      <span className="mt-1 block text-xs font-normal text-ink/50">
                        Best for print. Creates larger files and takes longer to process.
                      </span>
                    </span>
                  </label>
                </AdvancedToolsToggle>
              </>
            ) : null}

            {status === "processing" ? <ProgressBar progress={progress} label={message} /> : null}

            {hasPdf ? (
              <div className={TOOL_SIDEBAR_CTA_CLASS}>
                <ToolButton
                  onClick={() => exportImages(format, proOutput)}
                  disabled={pages.length === 0 || status === "processing"}
                  className="w-full"
                >
                  {pages.length <= 1 ? "Download Image" : "Download Zip File"}
                </ToolButton>
              </div>
            ) : null}
          </>
        }
      />
      {modal}
    </>
  );
}
