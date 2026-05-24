"use client";

import { useState } from "react";
import { ToolWorkflowLayout } from "@/components/layout/ToolWorkflowLayout";
import { ToolSidebarDocumentList } from "@/components/layout/ToolSidebarDocumentList";
import { ToolSidebarFileControls } from "@/components/layout/ToolSidebarFileControls";
import { SplitPageGrid } from "@/app/split-pdf/components/SplitPageGrid";
import { useSplitPdfState } from "@/app/split-pdf/useSplitPdfState";
import { AdvancedToolsToggle } from "@/components/tools/AdvancedToolsToggle";
import { FileUploader } from "@/components/tools/FileUploader";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { ToolButton } from "@/components/tools/ToolButton";
import { usePdfPasswordUnlock } from "@/hooks/usePdfPasswordUnlock";
import { useHeroFileImport } from "@/hooks/useHeroFileImport";
import {
  TAB_ACTIVE,
  TAB_INACTIVE,
  INPUT_CLASS,
  TOOL_SIDEBAR_CTA_CLASS,
  TOOL_THUMBNAIL_WORKSPACE,
} from "@/lib/ui/classes";

type SplitMode = "extract" | "interval";

export default function SplitPdfTool() {
  const { tryUnlock, modal } = usePdfPasswordUnlock();
  const [mode, setMode] = useState<SplitMode>("extract");
  const [interval, setInterval] = useState(2);

  const {
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
  } = useSplitPdfState(tryUnlock);

  const selectionEnabled = mode === "extract";

  useHeroFileImport("split-pdf", replaceDocuments);

  return (
    <>
      <ToolWorkflowLayout
        hasFiles={isWorkspaceActive}
        sidebarLabel="Split options"
        upload={
          <FileUploader
            onFiles={replaceDocuments}
            accept={{ "application/pdf": [".pdf"] }}
            label="Drop PDF files here"
            hint="We'll show every page so you can pick what to extract"
          />
        }
        workspace={
          hasPdf ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
              <p className="shrink-0 text-sm text-ink/60">
                {mode === "extract"
                  ? "Drag thumbnails to reorder, use the icons to rotate or remove pages, and click thumbnails to select pages for extraction."
                  : documents.length > 1
                    ? "Drag thumbnails to reorder pages, use the icons to rotate or remove pages, then split every N pages into a zip file."
                    : "Drag thumbnails to reorder pages, use the icons to rotate or remove pages, then split every N pages into a zip file."}
              </p>
              <div className={TOOL_THUMBNAIL_WORKSPACE}>
                <SplitPageGrid
                  pages={pages}
                  documents={documents}
                  selected={selected}
                  blankPages={blankPages}
                  selectionEnabled={selectionEnabled}
                  onDragEnd={handleDragEnd}
                  onToggleSelect={togglePage}
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
              onReplace={replaceDocuments}
              disabled={status === "processing"}
            />

            <ToolSidebarDocumentList
              documents={documents.map((doc) => ({
                id: doc.id,
                displayName: doc.displayName,
                pageCount: pages.filter((page) => page.docId === doc.id).length,
              }))}
              onRemove={removeDocument}
              disabled={status === "processing"}
            />

            {hasPdf ? (
              <>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("extract")}
                    className={`px-4 py-2 text-sm font-semibold ${mode === "extract" ? TAB_ACTIVE : TAB_INACTIVE}`}
                  >
                    Extract Pages
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("interval")}
                    className={`px-4 py-2 text-sm font-semibold ${mode === "interval" ? TAB_ACTIVE : TAB_INACTIVE}`}
                  >
                    Split Every N Pages
                  </button>
                </div>

                {mode === "interval" ? (
                  <label className="block text-sm">
                    Split every
                    <input
                      type="number"
                      min={1}
                      value={interval}
                      onChange={(e) => setInterval(Number(e.target.value))}
                      className={`${INPUT_CLASS} mx-2 inline-block w-20`}
                    />
                    pages
                  </label>
                ) : null}

                <AdvancedToolsToggle variant="sidebar" label="Advanced Tools">
                  <p className="text-sm text-ink/60">
                    Smart Split detects completely blank pages and suggests natural chapter breaks.
                  </p>
                  <ToolButton
                    variant="secondary"
                    onClick={smartSplitDetect}
                    disabled={status === "processing"}
                  >
                    Smart Split — Detect Blank Pages
                  </ToolButton>
                  {blankPages.size > 0 ? (
                    <ToolButton onClick={splitAtBlankPages} disabled={status === "processing"}>
                      Split at {blankPages.size} Blank Divider{blankPages.size !== 1 ? "s" : ""}
                    </ToolButton>
                  ) : null}
                </AdvancedToolsToggle>
              </>
            ) : null}

            {status === "processing" ? <ProgressBar progress={progress} label={message} /> : null}

            {hasPdf ? (
              <div className={TOOL_SIDEBAR_CTA_CLASS}>
                {mode === "extract" ? (
                  <ToolButton
                    onClick={extract}
                    disabled={selected.size === 0 || status === "processing"}
                    className="w-full"
                  >
                    Extract {selected.size || ""} Page{selected.size !== 1 ? "s" : ""}
                  </ToolButton>
                ) : (
                  <ToolButton
                    onClick={() => splitByInterval(interval)}
                    disabled={status === "processing"}
                    className="w-full"
                  >
                    Split into Zip File
                  </ToolButton>
                )}
              </div>
            ) : null}
          </>
        }
      />
      {modal}
    </>
  );
}
