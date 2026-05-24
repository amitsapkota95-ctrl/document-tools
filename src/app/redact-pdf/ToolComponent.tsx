"use client";

import { useEffect, useMemo, useState } from "react";
import { ToolWorkflowLayout } from "@/components/layout/ToolWorkflowLayout";
import { ToolSidebarFileControls } from "@/components/layout/ToolSidebarFileControls";
import {
  PdfCanvasEditor,
  type BoundingBox,
} from "@/components/tools/pdf-canvas/PdfCanvasEditor";
import { FileUploader } from "@/components/tools/FileUploader";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { ToolButton } from "@/components/tools/ToolButton";
import { Modal } from "@/components/ui/Modal";
import { usePdfPasswordUnlock } from "@/hooks/usePdfPasswordUnlock";
import { useHeroFileImport } from "@/hooks/useHeroFileImport";
import { TOOL_SIDEBAR_CTA_CLASS } from "@/lib/ui/classes";
import { downloadBytes, sanitizeFilename } from "@/lib/pdf/download";
import { domBoxToPdfPoints, PDF_RENDER_SCALE } from "@/lib/pdf/coordinate-map";
import { loadPdfDocument } from "@/lib/pdf/load-pdfjs";
import { loadPdfDocumentWithLib } from "@/lib/pdf/load-pdf-lib";
import {
  detectPiiBoxes,
  PII_LABELS,
  type PiiType,
} from "@/lib/pdf/pii-detection";
import { useProcessingStore } from "@/stores/processing-store";

const PII_TYPES: PiiType[] = ["email", "phone", "ssn", "creditCard"];

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;

interface PageRedactionState {
  boxes: BoundingBox[];
  canvasWidth: number;
  canvasHeight: number;
}

type RedactionsByPage = Record<number, PageRedactionState>;

function mergeBoxes(existing: BoundingBox[], incoming: BoundingBox[]) {
  const merged = [...existing];
  for (const box of incoming) {
    const duplicate = merged.some(
      (entry) =>
        Math.abs(entry.x - box.x) < 5 &&
        Math.abs(entry.y - box.y) < 5 &&
        Math.abs(entry.width - box.width) < 10,
    );
    if (!duplicate) merged.push(box);
  }
  return merged;
}

