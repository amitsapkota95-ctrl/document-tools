"use client";

import { useCallback, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { RotateCw, X } from "lucide-react";
import { ToolWorkflowLayout } from "@/components/layout/ToolWorkflowLayout";
import { ToolSidebarFileControls } from "@/components/layout/ToolSidebarFileControls";
import { AdvancedToolsToggle } from "@/components/tools/AdvancedToolsToggle";
import { FileUploader } from "@/components/tools/FileUploader";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { ToolButton } from "@/components/tools/ToolButton";
import { ThumbnailPreview } from "@/components/tools/ThumbnailPreview";
import { getCanvasGridConfig } from "@/components/tools/canvasGridConfig";
import { WorkspaceCanvas } from "@/components/tools/WorkspaceCanvas";
import { INPUT_CLASS, TOOL_SIDEBAR_CTA_CLASS, TOOL_THUMBNAIL_WORKSPACE } from "@/lib/ui/classes";
import { downloadBytes } from "@/lib/pdf/download";
import { deskewImage, canvasToBytes } from "@/lib/image/scanner-filter";
import { nextImageRotation, rotateImageBlob, type ImageRotation } from "@/lib/image/rotate-image";
import { loadPdfLib } from "@/lib/pdf/load-pdf-lib";
import { useProcessingStore } from "@/stores/processing-store";

type PageSize = "fit" | "letter" | "a4";
type Margin = "none" | "small" | "large";

const PAGE_SIZES = {
  letter: [612, 792] as [number, number],
  a4: [595.28, 841.89] as [number, number],
};

const MARGINS: Record<Margin, number> = { none: 0, small: 36, large: 72 };

interface ImageEntry {
  id: string;
  file: File;
  preview: string;
  rotation: ImageRotation;
}

async function prepareImageBytes(
  entry: ImageEntry,
  scannerMagic: boolean,
): Promise<{ bytes: Uint8Array; isPng: boolean }> {
  let blob: Blob = entry.file;

  if (scannerMagic) {
    const canvas = await deskewImage(entry.file);
    const scannedBytes = await canvasToBytes(
      canvas,
      entry.file.type === "image/png" ? "image/png" : "image/jpeg",
    );
    blob = new Blob([new Uint8Array(scannedBytes)], {
      type: entry.file.type === "image/png" ? "image/png" : "image/jpeg",
    });
  }

  if (entry.rotation !== 0) {
    blob = await rotateImageBlob(blob, entry.rotation, blob.type || entry.file.type);
  }

  const isPng =
    blob.type === "image/png" ||
    blob.type === "image/webp" ||
    (scannerMagic && entry.file.type !== "image/jpeg");

  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    isPng,
  };
}

