"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadPdfDocument } from "@/lib/pdf/load-pdfjs";
import { CropSnipOverlay } from "@/components/tools/pdf-canvas/CropSnipOverlay";
import { PiiHighlightOverlay } from "@/components/tools/pdf-canvas/PiiHighlightOverlay";
import { useCanvasFitScale } from "@/hooks/useCanvasFitScale";
import { canvasBoxToPdfPoints, PDF_RENDER_SCALE, type BoundingBox } from "@/lib/pdf/coordinate-map";

export type { BoundingBox };
export { canvasBoxToPdfPoints };

interface PdfCanvasEditorProps {
  file: File | null;
  password?: string;
  pageIndex?: number;
  mode: "crop" | "redact" | "sign";
  box?: BoundingBox | null;
  onBoxChange?: (box: BoundingBox | null) => void;
  boxes?: BoundingBox[];
  onBoxesChange?: (boxes: BoundingBox[]) => void;
  onCanvasReady?: (dimensions: { width: number; height: number }) => void;
  fitContainer?: boolean;
  embedded?: boolean;
  zoom?: number;
  piiHighlights?: BoundingBox[];
  onFitScaleChange?: (fitScale: number) => void;
}

type PdfRenderTask = { promise: Promise<void>; cancel: () => void };

function drawCropPreview(ctx: CanvasRenderingContext2D, box: BoundingBox, canvasW: number, canvasH: number) {
  const { x, y, width, height } = box;
  ctx.fillStyle = "rgba(20, 83, 45, 0.55)";
  ctx.fillRect(0, 0, canvasW, y);
  ctx.fillRect(0, y + height, canvasW, canvasH - y - height);
  ctx.fillRect(0, y, x, height);
  ctx.fillRect(x + width, y, canvasW - x - width, height);
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.strokeRect(x, y, width, height);
}

