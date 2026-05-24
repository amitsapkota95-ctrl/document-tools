"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TOOL_SIDEBAR_SECTION_LABEL } from "@/lib/ui/classes";

interface AdvancedToolsToggleProps {
  label?: string;
  variant?: "inline" | "sidebar";
  children: React.ReactNode;
}

export function AdvancedToolsToggle({
  label = "Advanced Tools",
  variant = "inline",
  children,
}: AdvancedToolsToggleProps) {
  const [open, setOpen] = useState(false);

  if (variant === "sidebar") {
    return (
      <div className="space-y-4 border-t border-cream-300 pt-4">
        <p className={TOOL_SIDEBAR_SECTION_LABEL}>{label}</p>
        <div className="space-y-4">{children}</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-cream-300 bg-white/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-forest-700 transition-colors hover:bg-cream-200/40"
      >
        <span>{label}</span>
        {open ? <ChevronUp className="h-4 w-4 text-cream-400" /> : <ChevronDown className="h-4 w-4 text-cream-400" />}
      </button>
      {open ? <div className="space-y-4 border-t border-cream-300 px-4 py-4">{children}</div> : null}
    </div>
  );
}
