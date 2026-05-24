"use client";

import { useEffect, useRef, useState } from "react";

export function computeCanvasFitScale(
  containerWidth: number,
  containerHeight: number,
  canvasWidth: number,
  canvasHeight: number,
): number {
  if (canvasWidth <= 0 || canvasHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) {
    return 1;
  }

  return Math.min(containerWidth / canvasWidth, containerHeight / canvasHeight, 1);
}

export function useCanvasFitScale(
  canvasWidth: number,
  canvasHeight: number,
  enabled: boolean,
): { fitScale: number; containerRef: React.RefObject<HTMLDivElement | null> } {
  const containerRef = useRef<HTMLDivElement>(null);
  const [observedFitScale, setObservedFitScale] = useState(1);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      setObservedFitScale(
        computeCanvasFitScale(
          container.clientWidth,
          container.clientHeight,
          canvasWidth,
          canvasHeight,
        ),
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [canvasWidth, canvasHeight, enabled]);

  return { fitScale: enabled ? observedFitScale : 1, containerRef };
}
