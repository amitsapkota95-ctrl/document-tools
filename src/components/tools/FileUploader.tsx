"use client";

import { useCallback } from "react";
import { useDropzone, type Accept } from "react-dropzone";
import { Upload } from "lucide-react";

interface FileUploaderProps {
  onFiles: (files: File[]) => void;
  accept?: Accept;
  multiple?: boolean;
  label?: string;
  hint?: string;
  variant?: "default" | "compact";
  disabled?: boolean;
}

export function FileUploader({
  onFiles,
  accept,
  multiple = false,
  label = "Drop files here",
  hint = "or click to choose files from your device",
  variant = "default",
  disabled = false,
}: FileUploaderProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) onFiles(accepted);
    },
    [onFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    disabled,
  });

  const isCompact = variant === "compact";

  return (
    <div
      {...getRootProps()}
      className={`rounded-xl border-2 border-dashed text-center transition-all duration-200 ${
        isCompact ? "p-4" : "p-10"
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
          isCompact ? "mb-2 h-9 w-9" : "mb-4 h-14 w-14"
        }`}
      >
        <Upload
          className={`${isCompact ? "h-4 w-4" : "h-7 w-7"} ${isDragActive ? "text-sage-dark" : "text-accent"}`}
          strokeWidth={2}
          aria-hidden
        />
      </div>
      <p className={`font-semibold text-forest ${isCompact ? "text-sm" : "text-lg"}`}>{label}</p>
      {!isCompact ? (
        <p className={`mt-2 text-sm ${isDragActive ? "text-forest-muted" : "text-sand"}`}>
          {hint}
        </p>
      ) : hint ? (
        <p className={`mt-1 text-xs ${isDragActive ? "text-forest-muted" : "text-sand"}`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
