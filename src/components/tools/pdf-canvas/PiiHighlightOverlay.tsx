"use client";

import type { BoundingBox } from "@/lib/pdf/coordinate-map";

interface PiiHighlightOverlayProps {
  highlights: BoundingBox[];
  canvasWidth: number;
  canvasHeight: number;
}

export function PiiHighlightOverlay({
  highlights,
  canvasWidth,
  canvasHeight,
}: PiiHighlightOverlayProps) {
  if (canvasWidth <= 0 || canvasHeight <= 0 || highlights.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0">
      {highlights.map((box, index) => (
        <div
          key={index}
          className="absolute mix-blend-multiply"
          style={{
            left: `${(box.x / canvasWidth) * 100}%`,
            top: `${(box.y / canvasHeight) * 100}%`,
            width: `${(box.width / canvasWidth) * 100}%`,
            height: `${(box.height / canvasHeight) * 100}%`,
            backgroundColor: "rgba(253, 224, 71, 0.5)",
          }}
        />
      ))}
    </div>
  );
}
