"use client";

import { useCallback } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { CARD_CLASS } from "@/lib/ui/classes";

interface ImageUploaderProps {
  label?: string;
  hint?: string;
  imageUrl?: string | null;
  onImage: (dataUrl: string) => void;
  onRemove?: () => void;
  variant?: "default" | "compact";
  disabled?: boolean;
}

function readImageFile(file: File, onImage: (dataUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") onImage(reader.result);
  };
  reader.readAsDataURL(file);
}

export function ImageUploader({
  label = "Upload image",
  hint = "Drop an image here or click to browse",
  imageUrl,
  onImage,
  onRemove,
  variant = "default",
  disabled = false,
}: ImageUploaderProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0];
      if (file) readImageFile(file, onImage);
    },
    [onImage],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"] },
    multiple: false,
    disabled,
    noClick: !!imageUrl,
  });

  const isCompact = variant === "compact";

  if (imageUrl) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-bold text-forest-700">{label}</p>
        <div className={`${CARD_CLASS} flex items-center gap-3 p-3`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Uploaded preview"
            className={`shrink-0 rounded-lg border border-cream-300 bg-white object-contain ${
              isCompact ? "h-12 w-12" : "h-16 w-16"
            }`}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-forest-700">Image added</p>
            <p className="text-xs text-ink/50">Shown in your preview and exports</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => open()}
                disabled={disabled}
                className="rounded-xl border border-cream-300 bg-white px-3 py-1.5 text-xs font-bold text-forest-700 hover:border-forest-200 hover:bg-forest-50 disabled:opacity-60"
              >
                Replace image
              </button>
              {onRemove ? (
                <button
                  type="button"
                  onClick={onRemove}
                  disabled={disabled}
                  className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-ink/50 hover:text-forest-700 disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        </div>
        <input {...getInputProps()} className="sr-only" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-forest-700">{label}</p>
      <div
        {...getRootProps()}
        className={`rounded-xl border-2 border-dashed text-center transition-all duration-200 ${
          isCompact ? "p-4" : "p-6"
        } ${
          disabled
            ? "cursor-not-allowed border-cream-300 bg-cream-200/50 opacity-60"
            : `cursor-pointer ${
                isDragActive
                  ? "border-forest-500 bg-forest-50 text-forest-700 shadow-paper"
                  : "border-cream-300 bg-white text-forest-700 hover:border-forest-500 hover:bg-forest-50/50 hover:shadow-paper"
              }`
        }`}
      >
        <input {...getInputProps()} />
        <div
          className={`mx-auto flex items-center justify-center rounded-full bg-cream-200 ${
            isCompact ? "mb-2 h-9 w-9" : "mb-3 h-12 w-12"
          }`}
        >
          {isCompact ? (
            <ImagePlus
              className={`h-4 w-4 ${isDragActive ? "text-forest-600" : "text-forest-500"}`}
              strokeWidth={2}
              aria-hidden
            />
          ) : (
            <Upload
              className={`h-6 w-6 ${isDragActive ? "text-forest-600" : "text-forest-500"}`}
              strokeWidth={2}
              aria-hidden
            />
          )}
        </div>
        <p className={`font-bold text-forest-700 ${isCompact ? "text-sm" : "text-base"}`}>
          {isDragActive ? "Drop image here" : "Choose image"}
        </p>
        <p className={`mt-1 ${isCompact ? "text-xs" : "text-sm"} text-ink/50`}>{hint}</p>
      </div>
    </div>
  );
}
