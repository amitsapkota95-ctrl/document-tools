"use client";

import { useCallback, useRef, useState } from "react";

interface ImageCompareSliderProps {
  beforeUrl: string;
  afterUrl: string;
  className?: string;
}

export function ImageCompareSlider({ beforeUrl, afterUrl, className = "" }: ImageCompareSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPosition(pct);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    updatePosition(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = () => setDragging(false);

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-sm font-semibold text-forest">Before / After Preview</p>
      <div
        ref={containerRef}
        className="relative aspect-square max-h-[500px] w-full max-w-[500px] overflow-hidden rounded-xl border-2 border-forest shadow-eco-lg select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={afterUrl} alt="Compressed preview" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={beforeUrl}
            alt="Original preview"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div
          className="absolute inset-y-0 z-10 w-1 cursor-ew-resize bg-sage shadow-[0_0_8px_#22c55e]"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
          onPointerDown={handlePointerDown}
        >
          <div className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-sage bg-forest text-xs font-bold text-sage">
            ↔
          </div>
        </div>
        <span className="absolute bottom-2 left-2 rounded bg-forest/80 px-2 py-0.5 text-xs font-bold text-cream">
          Before
        </span>
        <span className="absolute bottom-2 right-2 rounded bg-forest/80 px-2 py-0.5 text-xs font-bold text-cream">
          After
        </span>
      </div>
    </div>
  );
}
