"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import type { SplitDocument, SplitPage } from "@/app/split-pdf/types";
import { SplitPageCard } from "@/app/split-pdf/components/SplitPageCard";
import { getCanvasGridConfig } from "@/components/tools/canvasGridConfig";
import { WorkspaceCanvas } from "@/components/tools/WorkspaceCanvas";

function DragOverlayCard({
  page,
  pageNumber,
  cardWidthPx,
}: {
  page: SplitPage;
  pageNumber: number;
  cardWidthPx: number;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-cream-300 bg-cream shadow-paper-lg"
      style={{ width: cardWidthPx }}
    >
      {page.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={page.thumbnail}
          alt=""
          className="aspect-[3/4] w-full object-contain bg-cream-200/50 p-1"
        />
      ) : (
        <div className="flex aspect-[3/4] w-full items-center justify-center bg-cream-200/60 text-xs text-ink/60">
          Loading…
        </div>
      )}
      <div className="border-t border-cream-300 px-2 py-2">
        <p className="truncate text-xs font-semibold text-forest-700">Page {pageNumber}</p>
      </div>
    </div>
  );
}

interface SplitPageGridProps {
  pages: SplitPage[];
  documents: SplitDocument[];
  selected: Set<string>;
  blankPages: Set<string>;
  selectionEnabled: boolean;
  onDragEnd: (event: DragEndEvent) => void;
  onToggleSelect: (pageId: string) => void;
  onRemovePage: (pageId: string) => void;
  onRotatePage: (pageId: string) => void;
}

export function SplitPageGrid({
  pages,
  documents,
  selected,
  blankPages,
  selectionEnabled,
  onDragEnd,
  onToggleSelect,
  onRemovePage,
  onRotatePage,
}: SplitPageGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const docById = new Map(documents.map((doc) => [doc.id, doc]));
  const activePage = pages.find((page) => page.id === activeId);
  const activePageNumber = activePage
    ? pages.findIndex((page) => page.id === activePage.id) + 1
    : 0;

  const gridConfig = getCanvasGridConfig(pages.length);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event: DragStartEvent) => setActiveId(String(event.active.id))}
      onDragEnd={(event) => {
        setActiveId(null);
        onDragEnd(event);
      }}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={pages.map((page) => page.id)} strategy={rectSortingStrategy}>
        <WorkspaceCanvas pageCount={pages.length}>
          {pages.map((page, index) => (
            <div key={page.id} className={`${gridConfig.cardClass} shrink-0`}>
              <SplitPageCard
                page={page}
                pageNumber={index + 1}
                sourceName={docById.get(page.docId)?.displayName ?? "PDF"}
                selected={selected.has(page.id)}
                isBlank={blankPages.has(page.id)}
                selectionEnabled={selectionEnabled}
                onToggleSelect={onToggleSelect}
                onRemove={onRemovePage}
                onRotate={onRotatePage}
              />
            </div>
          ))}
        </WorkspaceCanvas>
      </SortableContext>

      <DragOverlay>
        {activePage ? (
          <DragOverlayCard
            page={activePage}
            pageNumber={activePageNumber}
            cardWidthPx={gridConfig.cardWidthPx}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
