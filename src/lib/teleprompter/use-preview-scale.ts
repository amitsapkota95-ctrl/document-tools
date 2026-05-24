"use client";

import { useEffect, useState } from "react";
import { getPreviewScale } from "./preview-scale";

export function usePreviewScale(
  viewportRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!enabled) {
      setScale(1);
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport) return;

    const update = () => {
      setScale(getPreviewScale(viewport));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [enabled, viewportRef]);

  return scale;
}
