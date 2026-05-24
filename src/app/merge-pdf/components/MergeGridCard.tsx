"use client";

import { useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { RotateCw, Trash2, X } from "lucide-react";
import type { MergeGridItem } from "@/app/merge-pdf/types";
import { LazyPageThumbnail } from "@/app/merge-pdf/components/LazyPageThumbnail";

import { ThumbnailPreview } from "@/components/tools/ThumbnailPreview";

interface MergeGridCardProps {
  item: MergeGridItem;
  onRemove: (id: string) => void;
  onRotate?: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onThumbnailLoaded?: (id: string, dataUrl: string) => void;
}

export function MergeGridCard({
  item,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative cursor-grab overflow-hidden rounded-xl border bg-cream shadow-eco transition-all duration-200 hover:-translate-y-0.5 hover:shadow-eco-lg active:cursor-grabbing ${
        item.isBlank ? "border-amber-400" : "border-moss/70"
      } ${isDragging ? "z-10 rotate-1 shadow-eco-lg" : ""}`}
      aria-label={`Drag to reorder ${item.label}`}
    >
      <div className="relative">
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
        {item.kind === "page" && item.rotation ? (
          <span className="absolute bottom-1 left-1 rounded bg-cream/90 px-1 text-[10px] font-semibold text-forest">
            {item.rotation}°
          </span>
        ) : null}
      </div>

      <div className="border-t border-moss/70 px-2 py-2">
        {editing && item.kind === "document" ? (
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
            className="w-full rounded border border-moss/70 bg-cream px-1 py-0.5 text-xs font-semibold text-forest"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => {
              if (item.kind === "document") {
                setDraftName(item.label);
                setEditing(true);
              }
            }}
            className={`block w-full truncate text-left text-xs font-semibold text-forest ${
              item.kind === "document" ? "hover:underline" : ""
            }`}
          >
            {item.label}
          </button>
        )}
        {item.sublabel ? (
          <p className="truncate text-[11px] text-sand-light">{item.sublabel}</p>
        ) : null}
      </div>

      {item.kind === "page" && onRotate ? (
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onRotate(item.id)}
          className="absolute left-2 top-2 z-10 rounded-full border border-moss/70 bg-cream p-1 shadow-eco transition-colors hover:bg-forest hover:text-cream"
          aria-label={`Rotate ${item.label}`}
          title={item.rotation ? `Rotated ${item.rotation}°` : "Rotate 90°"}
        >
          <RotateCw className="h-3 w-3" />
        </button>
      ) : null}

      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => onRemove(item.id)}
        className="absolute right-2 top-2 z-10 cursor-pointer rounded-full border border-moss/70 bg-cream p-0.5 shadow-eco transition-colors hover:bg-forest hover:text-cream"
        aria-label={item.kind === "page" ? `Remove page from merge` : `Remove ${item.label}`}
        title={item.kind === "page" ? "Remove page" : "Remove file"}
      >
        <RemoveIcon className="h-3 w-3" />
      </button>
    </div>
  );
}
