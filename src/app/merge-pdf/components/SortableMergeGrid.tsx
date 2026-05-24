"use client";

import { useState, type ComponentProps } from "react";
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
import type { MergeGridItem } from "@/app/merge-pdf/types";
import { MergeGridCard } from "@/app/merge-pdf/components/MergeGridCard";
import { getCanvasGridConfig } from "@/components/tools/canvasGridConfig";
import { WorkspaceCanvas } from "@/components/tools/WorkspaceCanvas";

function GridCard(props: ComponentProps<typeof MergeGridCard>) {
  return <MergeGridCard {...props} />;
}

function DragOverlayCard({
  item,
  cardWidthPx,
}: {
  item: MergeGridItem;
  cardWidthPx: number;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-moss/70 bg-cream shadow-eco-lg"
      style={{ width: cardWidthPx }}
    >
      {item.thumbnailDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnailDataUrl}
          alt=""
          className="aspect-[3/4] w-full object-contain bg-moss-light/30 p-1"
        />
      ) : (
        <div className="flex aspect-[3/4] w-full items-center justify-center bg-moss-light/40 text-xs text-sand">
          Loading…
        </div>
      )}
      <div className="border-t border-moss/70 px-2 py-2">
        <p className="truncate text-xs font-semibold text-forest">{item.label}</p>
      </div>
    </div>
  );
}

interface SortableMergeGridProps {
  items: MergeGridItem[];
  onDragEnd: (event: DragEndEvent) => void;
  onRemove: (id: string) => void;
  onRotate?: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onThumbnailLoaded?: (id: string, dataUrl: string) => void;
}

export function SortableMergeGrid({
  items,
  onDragEnd,
  onRemove,
  onRotate,
  onRename,
  onThumbnailLoaded,
}: SortableMergeGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const gridConfig = getCanvasGridConfig(items.length);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor),
  );

  const activeItem = items.find((item) => item.id === activeId);

  const cardProps = {
    onRemove,
    onRotate,
    onRename,
    onThumbnailLoaded,
  };

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
      <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
        <WorkspaceCanvas pageCount={items.length}>
          {items.map((item) => (
            <div key={item.id} className={`${gridConfig.cardClass} shrink-0`}>
              <GridCard item={item} {...cardProps} />
            </div>
          ))}
        </WorkspaceCanvas>
      </SortableContext>

      <DragOverlay>
        {activeItem ? (
          <DragOverlayCard item={activeItem} cardWidthPx={gridConfig.cardWidthPx} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
