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
        <p className="text-sm font-semibold text-forest">{label}</p>
        <div className={`${CARD_CLASS} flex items-center gap-3 p-3`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Uploaded preview"
            className={`shrink-0 rounded-lg border border-moss-dark/40 bg-white object-contain ${
              isCompact ? "h-12 w-12" : "h-16 w-16"
            }`}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-forest">Image added</p>
            <p className="text-xs text-sand">Shown in your preview and exports</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => open()}
                disabled={disabled}
                className="rounded-lg border border-moss-dark bg-moss-light/80 px-3 py-1.5 text-xs font-semibold text-forest hover:border-sage-dark hover:bg-moss-light disabled:opacity-60"
              >
                Replace image
              </button>
              {onRemove ? (
                <button
                  type="button"
                  onClick={onRemove}
                  disabled={disabled}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-sand hover:text-forest disabled:opacity-60"
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
      <p className="text-sm font-semibold text-forest">{label}</p>
      <div
        {...getRootProps()}
        className={`rounded-xl border-2 border-dashed text-center transition-all duration-200 ${
          isCompact ? "p-4" : "p-6"
        } ${
          disabled
            ? "cursor-not-allowed border-moss/50 bg-moss-light/30 opacity-60"
            : `cursor-pointer ${
                isDragActive
                  ? "border-sage bg-moss-light text-forest shadow-eco-lg"
                  : "border-moss-dark bg-moss-light/60 text-forest hover:border-sage hover:bg-moss-light hover:shadow-eco"
              }`
        }`}
      >
        <input {...getInputProps()} />
        <div
          className={`mx-auto flex items-center justify-center rounded-full bg-sage/20 ${
            isCompact ? "mb-2 h-9 w-9" : "mb-3 h-12 w-12"
          }`}
        >
          {isCompact ? (
            <ImagePlus
              className={`h-4 w-4 ${isDragActive ? "text-sage-dark" : "text-accent"}`}
              strokeWidth={2}
              aria-hidden
            />
          ) : (
            <Upload
              className={`h-6 w-6 ${isDragActive ? "text-sage-dark" : "text-accent"}`}
              strokeWidth={2}
              aria-hidden
            />
          )}
        </div>
        <p className={`font-semibold text-forest ${isCompact ? "text-sm" : "text-base"}`}>
          {isDragActive ? "Drop image here" : "Choose image"}
        </p>
        <p className={`mt-1 ${isCompact ? "text-xs" : "text-sm"} text-sand`}>{hint}</p>
      </div>
    </div>
  );
}
