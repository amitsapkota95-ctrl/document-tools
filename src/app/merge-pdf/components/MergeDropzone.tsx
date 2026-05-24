"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";

interface MergeDropzoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

export function MergeDropzone({ onFiles, disabled = false }: MergeDropzoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) onFiles(accepted);
    },
    [onFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      } ${
        isDragActive
          ? "border-sage bg-moss-light text-forest shadow-eco-lg"
          : "border-sage bg-moss-light/30 text-forest hover:border-sage-dark hover:bg-moss-light/50 hover:shadow-eco"
      }`}
    >
      <input {...getInputProps()} />
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sage/20">
        <Upload
          className={`h-8 w-8 ${isDragActive ? "text-sage-dark" : "text-accent"}`}
          strokeWidth={2}
          aria-hidden
        />
      </div>
      <p className="text-lg font-semibold text-forest">Drop PDF files here</p>
      <p className={`mt-2 text-sm ${isDragActive ? "text-forest-muted" : "text-sand"}`}>
        or click to choose files — drag thumbnails below to set the order
      </p>
    </div>
  );
}
