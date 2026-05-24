"use client";

import type { ScriptMarker } from "@/lib/teleprompter/types";

interface MarkerJumpListProps {
  markers: ScriptMarker[];
  onJump: (marker: ScriptMarker) => void;
  variant?: "sidebar" | "dropdown";
  open?: boolean;
}

export function MarkerJumpList({
  markers,
  onJump,
  variant = "sidebar",
  open = true,
}: MarkerJumpListProps) {
  if (markers.length === 0) {
    if (variant === "sidebar") {
      return (
        <p className="text-xs text-ink/50">
          Add section markers with the toolbar or type <code>=== Section Name ===</code>
        </p>
      );
    }
    return null;
  }

  if (variant === "dropdown") {
    if (!open) return null;
    return (
      <div className="absolute bottom-full left-0 z-10 mb-2 max-h-48 w-56 overflow-y-auto rounded border bg-black/95 p-2 shadow-lg">
        {markers.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onJump(m)}
            className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-white/10"
          >
            ▶ {m.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">Section markers</p>
      <ul className="space-y-1">
        {markers.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => onJump(m)}
              className="w-full rounded-lg border border-cream-300 px-3 py-2 text-left text-sm font-medium text-forest-700 transition-colors hover:bg-cream-200/80"
            >
              ▶ {m.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
