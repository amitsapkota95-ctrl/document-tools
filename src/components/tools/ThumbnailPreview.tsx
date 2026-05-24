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
    <div className="aspect-[3/4] w-full bg-moss-light/30">
      {src ? (
        <div className="flex h-full w-full items-center justify-center p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full object-contain transition-transform duration-200"
            style={imageStyle}
            draggable={false}
          />
        </div>
      ) : (
        <div className="flex h-full items-center justify-center text-[11px] text-sand-light">
          {loading ? loadingLabel : placeholderLabel}
        </div>
      )}
    </div>
  );
}
