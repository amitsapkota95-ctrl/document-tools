"use client";

import type { ReactNode, Ref } from "react";
import { getCanvasGridConfig } from "@/components/tools/canvasGridConfig";

interface WorkspaceCanvasProps {
  pageCount: number;
  children: ReactNode;
  innerRef?: Ref<HTMLDivElement>;
  innerProps?: Record<string, unknown>;
}

export function WorkspaceCanvas({
  pageCount,
  children,
  innerRef,
  innerProps,
}: WorkspaceCanvasProps) {
  const { gapClass, justifyClass, canvasSurfaceClass, innerGridClass } =
    getCanvasGridConfig(pageCount);

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-2 sm:p-4">
      <div
        className={`overflow-y-auto overflow-x-hidden rounded-2xl border border-dashed border-cream-300 bg-white/80 shadow-paper backdrop-blur-sm ${canvasSurfaceClass}`}
      >
        <div
          ref={innerRef}
          className={`flex flex-wrap ${innerGridClass} ${gapClass} ${justifyClass}`}
          {...innerProps}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
