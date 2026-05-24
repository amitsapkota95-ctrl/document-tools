"use client";

import type { ReactNode } from "react";

interface PdfEditorWorkspaceProps {
  children: ReactNode;
}

/** Centers a single-page PDF editor in a premium dashed canvas shell. */
export function PdfEditorWorkspace({ children }: PdfEditorWorkspaceProps) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-2 sm:p-4">
      <div className="flex h-full w-full max-h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-dashed border-moss/50 bg-cream/90 shadow-eco backdrop-blur-sm">
        <div className="relative min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