export default function ImageToPdfTool() {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("fit");
  const [margin, setMargin] = useState<Margin>("none");
  const [scannerMagic, setScannerMagic] = useState(false);
  const { status, progress, message, setProcessing, setProgress, setDone, setError, reset } =
    useProcessingStore();

  const addImages = useCallback((files: File[]) => {
    for (const file of files) {
      const preview = URL.createObjectURL(file);
      setImages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), file, preview, rotation: 0 },
      ]);
    }
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const entry = prev.find((item) => item.id === id);
      if (entry) URL.revokeObjectURL(entry.preview);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const rotateImage = useCallback((id: string) => {
    setImages((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, rotation: nextImageRotation(entry.rotation) } : entry,
      ),
    );
  }, []);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(result.source.index, 1);
      next.splice(result.destination!.index, 0, moved);
      return next;
    });
  };

  const createPdf = async () => {
    if (images.length === 0) return;
    reset();
    setProcessing("Creating your PDF…");

    try {
      const { PDFDocument } = await loadPdfLib();
      const pdf = await PDFDocument.create();
      const inset = MARGINS[margin];

      for (let i = 0; i < images.length; i++) {
        setProgress(Math.round(((i + 1) / images.length) * 90), `Adding image ${i + 1}…`);
        const { bytes, isPng } = await prepareImageBytes(images[i], scannerMagic);
        const image = isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);

        if (pageSize === "fit") {
          const page = pdf.addPage([image.width, image.height]);
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        } else {
          const [pw, ph] = PAGE_SIZES[pageSize];
          const page = pdf.addPage([pw, ph]);
          const maxW = pw - inset * 2;
          const maxH = ph - inset * 2;
          const scale = Math.min(maxW / image.width, maxH / image.height);
          const w = image.width * scale;
          const h = image.height * scale;
          page.drawImage(image, {
            x: inset + (maxW - w) / 2,
            y: inset + (maxH - h) / 2,
            width: w,
            height: h,
          });
        }
      }

      downloadBytes(await pdf.save(), "images-combined.pdf", "application/pdf");
      setDone("Your PDF is ready!");
    } catch {
      setError("Could not convert images. Use JPG, PNG, or WebP.");
    }
  };

  const replaceImages = useCallback((files: File[]) => {
    setImages((prev) => {
      for (const entry of prev) URL.revokeObjectURL(entry.preview);
      return [];
    });
    addImages(files);
  }, [addImages]);

  const imageAccept = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
  } as const;

  return (
    <ToolWorkflowLayout
      hasFiles={images.length > 0}
      sidebarLabel="PDF options"
      upload={
        <FileUploader
          onFiles={addImages}
          accept={imageAccept}
          multiple
          label="Drop images here"
          hint="JPG, PNG, and WebP — drag thumbnails to reorder, rotate before exporting"
        />
      }
      workspace={
        <div className={TOOL_THUMBNAIL_WORKSPACE}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="images" direction="horizontal">
              {(provided) => {
                const gridConfig = getCanvasGridConfig(images.length);

                return (
                  <WorkspaceCanvas
                    pageCount={images.length}
                    innerRef={provided.innerRef}
                    innerProps={provided.droppableProps as unknown as Record<string, unknown>}
                  >
                    {images.map((entry, index) => (
                      <Draggable key={entry.id} draggableId={entry.id} index={index}>
                        {(dragProvided) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={`${gridConfig.cardClass} relative shrink-0 cursor-grab overflow-hidden rounded-xl border border-moss/70 bg-cream shadow-eco transition-all duration-200 hover:-translate-y-0.5 hover:shadow-eco-lg active:cursor-grabbing`}
                          >
                            <ThumbnailPreview
                              src={entry.preview}
                              alt={`Image ${index + 1}`}
                              imageStyle={{ transform: `rotate(${entry.rotation}deg)` }}
                            />
                            {entry.rotation ? (
                              <span className="absolute bottom-8 left-1 rounded bg-cream/90 px-1 text-[10px] font-semibold text-forest">
                                {entry.rotation}°
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onPointerDown={(event) => event.stopPropagation()}
                              onClick={() => rotateImage(entry.id)}
                              className="absolute left-2 top-2 z-10 rounded-full border border-moss/70 bg-cream p-1 shadow-eco transition-colors hover:bg-forest hover:text-cream"
                              aria-label={`Rotate image ${index + 1}`}
                              title={`Rotate (${entry.rotation}° → ${nextImageRotation(entry.rotation)}°)`}
                            >
                              <RotateCw className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onPointerDown={(event) => event.stopPropagation()}
                              onClick={() => removeImage(entry.id)}
                              className="absolute right-2 top-2 z-10 rounded-full border border-moss/70 bg-cream p-1 shadow-eco transition-colors hover:bg-forest hover:text-cream"
                              aria-label={`Remove image ${index + 1}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </WorkspaceCanvas>
                );
              }}
            </Droppable>
          </DragDropContext>
        </div>
      }
      sidebar={
        <>
          <ToolSidebarFileControls
            mode="multi"
            accept={imageAccept}
            onAdd={addImages}
            onReplace={replaceImages}
            disabled={status === "processing"}
            addLabel="Add images"
            addHint="Append more images to the PDF"
            replaceLabel="Replace all"
            replaceHint="Clear and start with new images"
          />

          <div className="space-y-4">
            <label className="text-sm font-semibold">
              Page size
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as PageSize)}
                className={INPUT_CLASS}
              >
                <option value="fit">Fit to Image</option>
                <option value="letter">US Letter</option>
                <option value="a4">A4</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Margins
              <select
                value={margin}
                onChange={(e) => setMargin(e.target.value as Margin)}
                className={INPUT_CLASS}
              >
                <option value="none">None</option>
                <option value="small">Small</option>
                <option value="large">Large</option>
              </select>
            </label>
          </div>

          <AdvancedToolsToggle variant="sidebar" label="Advanced Tools">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={scannerMagic}
                onChange={(e) => setScannerMagic(e.target.checked)}
                className="h-4 w-4 accent-sage"
              />
              Scanner Magic — auto-deskew, trim borders, high-contrast B&amp;W
            </label>
          </AdvancedToolsToggle>

          {status === "processing" ? <ProgressBar progress={progress} label={message} /> : null}

          <div className={TOOL_SIDEBAR_CTA_CLASS}>
            <ToolButton
              onClick={createPdf}
              disabled={images.length === 0 || status === "processing"}
              className="w-full"
            >
              Create PDF
            </ToolButton>
          </div>
        </>
      }
    />
  );
}
