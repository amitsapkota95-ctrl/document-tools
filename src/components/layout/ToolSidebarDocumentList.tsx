"use client";

import { X } from "lucide-react";
import { TOOL_SIDEBAR_SECTION_LABEL } from "@/lib/ui/classes";

export interface ToolSidebarDocumentEntry {
  id: string;
  displayName: string;
  pageCount: number;
}

interface ToolSidebarDocumentListProps {
  documents: ToolSidebarDocumentEntry[];
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export function ToolSidebarDocumentList({
  documents,
  onRemove,
  disabled = false,
}: ToolSidebarDocumentListProps) {
  if (documents.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className={TOOL_SIDEBAR_SECTION_LABEL}>Uploaded files</p>
      <ul className="space-y-2">
        {documents.map((doc) => (
          <li
            key={doc.id}
            className="flex items-center gap-2 rounded-lg border border-cream-300 bg-white px-3 py-2 shadow-paper"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-forest-700">{doc.displayName}</p>
              <p className="text-xs text-ink/50">
                {doc.pageCount} page{doc.pageCount !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(doc.id)}
              disabled={disabled}
              className="shrink-0 rounded-full border border-cream-300 bg-cream-100 p-1 text-forest-700 transition-colors hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Remove ${doc.displayName}`}
              title="Remove this file"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