export function PdfCanvasEditor({
  file,
  password,
  pageIndex = 0,
  mode,
  box = null,
  onBoxChange,
  boxes = [],
  onBoxesChange,
  onCanvasReady,
  fitContainer = false,
  embedded = false,
  zoom = 1,
  piiHighlights = [],
  onFitScaleChange,
}: PdfCanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<PdfRenderTask | null>(null);
  const renderGenerationRef = useRef(0);
  const onCanvasReadyRef = useRef(onCanvasReady);
  const drawingRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const liveBoxRef = useRef<BoundingBox | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [currentBox, setCurrentBox] = useState<BoundingBox | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [renderSize, setRenderSize] = useState({ width: 0, height: 0 });
  const { fitScale, containerRef } = useCanvasFitScale(
    renderSize.width,
    renderSize.height,
    fitContainer,
  );

  onCanvasReadyRef.current = onCanvasReady;

  const drawOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number) => {
      if (mode === "crop") {
        if (drawingRef.current && liveBoxRef.current) {
          drawCropPreview(ctx, liveBoxRef.current, canvasW, canvasH);
        }
        return;
      }

      const allBoxes =
        mode === "redact"
          ? [...boxes, ...(currentBox ? [currentBox] : [])]
          : currentBox
            ? [currentBox]
            : [];

      for (const boxEntry of allBoxes) {
        if (mode === "redact") {
          ctx.fillStyle = "#000000";
          ctx.fillRect(boxEntry.x, boxEntry.y, boxEntry.width, boxEntry.height);
        } else {
          ctx.strokeStyle = "#1c1917";
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(boxEntry.x, boxEntry.y, boxEntry.width, boxEntry.height);
          ctx.setLineDash([]);
        }
      }
    },
    [boxes, currentBox, mode],
  );

  const drawOverlayRef = useRef(drawOverlay);
  drawOverlayRef.current = drawOverlay;

  const blitToVisibleCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const base = baseCanvasRef.current;
    if (!canvas || !base) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(base, 0, 0);
    drawOverlayRef.current(ctx, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (!file) {
      setPageReady(false);
      return;
    }

    const generation = ++renderGenerationRef.current;
    let cancelled = false;

    async function renderPage() {
      setLoading(true);
      setPageReady(false);

      try {
        const pdf = await loadPdfDocument(file!, password);
        if (cancelled || generation !== renderGenerationRef.current) return;

        const page = await pdf.getPage(pageIndex + 1);
        const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });

        const base = baseCanvasRef.current ?? document.createElement("canvas");
        baseCanvasRef.current = base;
        base.width = viewport.width;
        base.height = viewport.height;

        const baseCtx = base.getContext("2d");
        if (!baseCtx) {
          throw new Error("Could not create canvas context.");
        }

        renderTaskRef.current?.cancel();
        const task = page.render({
          canvasContext: baseCtx,
          viewport,
          canvas: base,
        }) as PdfRenderTask;
        renderTaskRef.current = task;

        await task.promise;
        if (cancelled || generation !== renderGenerationRef.current) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        setRenderSize({ width: viewport.width, height: viewport.height });
        onCanvasReadyRef.current?.({ width: viewport.width, height: viewport.height });

        blitToVisibleCanvas();
        setPageReady(true);
      } catch (error) {
        if (cancelled || generation !== renderGenerationRef.current) return;
        if (error instanceof Error && error.message.toLowerCase().includes("cancel")) return;
        console.error("PdfCanvasEditor render failed:", error);
      } finally {
        if (!cancelled && generation === renderGenerationRef.current) {
          setLoading(false);
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
    };
  }, [file, password, pageIndex, blitToVisibleCanvas]);

  useEffect(() => {
    if (!pageReady || loading) return;
    blitToVisibleCanvas();
  }, [boxes, currentBox, drawing, loading, pageReady, blitToVisibleCanvas]);

  useEffect(() => {
    onFitScaleChange?.(fitScale);
  }, [fitScale, onFitScaleChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fitContainer || renderSize.width === 0) return;

    canvas.style.width = "100%";
    canvas.style.height = "100%";
  }, [fitContainer, renderSize.width, renderSize.height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || fitContainer) return;

    canvas.style.width = "";
    canvas.style.height = "";
  }, [fitContainer, renderSize.width, renderSize.height]);

  const getRelativeCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.max(0, Math.min((clientX - rect.left) * scaleX, canvas.width)),
      y: Math.max(0, Math.min((clientY - rect.top) * scaleY, canvas.height)),
    };
  }, []);

  const finishDrawing = useCallback(() => {
    const finalBox = liveBoxRef.current;
    drawingRef.current = false;
    startRef.current = null;
    setDrawing(false);
    setCurrentBox(null);

    if (finalBox && finalBox.width > 5 && finalBox.height > 5) {
      if (mode === "redact" && onBoxesChange) {
        onBoxesChange([...boxes, finalBox]);
      } else if (mode === "crop") {
        onBoxChange?.(finalBox);
      } else {
        onBoxChange?.(finalBox);
      }
    }

    liveBoxRef.current = null;
    blitToVisibleCanvas();
  }, [blitToVisibleCanvas, boxes, mode, onBoxChange, onBoxesChange]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (loading || !pageReady || e.button !== 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    const coords = getRelativeCoords(e.clientX, e.clientY);

    if (mode === "crop") {
      onBoxChange?.(null);
      liveBoxRef.current = null;
    }

    drawingRef.current = true;
    startRef.current = coords;
    liveBoxRef.current = { x: coords.x, y: coords.y, width: 0, height: 0 };
    setDrawing(true);
    setCurrentBox(liveBoxRef.current);
    blitToVisibleCanvas();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !startRef.current) return;

    const coords = getRelativeCoords(e.clientX, e.clientY);
    const nextBox = {
      x: Math.min(startRef.current.x, coords.x),
      y: Math.min(startRef.current.y, coords.y),
      width: Math.abs(coords.x - startRef.current.x),
      height: Math.abs(coords.y - startRef.current.y),
    };

    liveBoxRef.current = nextBox;
    setCurrentBox(nextBox);

    if (mode === "crop") {
      onBoxChange?.(nextBox);
    } else {
      onBoxChange?.(nextBox);
    }

    blitToVisibleCanvas();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    finishDrawing();
  };

  const cropSelection = mode === "crop" && !drawing ? box : null;

  const canvasElement = (
    <canvas
      ref={canvasRef}
      className={
        fitContainer
          ? "block h-full w-full cursor-crosshair touch-none"
          : "block max-w-full cursor-crosshair touch-none"
      }
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );

  const canvasOverlays = (
    <>
      {mode === "crop" && cropSelection && renderSize.width > 0 && renderSize.height > 0 ? (
        <CropSnipOverlay
          box={cropSelection}
          canvasWidth={renderSize.width}
          canvasHeight={renderSize.height}
          onChange={(next) => onBoxChange?.(next)}
        />
      ) : null}
      {mode === "redact" && piiHighlights.length > 0 ? (
        <PiiHighlightOverlay
          highlights={piiHighlights}
          canvasWidth={renderSize.width}
          canvasHeight={renderSize.height}
        />
      ) : null}
    </>
  );

  if (fitContainer) {
    const displayWidth = renderSize.width * fitScale * zoom;
    const displayHeight = renderSize.height * fitScale * zoom;

    return (
      <div
        ref={containerRef}
        className={
          embedded
            ? "relative h-full w-full overflow-auto"
            : "relative h-full w-full overflow-auto rounded-xl border border-moss/70 shadow-eco"
        }
      >
        <div className="flex min-h-full min-w-full items-center justify-center">
          <div
            className="relative shrink-0 leading-none"
            style={
              displayWidth > 0
                ? { width: displayWidth, height: displayHeight }
                : undefined
            }
          >
            {canvasElement}
            {canvasOverlays}
          </div>
        </div>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-cream/80">
            <p className="text-sand">Loading page…</p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative overflow-auto rounded-xl border border-moss/70 shadow-eco">
      <div className="relative inline-block leading-none">
        {canvasElement}
        {canvasOverlays}
      </div>
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-cream/80">
          <p className="text-sand">Loading page…</p>
        </div>
      ) : null}
    </div>
  );
}

export function usePdfCanvasDimensions(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const canvas = canvasRef.current;
  return {
    width: canvas?.width ?? 0,
    height: canvas?.height ?? 0,
  };
}
