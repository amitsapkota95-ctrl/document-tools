"use client";

import { useEffect, useRef, useState } from "react";
import { renderPdfPageThumbnail } from "@/lib/pdf/thumbnails";
import { ThumbnailPreview } from "@/components/tools/ThumbnailPreview";
import type { PageRotation } from "@/app/merge-pdf/types";

interface LazyPageThumbnailProps {
  file: File;
  pageIndex: number;
  password?: string;
  rotation?: PageRotation;
  alt: string;
  onLoaded?: (dataUrl: string) => void;
}

export function LazyPageThumbnail({
  file,
  pageIndex,
  password,
  rotation = 0,
  alt,
  onLoaded,
}: LazyPageThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    loadedRef.current = false;
    setDataUrl(null);
    setLoading(false);
  }, [file, pageIndex, password, rotation]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || loadedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || loadedRef.current) return;
        loadedRef.current = true;
        setLoading(true);

        renderPdfPageThumbnail(file, pageIndex, 0.25, password, rotation)
          .then((url) => {
            setDataUrl(url);
            onLoaded?.(url);
          })
          .finally(() => setLoading(false));
      },
      { rootMargin: "120px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [file, pageIndex, password, rotation, onLoaded]);

  return (
    <div ref={containerRef}>
      <ThumbnailPreview src={dataUrl} alt={alt} loading={loading} />
    </div>
  );
}
