"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  SIDEBAR_ACCORDION_CONTENT,
  SIDEBAR_ACCORDION_TRIGGER,
  SIDEBAR_ACCORDION_WRAPPER,
} from "@/lib/ui/classes";

interface SidebarAccordionProps {
  id: string;
  title: ReactNode;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function SidebarAccordion({
  id,
  title,
  icon,
  defaultOpen = true,
  children,
}: SidebarAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={SIDEBAR_ACCORDION_WRAPPER}>
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((value) => !value)}
        className={SIDEBAR_ACCORDION_TRIGGER}
      >
        <span className="flex items-center gap-2.5">
          {icon}
          {title}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-cream-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-trigger`} className={SIDEBAR_ACCORDION_CONTENT}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
