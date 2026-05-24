"use client";

import { Rnd } from "react-rnd";
import { Copy, Trash2 } from "lucide-react";
import type { PlacedSignature } from "@/app/fill-and-sign/types";

interface PlacedSignatureBoxProps {
  signature: PlacedSignature;
  pageWidth: number;
  pageHeight: number;
  isActive: boolean;
  onActivate: () => void;
  onChange: (patch: Partial<PlacedSignature>) => void;
  onDelete: () => void;
  onApplyAll: () => void;
  totalPages: number;
}

export function PlacedSignatureBox({
  signature,
  pageWidth,
  isActive,
  onActivate,
  onChange,
  onDelete,
  onApplyAll,
  totalPages,
}: PlacedSignatureBoxProps) {
  return (
    <>
      <Rnd
        size={{ width: signature.width, height: signature.height }}
        position={{ x: signature.x, y: signature.y }}
        bounds="parent"
        minWidth={80}
        minHeight={32}
        onMouseDown={(event) => {
          event.stopPropagation();
          onActivate();
        }}
        onDragStop={(_event, data) => {
          onChange({ x: data.x, y: data.y });
        }}
        onResizeStop={(_event, _direction, ref, _delta, position) => {
          onChange({
            x: position.x,
            y: position.y,
            width: ref.offsetWidth,
            height: ref.offsetHeight,
          });
        }}
        className={`group z-10 ${isActive ? "z-20" : ""}`}
        style={{
          border: isActive ? "2px dashed #16a34a" : "2px dashed #86efac",
          background: "rgba(246, 254, 248, 0.12)",
        }}
        resizeHandleClasses={{
          topLeft: "h-3 w-3 rounded-sm border border-sage-dark bg-cream",
          topRight: "h-3 w-3 rounded-sm border border-sage-dark bg-cream",
          bottomLeft: "h-3 w-3 rounded-sm border border-sage-dark bg-cream",
          bottomRight: "h-3 w-3 rounded-sm border border-sage-dark bg-cream",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={signature.dataUrl}
          alt={signature.label}
          className="pointer-events-none h-full w-full object-contain"
          draggable={false}
        />
      </Rnd>

      {isActive ? (
        <div
          className="absolute z-30 flex gap-1 rounded-lg border border-moss/70 bg-cream p-1 shadow-eco"
          style={{
            left: signature.x,
            top: Math.max(8, signature.y - 44),
            maxWidth: pageWidth - 16,
          }}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md border border-moss/70 bg-moss-light/50 p-1.5 text-forest transition-colors hover:bg-forest hover:text-cream"
            aria-label="Delete signature"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {totalPages > 1 ? (
            <button
              type="button"
              onClick={onApplyAll}
              className="inline-flex items-center gap-1 rounded-md border border-moss/70 bg-moss-light/50 px-2 py-1.5 text-xs font-semibold text-forest transition-colors hover:bg-forest hover:text-cream"
              aria-label="Apply to all pages"
            >
              <Copy className="h-4 w-4" />
              Apply to all pages
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
