"use client";

import { useMemo } from "react";
import { PenLine, X } from "lucide-react";
import { ToolButton } from "@/components/tools/ToolButton";
import {
  DEFAULT_STAMP_HEIGHT,
  DEFAULT_STAMP_WIDTH,
  STAMP_PRESETS,
  createStampDataUrl,
} from "@/app/fill-and-sign/sign-assets";
import type { SignaturePlacementSize } from "@/app/fill-and-sign/types";
import type { SavedSignature } from "@/stores/signature-vault-store";
import { TOOL_SIDEBAR_SECTION_LABEL } from "@/lib/ui/classes";

interface SavedSignaturesRowProps {
  signatures: SavedSignature[];
  onSelect: (signature: SavedSignature) => void;
  onRemove: (id: string) => void;
  onAddSignature: () => void;
  onPlaceAsset: (dataUrl: string, label: string, size?: SignaturePlacementSize) => void;
}

export function SavedSignaturesRow({
  signatures,
  onSelect,
  onRemove,
  onAddSignature,
  onPlaceAsset,
}: SavedSignaturesRowProps) {
  const stampAssets = useMemo(
    () =>
      STAMP_PRESETS.map((stamp) => ({
        ...stamp,
        dataUrl: createStampDataUrl(stamp.text),
      })),
    [],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className={TOOL_SIDEBAR_SECTION_LABEL}>Stamp a word on your pages</p>
        <div className="grid grid-cols-2 gap-2">
          {stampAssets.map((stamp) => (
            <button
              key={stamp.id}
              type="button"
              onClick={() =>
                onPlaceAsset(stamp.dataUrl, stamp.label, {
                  width: DEFAULT_STAMP_WIDTH,
                  height: DEFAULT_STAMP_HEIGHT,
                })
              }
              className="flex flex-col items-center gap-1.5 rounded-lg border border-cream-300 bg-white p-2 text-[10px] font-bold text-forest-700 transition-all hover:border-forest-500 hover:bg-forest-50/40"
              title={`Place ${stamp.label} stamp on current page`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stamp.dataUrl}
                alt={stamp.label}
                className="h-8 w-full object-contain"
              />
              {stamp.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 border-t border-cream-300 pt-3">
        <p className={TOOL_SIDEBAR_SECTION_LABEL}>Add your signature</p>
        <ToolButton onClick={onAddSignature} className="w-full gap-2">
          <PenLine className="h-4 w-4" aria-hidden />
          Draw signature
        </ToolButton>
      </div>

      {signatures.length > 0 ? (
        <div className="space-y-2 border-t border-cream-300 pt-3">
          <p className={TOOL_SIDEBAR_SECTION_LABEL}>Saved signatures</p>
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 pt-1">
            {signatures.map((signature) => (
              <div key={signature.id} className="relative shrink-0 pt-2 pr-2">
                <button
                  type="button"
                  onClick={() => onSelect(signature)}
                  className="block min-w-32 rounded-xl border border-cream-300 bg-white p-3 text-left shadow-paper transition-shadow hover:border-forest-200 hover:shadow-paper-lg"
                  title="Place on current page"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={signature.dataUrl}
                    alt={signature.label}
                    className="mx-auto h-12 w-28 object-contain"
                  />
                  <span className="mt-2 block max-w-28 truncate text-xs font-bold text-forest-700">
                    {signature.label}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(signature.id)}
                  className="absolute right-0 top-0 z-10 rounded-full border border-cream-300 bg-white p-1 text-forest-700 shadow-paper transition-colors hover:bg-cream-200"
                  aria-label={`Remove ${signature.label}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
