"use client";

import { useCallback, useState } from "react";
import { ToolWorkflowLayout } from "@/components/layout/ToolWorkflowLayout";
import { ToolSidebarFileControls } from "@/components/layout/ToolSidebarFileControls";
import {
  PdfCanvasEditor,
  canvasBoxToPdfPoints,
  type BoundingBox,
} from "@/components/tools/pdf-canvas/PdfCanvasEditor";
import { AdvancedToolsToggle } from "@/components/tools/AdvancedToolsToggle";
import { FileUploader } from "@/components/tools/FileUploader";
import { ToolButton } from "@/components/tools/ToolButton";
import { PdfEditorWorkspace } from "@/components/tools/PdfEditorWorkspace";
import { usePdfPasswordUnlock } from "@/hooks/usePdfPasswordUnlock";
import { useHeroFileImport } from "@/hooks/useHeroFileImport";
import { TOOL_SIDEBAR_CTA_CLASS } from "@/lib/ui/classes";
import { detectContentBounds } from "@/lib/image/scanner-filter";
import { downloadBytes, sanitizeFilename } from "@/lib/pdf/download";
import { loadPdfDocument } from "@/lib/pdf/load-pdfjs";
import { loadPdfDocumentWithLib } from "@/lib/pdf/load-pdf-lib";
import { useProcessingStore } from "@/stores/processing-store";

export default function CropPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfPassword, setPdfPassword] = useState<string>();
  const { tryUnlock, modal } = usePdfPasswordUnlock();
  const [cropBox, setCropBox] = useState<BoundingBox | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [applyAll, setApplyAll] = useState(true);
  const { status, setProcessing, setDone, setError, reset } = useProcessingStore();

  const applyCrop = async () => {
    if (!file || !cropBox || canvasSize.width === 0) {
      setError("Draw a crop area on the page first.");
      return;
    }

    reset();
    setProcessing();

    try {
      const doc = await loadPdfDocumentWithLib(await file.arrayBuffer(), pdfPassword);
      const pages = applyAll ? doc.getPages() : [doc.getPage(0)];

      for (const page of pages) {
        const { width, height } = page.getSize();
        const pdfBox = canvasBoxToPdfPoints(
          cropBox,
          canvasSize.width,
          canvasSize.height,
          width,
          height,
        );
        page.setCropBox(pdfBox.x, pdfBox.y, pdfBox.width, pdfBox.height);
        page.setMediaBox(pdfBox.x, pdfBox.y, pdfBox.width, pdfBox.height);
      }

      const result = await doc.save();
      const baseName = sanitizeFilename(file.name.replace(/\.pdf$/i, ""));
      downloadBytes(result, `${baseName}-cropped.pdf`, "application/pdf");
      setDone("Your cropped PDF is ready!");
    } catch {
      setError("Could not crop PDF. Please try again.");
    }
  };

  const autoTrim = async () => {
    if (!file) return;
    const pdf = await loadPdfDocument(file, pdfPassword);
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const bounds = detectContentBounds(canvas);
    setCropBox(bounds);
    setCanvasSize({ width: viewport.width, height: viewport.height });
  };

  const loadPdf = useCallback(
    async (files: File[]) => {
      const unlocked = await tryUnlock(files[0]);
      if (!unlocked) return;
      setFile(unlocked.file);
      setPdfPassword(unlocked.password);
      setCropBox(null);
      reset();
    },
    [reset, tryUnlock],
  );

  useHeroFileImport("crop-pdf", loadPdf);

  return (
    <>
      <ToolWorkflowLayout
        hasFiles={!!file}
        sidebarLabel="Crop options"
        upload={
          <FileUploader
            onFiles={loadPdf}
            accept={{ "application/pdf": [".pdf"] }}
            label="Drop PDF files here"
            hint="Drag a box around the area to keep"
          />
        }
        workspace={
          file ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
              <p className="shrink-0 text-sm text-ink/60">
                Drag to select the area to keep. Everything outside is dimmed. Drag inside the box
                to move it, or use the handles for snipping-tool precision.
              </p>
              <PdfEditorWorkspace>
                <PdfCanvasEditor
                  file={file}
                  password={pdfPassword}
                  mode="crop"
                  box={cropBox}
                  onBoxChange={setCropBox}
                  onCanvasReady={setCanvasSize}
                  fitContainer
                  embedded
                />
              </PdfEditorWorkspace>
            </div>
          ) : null
        }
        sidebar={
          file ? (
            <>
              <ToolSidebarFileControls
              mode="single"
              accept={{ "application/pdf": [".pdf"] }}
              onReplace={async (files) => {
                const unlocked = await tryUnlock(files[0]);
                if (!unlocked) return;
                setFile(unlocked.file);
                setPdfPassword(unlocked.password);
                setCropBox(null);
                reset();
              }}
              disabled={status === "processing"}
              replaceLabel="Replace PDF"
            />

            <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={applyAll}
                    onChange={(e) => setApplyAll(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Apply this exact crop to all pages
                </label>

                <AdvancedToolsToggle variant="sidebar" label="Advanced Tools">
                  <ToolButton variant="secondary" onClick={autoTrim}>
                    Auto-Trim Margins
                  </ToolButton>
                  <p className="text-xs text-ink/50">
                    Snaps the crop box to the exact edges of content, removing scanner borders.
                  </p>
                </AdvancedToolsToggle>

            <div className={TOOL_SIDEBAR_CTA_CLASS}>
              <ToolButton
                onClick={applyCrop}
                disabled={!file || !cropBox || status === "processing"}
                className="w-full"
              >
                Crop Pages
              </ToolButton>
            </div>
          </>
          ) : null
        }
      />
      {modal}
    </>
  );
}
