"use client";

import { useRouter } from "next/navigation";
import type { ToolDefinition } from "@/lib/tools/registry";
import { TOOL_CATEGORIES } from "@/lib/tools/registry";
import { HERO_PDF_TOOL_SLUGS, storeHeroImport } from "@/lib/hero-import";
import { X } from "lucide-react";

interface ToolPickerModalProps {
  open: boolean;
  fileName: string;
  dataUrl: string;
  mimeType: string;
  onClose: () => void;
}

const PDF_TOOLS: ToolDefinition[] = TOOL_CATEGORIES.flatMap((category) =>
  category.tools.filter((tool) => HERO_PDF_TOOL_SLUGS.includes(tool.slug)),
);

export function ToolPickerModal({
  open,
  fileName,
  dataUrl,
  mimeType,
  onClose,
}: ToolPickerModalProps) {
  const router = useRouter();

  if (!open) return null;

  const handleSelect = (tool: ToolDefinition) => {
    storeHeroImport({ fileName, dataUrl, mimeType }, tool.slug);
    onClose();
    router.push(`/${tool.slug}?from=hero`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-paper-lg"
        role="dialog"
        aria-modal
        aria-labelledby="tool-picker-title"
      >
        <div className="flex items-center justify-between border-b border-cream-300 bg-cream-100 px-5 py-4">
          <div>
            <h2 id="tool-picker-title" className="font-serif text-lg font-bold text-forest-700">
              What would you like to do?
            </h2>
            <p className="mt-1 truncate text-xs font-semibold text-ink/50">{fileName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-cream-300 hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          <p className="mb-3 text-xs font-semibold text-ink/60">
            Choose a tool to open with your file:
          </p>
          <ul className="space-y-2">
            {PDF_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <li key={tool.slug}>
                  <button
                    type="button"
                    onClick={() => handleSelect(tool)}
                    className="flex w-full items-center gap-3 rounded-xl border border-cream-300 bg-white p-3 text-left transition-all hover:border-forest-500 hover:bg-forest-50/50 hover:shadow-paper"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-forest-200 bg-forest-50 text-forest-500">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-serif text-sm font-bold text-forest-700">
                        {tool.title}
                      </span>
                      <span className="block truncate text-xs font-semibold text-ink/50">
                        {tool.description}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
