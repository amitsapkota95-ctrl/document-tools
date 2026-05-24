"use client";

import { useCallback, useEffect, useRef } from "react";
import type { BoundingBox } from "@/lib/pdf/coordinate-map";

type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

interface CropSnipOverlayProps {
  box: BoundingBox;
  canvasWidth: number;
  canvasHeight: number;
  onChange: (box: BoundingBox) => void;
}

function clampBox(box: BoundingBox, canvasWidth: number, canvasHeight: number): BoundingBox {
  const width = Math.max(16, Math.min(box.width, canvasWidth));
  const height = Math.max(16, Math.min(box.height, canvasHeight));
  const x = Math.max(0, Math.min(box.x, canvasWidth - width));
  const y = Math.max(0, Math.min(box.y, canvasHeight - height));
  return { x, y, width, height };
}

function resizeBox(box: BoundingBox, handle: Handle, pointer: { x: number; y: number }): BoundingBox {
  let { x, y, width, height } = box;
  const right = x + width;
  const bottom = y + height;

  if (handle.includes("e")) width = pointer.x - x;
  if (handle.includes("w")) {
    width = right - pointer.x;
    x = pointer.x;
  }
  if (handle.includes("s")) height = pointer.y - y;
  if (handle.includes("n")) {
    height = bottom - pointer.y;
    y = pointer.y;
  }

  if (width < 0) {
    x += width;
    width = Math.abs(width);
  }
  if (height < 0) {
    y += height;
    height = Math.abs(height);
  }

  return { x, y, width, height };
}

const HANDLES: { id: Handle; className: string; cursor: string }[] = [
  { id: "nw", className: "-left-1.5 -top-1.5", cursor: "nwse-resize" },
  { id: "n", className: "left-1/2 -top-1.5 -translate-x-1/2", cursor: "ns-resize" },
  { id: "ne", className: "-right-1.5 -top-1.5", cursor: "nesw-resize" },
  { id: "e", className: "-right-1.5 top-1/2 -translate-y-1/2", cursor: "ew-resize" },
  { id: "se", className: "-right-1.5 -bottom-1.5", cursor: "nwse-resize" },
  { id: "s", className: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2", cursor: "ns-resize" },
  { id: "sw", className: "-bottom-1.5 -left-1.5", cursor: "nwse-resize" },
  { id: "w", className: "-left-1.5 top-1/2 -translate-y-1/2", cursor: "ew-resize" },
];

export function CropSnipOverlay({
  box,
  canvasWidth,
  canvasHeight,
  onChange,
}: CropSnipOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    mode: "move" | Handle;
    startPointer: { x: number; y: number };
    startBox: BoundingBox;
  } | null>(null);

  const xPct = (box.x / canvasWidth) * 100;
  const yPct = (box.y / canvasHeight) * 100;
  const wPct = (box.width / canvasWidth) * 100;
  const hPct = (box.height / canvasHeight) * 100;

  const toCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    [canvasWidth, canvasHeight],
  );

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const pointer = toCanvasCoords(event.clientX, event.clientY);

      if (drag.mode === "move") {
        const dx = pointer.x - drag.startPointer.x;
        const dy = pointer.y - drag.startPointer.y;
        onChange(
          clampBox(
            {
              ...drag.startBox,
              x: drag.startBox.x + dx,
              y: drag.startBox.y + dy,
            },
            canvasWidth,
            canvasHeight,
          ),
        );
        return;
      }

      onChange(
        clampBox(resizeBox(drag.startBox, drag.mode, pointer), canvasWidth, canvasHeight),
      );
    };

    const onUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [canvasWidth, canvasHeight, onChange, toCanvasCoords]);

  const startDrag = (event: React.PointerEvent, mode: "move" | Handle) => {
    event.stopPropagation();
    event.preventDefault();
    dragRef.current = {
      mode,
      startPointer: toCanvasCoords(event.clientX, event.clientY),
      startBox: box,
    };
  };

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0">
      <div className="pointer-events-none absolute left-0 top-0 w-full bg-forest/55" style={{ height: `${yPct}%` }} />
      <div
        className="pointer-events-none absolute left-0 w-full bg-forest/55"
        style={{ top: `${yPct + hPct}%`, height: `${100 - yPct - hPct}%` }}
      />
      <div
        className="pointer-events-none absolute bg-forest/55"
        style={{ top: `${yPct}%`, left: 0, width: `${xPct}%`, height: `${hPct}%` }}
      />
      <div
        className="pointer-events-none absolute bg-forest/55"
        style={{
          top: `${yPct}%`,
          left: `${xPct + wPct}%`,
          width: `${100 - xPct - wPct}%`,
          height: `${hPct}%`,
        }}
      />

      <div
        className="pointer-events-auto absolute box-border border-2 border-sage shadow-[0_0_0_1px_rgba(255,255,255,0.85)_inset]"
        style={{
          left: `${xPct}%`,
          top: `${yPct}%`,
          width: `${wPct}%`,
          height: `${hPct}%`,
          cursor: "move",
        }}
        onPointerDown={(event) => startDrag(event, "move")}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/3 top-0 h-full w-px bg-cream/30" />
          <div className="absolute left-2/3 top-0 h-full w-px bg-cream/30" />
          <div className="absolute left-0 top-1/3 h-px w-full bg-cream/30" />
          <div className="absolute left-0 top-2/3 h-px w-full bg-cream/30" />
        </div>

        {HANDLES.map((handle) => (
          <div
            key={handle.id}
            className={`pointer-events-auto absolute h-3 w-3 rounded-sm border-2 border-sage bg-cream shadow-eco ${handle.className}`}
            style={{ cursor: handle.cursor }}
            onPointerDown={(event) => startDrag(event, handle.id)}
          />
        ))}

        <div className="pointer-events-none absolute -top-7 left-0 rounded-md bg-forest px-2 py-0.5 text-[11px] font-semibold text-cream shadow-eco">
          {Math.round(box.width)} × {Math.round(box.height)} px
        </div>
      </div>
    </div>
  );
}