export default function RedactPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfPassword, setPdfPassword] = useState<string>();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [redactionsByPage, setRedactionsByPage] = useState<RedactionsByPage>({});
  const [piiHighlights, setPiiHighlights] = useState<BoundingBox[]>([]);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [showWarning, setShowWarning] = useState(false);
  const [piiEnabled, setPiiEnabled] = useState<Record<PiiType, boolean>>({
    email: true,
    phone: true,
    ssn: true,
    creditCard: true,
  });
  const [scanning, setScanning] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const { tryUnlock, modal } = usePdfPasswordUnlock();
  const { status, progress, message, setProcessing, setProgress, setDone, setError, reset } =
    useProcessingStore();

  const currentPageState = redactionsByPage[pageIndex];
  const currentPageBoxes = currentPageState?.boxes ?? [];

  const totalMarkedAreas = useMemo(
    () => Object.values(redactionsByPage).reduce((sum, page) => sum + page.boxes.length, 0),
    [redactionsByPage],
  );

  useEffect(() => {
    setPiiHighlights([]);
    setScanMessage(null);
    setZoom(1);
  }, [pageIndex]);

  const pageDimensions = (override?: { width: number; height: number }) => {
    if (override && override.width > 0) return override;
    if (canvasSize.width > 0) return canvasSize;
    return currentPageState
      ? { width: currentPageState.canvasWidth, height: currentPageState.canvasHeight }
      : { width: 0, height: 0 };
  };

  const updateCurrentPageBoxes = (
    boxes: BoundingBox[],
    dimensions?: { width: number; height: number },
  ) => {
    const size = pageDimensions(dimensions);
    if (size.width === 0) return;

    setRedactionsByPage((prev) => ({
      ...prev,
      [pageIndex]: {
        boxes,
        canvasWidth: size.width,
        canvasHeight: size.height,
      },
    }));
  };

  const handleFile = async (files: File[]) => {
    const unlocked = await tryUnlock(files[0]);
    if (!unlocked) return;

    setFile(unlocked.file);
    setPdfPassword(unlocked.password);
    setRedactionsByPage({});
    setPiiHighlights([]);
    setScanMessage(null);
    setPageIndex(0);
    setCanvasSize({ width: 0, height: 0 });
    setZoom(1);
    reset();

    const pdf = await loadPdfDocument(unlocked.file, unlocked.password);
    setPageCount(pdf.numPages);
  };

  useHeroFileImport("redact-pdf", handleFile);

  const scanForPii = async () => {
    if (!file) return;
    setScanning(true);
    setScanMessage(null);

    try {
      const pdf = await loadPdfDocument(file, pdfPassword);
      const page = await pdf.getPage(pageIndex + 1);
      const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
      const textContent = await page.getTextContent();
      const enabled = new Set(PII_TYPES.filter((type) => piiEnabled[type]));

      const detected = detectPiiBoxes(
        textContent.items as import("pdfjs-dist/types/src/display/api").TextItem[],
        enabled,
        viewport,
        PDF_RENDER_SCALE,
      );

      setPiiHighlights(detected);
      setScanMessage(
        detected.length > 0
          ? `Found ${detected.length} sensitive item${detected.length === 1 ? "" : "s"} on this page. Review the yellow highlights, then click Apply Detected.`
          : "No sensitive items detected on this page.",
      );
    } finally {
      setScanning(false);
    }
  };

  const applyDetectedPii = () => {
    if (piiHighlights.length === 0) return;

    updateCurrentPageBoxes(mergeBoxes(currentPageBoxes, piiHighlights));
    setPiiHighlights([]);
    setScanMessage(
      `${piiHighlights.length} item${piiHighlights.length === 1 ? "" : "s"} marked for redaction on this page. Review the black boxes, then download when ready.`,
    );
  };

  const applyRedaction = async () => {
    if (!file || totalMarkedAreas === 0) return;

    reset();
    setProcessing("Applying redactions…");
    setShowWarning(false);

    try {
      const { rgb } = await import("pdf-lib");
      const doc = await loadPdfDocumentWithLib(await file.arrayBuffer(), pdfPassword);
      const pages = doc.getPages();

      for (let pageNumber = 0; pageNumber < pages.length; pageNumber++) {
        const pageState = redactionsByPage[pageNumber];
        if (!pageState || pageState.boxes.length === 0) continue;

        setProgress(
          Math.round(((pageNumber + 1) / pages.length) * 90),
          `Redacting page ${pageNumber + 1}…`,
        );

        const page = pages[pageNumber];
        const { width, height } = page.getSize();
        const renderScale = pageState.canvasWidth / width;

        for (const box of pageState.boxes) {
          const pdfBox = domBoxToPdfPoints(box, renderScale, height);
          page.drawRectangle({
            x: pdfBox.x,
            y: pdfBox.y,
            width: pdfBox.width,
            height: pdfBox.height,
            color: rgb(0, 0, 0),
          });
        }
      }

      setProgress(98, "Preparing download…");
      const result = await doc.save();
      const baseName = sanitizeFilename(file.name.replace(/\.pdf$/i, ""));
      downloadBytes(result, `${baseName}-redacted.pdf`, "application/pdf");
      setDone("Sensitive info has been blacked out permanently.");
    } catch {
      setError("Could not redact PDF. Please try again.");
    }
  };

  return (
    <>
      <ToolWorkflowLayout
        hasFiles={!!file}
        sidebarLabel="Redaction options"
        workspaceClassName="flex min-h-0 flex-col overflow-hidden gap-4 !space-y-0"
        upload={
          <FileUploader
            onFiles={handleFile}
            accept={{ "application/pdf": [".pdf"] }}
            label="Drop PDF files here"
            hint="Click and drag to black out sensitive areas on each page"
          />
        }
        workspace={
          file ? (
            <>
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink/60">
                  Draw boxes manually, or use Smart Detection to find emails, phone numbers, and
                  more on the current page.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {pageCount > 1 ? (
                    <>
                      <button
                        type="button"
                        disabled={pageIndex === 0}
                        onClick={() => setPageIndex((page) => page - 1)}
                        className="rounded-lg border border-cream-300 px-3 py-1 text-sm disabled:opacity-40"
                      >
                        ← Prev
                      </button>
                      <span className="text-sm">
                        Page {pageIndex + 1} of {pageCount}
                      </span>
                      <button
                        type="button"
                        disabled={pageIndex >= pageCount - 1}
                        onClick={() => setPageIndex((page) => page + 1)}
                        className="rounded-lg border border-cream-300 px-3 py-1 text-sm disabled:opacity-40"
                      >
                        Next →
                      </button>
                    </>
                  ) : null}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={zoom <= ZOOM_MIN}
                      onClick={() =>
                        setZoom((value) => Math.max(ZOOM_MIN, value - ZOOM_STEP))
                      }
                      className="rounded-lg border border-cream-300 px-3 py-1 text-sm disabled:opacity-40"
                      aria-label="Zoom out"
                    >
                      −
                    </button>
                    <span className="min-w-[3.5rem] text-center text-sm tabular-nums">
                      {Math.round(fitScale * zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      disabled={zoom >= ZOOM_MAX}
                      onClick={() =>
                        setZoom((value) => Math.min(ZOOM_MAX, value + ZOOM_STEP))
                      }
                      className="rounded-lg border border-cream-300 px-3 py-1 text-sm disabled:opacity-40"
                      aria-label="Zoom in"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      disabled={zoom === 1}
                      onClick={() => setZoom(1)}
                      className="rounded-lg border border-cream-300 px-3 py-1 text-sm disabled:opacity-40"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
              <div className="relative min-h-0 flex-1">
                <PdfCanvasEditor
                  file={file}
                  password={pdfPassword}
                  pageIndex={pageIndex}
                  mode="redact"
                  boxes={currentPageBoxes}
                  onBoxesChange={(boxes) => updateCurrentPageBoxes(boxes)}
                  onCanvasReady={(dimensions) => {
                    setCanvasSize(dimensions);
                    setRedactionsByPage((prev) => ({
                      ...prev,
                      [pageIndex]: {
                        boxes: prev[pageIndex]?.boxes ?? [],
                        canvasWidth: dimensions.width,
                        canvasHeight: dimensions.height,
                      },
                    }));
                  }}
                  fitContainer
                  zoom={zoom}
                  piiHighlights={piiHighlights}
                  onFitScaleChange={setFitScale}
                />
              </div>
              <div className="shrink-0 space-y-3">
                <p className="text-sm text-ink/60">
                  {currentPageBoxes.length} area(s) marked on this page
                  {totalMarkedAreas !== currentPageBoxes.length
                    ? ` · ${totalMarkedAreas} total across document`
                    : null}
                </p>
                {scanMessage ? (
                  <p className="rounded-xl border border-cream-300 bg-cream-200/80 px-4 py-3 text-sm text-forest-600">
                    {scanMessage}
                  </p>
                ) : null}
              </div>
            </>
          ) : null
        }
        sidebar={
          file ? (
            <>
              <ToolSidebarFileControls
              mode="single"
              accept={{ "application/pdf": [".pdf"] }}
              onReplace={handleFile}
              disabled={status === "processing"}
              replaceLabel="Replace PDF"
            />

            <div className="space-y-4 border-t border-cream-300 pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/60">
                    Smart Detection
                  </h3>
                  {PII_TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={piiEnabled[type]}
                        onChange={(event) =>
                          setPiiEnabled((prev) => ({ ...prev, [type]: event.target.checked }))
                        }
                        className="h-4 w-4 accent-forest-600"
                      />
                      {PII_LABELS[type]}
                    </label>
                  ))}
                  <ToolButton
                    variant="secondary"
                    onClick={scanForPii}
                    disabled={scanning || !PII_TYPES.some((type) => piiEnabled[type])}
                    className="w-full"
                  >
                    {scanning ? "Scanning…" : "Scan Page"}
                  </ToolButton>
                  {piiHighlights.length > 0 ? (
                    <ToolButton onClick={applyDetectedPii} className="w-full">
                      Apply Detected ({piiHighlights.length})
                    </ToolButton>
                  ) : null}
                  {currentPageBoxes.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        updateCurrentPageBoxes([]);
                        setScanMessage(null);
                      }}
                      className="text-xs text-ink/60 underline"
                    >
                      Clear boxes on this page
                    </button>
                  ) : null}
                  {totalMarkedAreas > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRedactionsByPage({});
                        setScanMessage(null);
                      }}
                      className="text-xs text-ink/60 underline"
                    >
                      Clear all pages
                    </button>
                  ) : null}
                </div>

                {status === "processing" ? (
                  <ProgressBar progress={progress} label={message} />
                ) : null}

                <div className={TOOL_SIDEBAR_CTA_CLASS}>
                  <ToolButton
                    onClick={() => setShowWarning(true)}
                    disabled={totalMarkedAreas === 0 || status === "processing"}
                    className="w-full"
                  >
                    Download Redacted PDF
                  </ToolButton>
                </div>
          </>
          ) : null
        }
      />
      {modal}
      <Modal
        open={showWarning}
        title="Permanent redaction"
        onClose={() => setShowWarning(false)}
        actions={
          <button
            type="button"
            onClick={applyRedaction}
            className="rounded-lg border border-forest bg-forest px-4 py-2 text-sm font-semibold text-cream hover:bg-forest-muted"
          >
            Yes, remove permanently
          </button>
        }
      >
        <p className="text-sm text-forest-600">
          Warning: This permanently removes the underlying data beneath each black box on the
          pages where you marked them. It cannot be undone. Make sure you keep an unredacted copy
          if needed.
        </p>
      </Modal>
    </>
  );
}
