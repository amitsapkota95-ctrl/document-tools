"use client";

import type { ReactNode, Ref } from "react";

export const FILMSTRIP_CARD_WIDTH = 120;

interface ThumbnailFilmstripProps {
  children: ReactNode;
  /** Ref for the inner flex row (e.g. dnd-kit droppable). */
  innerRef?: Ref<HTMLDivElement>;
  innerProps?: Record<string, unknown>;
  className?: string;
}

export function ThumbnailFilmstrip({
  children,
  innerRef,
  innerProps,
  className = "",
}: ThumbnailFilmstripProps) {
  return (
    <div
      className={`max-h-[calc(100vh-10rem)] overflow-x-auto overflow-y-hidden pb-2 ${className}`}
    >
      <div
        ref={innerRef}
        className="flex w-max min-w-full gap-3"
        {...innerProps}
      >
        {children}
      </div>
    </div>
  );
}

export const FILMSTRIP_CARD_CLASS = "w-[120px] shrink-0";
