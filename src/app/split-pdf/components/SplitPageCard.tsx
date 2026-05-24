"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { Check, RotateCw, Trash2 } from "lucide-react";
import type { SplitPage } from "@/app/split-pdf/types";
import { ThumbnailPreview } from "@/components/tools/ThumbnailPreview";
import {
  PAGE_CARD_BASE,
  PAGE_CARD_DEFAULT,
  PAGE_CARD_SELECTED,
} from "@/lib/ui/classes";

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
      onClick={(event) => {
        if (event.target instanceof HTMLElement && event.target.closest("button")) return;
        if (selectionEnabled) onToggleSelect(page.id);
      }}
      className={`${PAGE_CARD_BASE} cursor-grab active:cursor-grabbing ${
        selectionEnabled && selected
          ? PAGE_CARD_SELECTED
          : isBlank
            ? "border-amber-400"
            : PAGE_CARD_DEFAULT
      } ${isDragging ? "dragging z-10" : ""}`}
      aria-label={`Drag to reorder page ${pageNumber}`}
      aria-pressed={selectionEnabled ? selected : undefined}
    >
      <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-cream-200/40 p-3.5">
        <ThumbnailPreview
          src={page.thumbnail}
          alt={`Page ${pageNumber}`}
          loading={!page.thumbnail}
        />

        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-ink/60 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onRotate(page.id);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-cream-300 bg-white text-forest-700 shadow-sm transition-colors hover:bg-cream-100"
            aria-label={`Rotate page ${pageNumber}`}
            title={page.rotation ? `Rotated ${page.rotation}°` : "Turn right"}
          >
            <RotateCw className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onRemove(page.id);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 shadow-sm transition-colors hover:bg-rose-100"
            aria-label={`Remove page ${pageNumber}`}
            title="Delete page"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>

        {selectionEnabled ? (
          <div
            className={`absolute left-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
              selected
                ? "border-forest-500 bg-forest-700 text-cream-100"
                : "border-cream-300 bg-white/90 text-transparent"
            }`}
          >
            <Check className="h-2.5 w-2.5 font-extrabold" aria-hidden />
          </div>
        ) : null}

        <div className="absolute bottom-3 right-3 rounded border border-cream-300 bg-cream-100/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-forest-700">
          Page {pageNumber}
        </div>

        {page.rotation ? (
          <span className="absolute bottom-3 left-3 rounded border border-cream-300 bg-cream-100/90 px-1.5 py-0.5 text-[9px] font-bold text-forest-700">
            {page.rotation}°
          </span>
        ) : null}
      </div>

      <div className="border-t border-cream-300 px-2 py-2">
        <p className="truncate text-[11px] text-ink/50">{sourceName}</p>
      </div>
    </div>
  );
}
