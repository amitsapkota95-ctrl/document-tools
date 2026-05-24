"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

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
      <div className="space-y-4 border-t border-moss/40 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-sand">{label}</p>
        <div className="space-y-4">{children}</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-moss-dark/60 bg-moss-light/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-forest transition-transform active:translate-y-px"
      >
        <span>{label}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open ? <div className="space-y-4 border-t border-moss/50 px-4 py-4">{children}</div> : null}
    </div>
  );
}
