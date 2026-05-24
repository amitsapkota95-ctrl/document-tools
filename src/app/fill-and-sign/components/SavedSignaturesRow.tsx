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
    <div className="eco-card space-y-4 rounded-xl border border-moss/70 p-4 shadow-eco">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-serif text-lg font-bold text-forest">Signatures &amp; Stamps</h3>
        <ToolButton onClick={onAddSignature} className="gap-2">
          <PenLine className="h-4 w-4" />
          Add Signature
        </ToolButton>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-sand">Quick stamps</p>
        <div className="flex flex-wrap gap-2">
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
              className="rounded-xl border border-moss/70 bg-cream px-3 py-2 shadow-eco transition-shadow hover:shadow-eco-lg"
              title={`Place ${stamp.label} stamp on current page`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stamp.dataUrl}
                alt={stamp.label}
                className="h-10 w-24 object-contain"
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-sand">Saved signatures</p>
        {signatures.length === 0 ? (
          <p className="text-sm text-sand">
            Create a signature to save it locally. Your vault persists between visits.
          </p>
        ) : (
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 pt-1">
            {signatures.map((signature) => (
              <div key={signature.id} className="relative shrink-0 pt-2 pr-2">
                <button
                  type="button"
                  onClick={() => onSelect(signature)}
                  className="block min-w-32 rounded-xl border border-moss/70 bg-cream p-3 text-left shadow-eco transition-shadow hover:shadow-eco-lg"
                  title="Place on current page"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={signature.dataUrl}
                    alt={signature.label}
                    className="mx-auto h-12 w-28 object-contain"
                  />
                  <span className="mt-2 block max-w-28 truncate text-xs font-semibold text-forest">
                    {signature.label}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(signature.id)}
                  className="absolute right-0 top-0 z-10 rounded-full border border-moss/70 bg-cream p-1 text-forest shadow-eco transition-colors hover:bg-forest hover:text-cream"
                  aria-label={`Remove ${signature.label}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
