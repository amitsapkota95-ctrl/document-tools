import type { ToolDefinition } from "@/lib/tools/registry";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CARD_CLASS } from "@/lib/ui/classes";

interface ToolCardProps {
  tool: ToolDefinition;
}

export function ToolCard({ tool }: ToolCardProps) {
  const Icon = tool.icon;

  return (
    <Link
      href={`/${tool.slug}`}
      className={`${CARD_CLASS} group flex cursor-pointer flex-col justify-between p-6 transition-all duration-300 hover:border-forest-500 hover:shadow-paper-lg`}
    >
      <div className="space-y-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-forest-200 bg-forest-50 text-forest-500 transition-transform group-hover:scale-105">
          <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-bold text-forest-700 transition-colors group-hover:text-forest-500">
            {tool.title}
          </h3>
          <p className="text-xs font-semibold leading-relaxed text-ink/60">{tool.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 pt-4 text-[11px] font-bold text-forest-500">
        Open Tool
        <ChevronRight
          className="h-3 w-3 transition-transform group-hover:translate-x-1"
          aria-hidden
        />
      </div>
    </Link>
  );
}
