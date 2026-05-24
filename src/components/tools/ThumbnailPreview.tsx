"use client";

import type { CSSProperties } from "react";

interface ThumbnailPreviewProps {
  src?: string | null;
  alt: string;
  loading?: boolean;
  loadingLabel?: string;
  placeholderLabel?: string;
  imageStyle?: CSSProperties;
}

export function ThumbnailPreview({
  src,
  alt,
  loading = false,
  loadingLabel = "Loading…",
  placeholderLabel = "Preview",
  imageStyle,
}: ThumbnailPreviewProps) {
  return (
    <div className="aspect-[3/4] w-full bg-cream-200/40">
      {src ? (
        <div className="flex h-full w-full items-center justify-center p-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full rounded-lg object-contain shadow-sm transition-transform duration-200"
            style={imageStyle}
            draggable={false}
          />
        </div>
      ) : (
        <div className="flex h-full items-center justify-center text-[11px] text-ink/50">
          {loading ? loadingLabel : placeholderLabel}
        </div>
      )}
    </div>
  );
}
