"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { RotateCw, Trash2 } from "lucide-react";
import type { SplitPage } from "@/app/split-pdf/types";

import { ThumbnailPreview } from "@/components/tools/ThumbnailPreview";

interface SplitPageCardProps {
  page: SplitPage;
  pageNumber: number;
  sourceName: string;
  selected: boolean;
  isBlank: boolean;
  selectionEnabled: boolean;
  onToggleSelect: (pageId: string) => void;
  onRemove: (pageId: string) => void;
  onRotate: (pageId: string) => void;
}

export function SplitPageCard({
  page,
  pageNumber,
  sourceName,
  selected,
  isBlank,
  selectionEnabled,
  onToggleSelect,
  onRemove,
  onRotate,
}: SplitPageCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative cursor-grab overflow-hidden rounded-xl border bg-cream shadow-eco transition-all duration-200 hover:-translate-y-0.5 hover:shadow-eco-lg active:cursor-grabbing ${
        selectionEnabled && selected
          ? "border-4 border-sage ring-2 ring-sage/30"
          : isBlank
            ? "border-4 border-amber-400 ring-2 ring-amber-200"
            : "border-moss/70"
      } ${isDragging ? "z-10 rotate-1 shadow-eco-lg" : ""}`}
      aria-label={`Drag to reorder page ${pageNumber}`}
    >
      <button
        type="button"
        onClick={() => selectionEnabled && onToggleSelect(page.id)}
        disabled={!selectionEnabled}
        className={`block w-full ${selectionEnabled ? "cursor-pointer" : "cursor-default"} relative`}
        aria-pressed={selectionEnabled ? selected : undefined}
        aria-label={
          selectionEnabled ? `Toggle selection for page ${pageNumber}` : `Page ${pageNumber}`
        }
      >
        <ThumbnailPreview
          src={page.thumbnail}
          alt={`Page ${pageNumber}`}
          loading={!page.thumbnail}
        />
        {page.rotation ? (
          <span className="absolute bottom-1 left-1 rounded bg-cream/90 px-1 text-[10px] font-semibold text-forest">
            {page.rotation}°
          </span>
        ) : null}
      </button>

      <div className="border-t border-moss/70 px-2 py-2">
        <p className="text-xs font-semibold text-forest">Page {pageNumber}</p>
        <p className="truncate text-[11px] text-sand-light">{sourceName}</p>
      </div>

      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => onRotate(page.id)}
        className="absolute left-2 top-2 z-10 rounded-full border border-moss/70 bg-cream p-1 shadow-eco transition-colors hover:bg-forest hover:text-cream"
        aria-label={`Rotate page ${pageNumber}`}
        title={page.rotation ? `Rotated ${page.rotation}°` : "Rotate 90°"}
      >
        <RotateCw className="h-3 w-3" />
      </button>

      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => onRemove(page.id)}
        className="absolute right-2 top-2 z-10 rounded-full border border-moss/70 bg-cream p-1 shadow-eco transition-colors hover:bg-forest hover:text-cream"
        aria-label={`Remove page ${pageNumber}`}
        title="Remove page"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
