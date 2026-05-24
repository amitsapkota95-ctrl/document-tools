"use client";

import { useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { Check, RotateCw, Trash2, X } from "lucide-react";
import type { MergeGridItem } from "@/app/merge-pdf/types";
import { LazyPageThumbnail } from "@/app/merge-pdf/components/LazyPageThumbnail";
import { ThumbnailPreview } from "@/components/tools/ThumbnailPreview";
import {
  PAGE_CARD_BASE,
  PAGE_CARD_DEFAULT,
  PAGE_CARD_SELECTED,
} from "@/lib/ui/classes";

interface MergeGridCardProps {
  item: MergeGridItem;
  selected?: boolean;
  selectionEnabled?: boolean;
  onToggleSelect?: (id: string) => void;
  onRemove: (id: string) => void;
  onRotate?: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onThumbnailLoaded?: (id: string, dataUrl: string) => void;
}

export function MergeGridCard({
  item,
  selected = false,
  selectionEnabled = false,
  onToggleSelect,
  onRemove,
  onRotate,
  onRename,
  onThumbnailLoaded,
}: MergeGridCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(item.label);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const commitRename = () => {
    setEditing(false);
    if (item.kind === "document" && onRename && draftName.trim()) {
      onRename(item.id, draftName.trim());
    }
  };

  const RemoveIcon = item.kind === "page" ? Trash2 : X;
  const showHoverActions = item.kind === "page" ? onRotate : true;

  const handleCardClick = (event: React.MouseEvent) => {
    if (event.target instanceof HTMLElement && event.target.closest("button")) return;
    if (selectionEnabled && onToggleSelect) {
      onToggleSelect(item.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={`${PAGE_CARD_BASE} cursor-grab active:cursor-grabbing ${
        selectionEnabled && selected ? PAGE_CARD_SELECTED : PAGE_CARD_DEFAULT
      } ${item.isBlank ? "border-amber-400" : ""} ${isDragging ? "dragging z-10" : ""}`}
      aria-label={`Drag to reorder ${item.label}`}
      aria-pressed={selectionEnabled ? selected : undefined}
    >
      <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-cream-200/40 p-3.5">
        {item.lazyThumbnail ? (
          <LazyPageThumbnail
            file={item.lazyThumbnail.file}
            pageIndex={item.lazyThumbnail.pageIndex}
            password={item.lazyThumbnail.password}
            rotation={item.lazyThumbnail.rotation}
            alt={`Preview of ${item.label}`}
            onLoaded={(dataUrl) => onThumbnailLoaded?.(item.id, dataUrl)}
          />
        ) : (
          <ThumbnailPreview
            src={item.thumbnailDataUrl}
            alt={`Preview of ${item.label}`}
          />
        )}

        {showHoverActions ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-ink/60 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            {item.kind === "page" && onRotate ? (
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  onRotate(item.id);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-cream-300 bg-white text-forest-700 shadow-sm transition-colors hover:bg-cream-100"
                aria-label={`Rotate ${item.label}`}
                title={item.rotation ? `Rotated ${item.rotation}°` : "Turn right"}
              >
                <RotateCw className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : null}
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onRemove(item.id);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 shadow-sm transition-colors hover:bg-rose-100"
              aria-label={item.kind === "page" ? "Remove page from merge" : `Remove ${item.label}`}
              title={item.kind === "page" ? "Delete page" : "Remove file"}
            >
              <RemoveIcon className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ) : null}

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

        {item.kind === "page" && item.sublabel ? (
          <div className="absolute bottom-3 right-3 rounded border border-cream-300 bg-cream-100/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-forest-700">
            {item.sublabel}
          </div>
        ) : null}

        {item.kind === "page" && item.rotation ? (
          <span className="absolute bottom-3 left-3 rounded border border-cream-300 bg-cream-100/90 px-1.5 py-0.5 text-[9px] font-bold text-forest-700">
            {item.rotation}°
          </span>
        ) : null}
      </div>

      {item.kind === "document" ? (
        <div className="border-t border-cream-300 px-2 py-2">
          {editing ? (
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onBlur={commitRename}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitRename();
                if (event.key === "Escape") {
                  setDraftName(item.label);
                  setEditing(false);
                }
              }}
              onPointerDown={(event) => event.stopPropagation()}
              className="w-full rounded border border-cream-300 bg-white px-1 py-0.5 text-xs font-bold text-forest-700"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => {
                setDraftName(item.label);
                setEditing(true);
              }}
              className="block w-full truncate text-left text-xs font-bold text-forest-700 hover:underline"
            >
              {item.label}
            </button>
          )}
          {item.sublabel ? (
            <p className="truncate text-[11px] text-ink/50">{item.sublabel}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
