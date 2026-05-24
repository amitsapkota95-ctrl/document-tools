"use client";

import type { LucideIcon } from "lucide-react";
import {
  FLOATING_DOCK_ACTION,
  FLOATING_DOCK_ACTION_DANGER,
  FLOATING_DOCK_CLASS,
  FLOATING_DOCK_HIDDEN,
  FLOATING_DOCK_VISIBLE,
} from "@/lib/ui/classes";

export interface FloatingDockAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "danger";
  title?: string;
}

interface FloatingActionDockProps {
  count: number;
  actions: FloatingDockAction[];
}

export function FloatingActionDock({ count, actions }: FloatingActionDockProps) {
  const visible = count > 0;

  return (
    <div
      className={`${FLOATING_DOCK_CLASS} ${visible ? FLOATING_DOCK_VISIBLE : FLOATING_DOCK_HIDDEN}`}
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-2.5 border-r border-cream-300 pr-4">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-forest-700 text-[10px] font-extrabold text-cream-100">
          {count}
        </span>
        <span className="text-xs font-bold text-forest-700">Selected</span>
      </div>
      <div className="flex items-center gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const actionClass =
            action.variant === "danger" ? FLOATING_DOCK_ACTION_DANGER : FLOATING_DOCK_ACTION;

          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className={actionClass}
              title={action.title ?? action.label}
            >
              <Icon className="h-3.5 w-3.5 text-forest-600" aria-hidden />
              <span className="hidden md:inline">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
