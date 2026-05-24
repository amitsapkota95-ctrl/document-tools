"use client";

import type { Accept } from "react-dropzone";
import { FileUploader } from "@/components/tools/FileUploader";
import { TOOL_SIDEBAR_COMPACT_UPLOADER, TOOL_SIDEBAR_SECTION_LABEL } from "@/lib/ui/classes";

interface ToolSidebarFileControlsProps {
  mode: "single" | "multi";
  accept: Accept;
  onReplace: (files: File[]) => void;
  onAdd?: (files: File[]) => void;
  disabled?: boolean;
  replaceLabel?: string;
  replaceHint?: string;
  addLabel?: string;
  addHint?: string;
  addMultiple?: boolean;
}

export function ToolSidebarFileControls({
  mode,
  accept,
  onReplace,
  onAdd,
  disabled = false,
  replaceLabel = "Replace PDF",
  replaceHint = "Start over with a different file",
  addLabel = "Add PDF",
  addHint = "Append pages from another PDF",
  addMultiple = true,
}: ToolSidebarFileControlsProps) {
  return (
    <div className={`${TOOL_SIDEBAR_COMPACT_UPLOADER} space-y-4`}>
      {mode === "multi" && onAdd ? (
        <div>
          <p className={`${TOOL_SIDEBAR_SECTION_LABEL} mb-2`}>Add more files</p>
          <FileUploader
            variant="compact"
            multiple={addMultiple}
            disabled={disabled}
            onFiles={onAdd}
            accept={accept}
            label={addLabel}
            hint={addHint}
          />
        </div>
      ) : null}
      <div>
        <p className={`${TOOL_SIDEBAR_SECTION_LABEL} mb-2`}>
          {mode === "multi" ? "Replace all" : "Replace file"}
        </p>
        <FileUploader
          variant="compact"
          disabled={disabled}
          onFiles={onReplace}
          accept={accept}
          label={replaceLabel}
          hint={replaceHint}
        />
      </div>
    </div>
  );
}
