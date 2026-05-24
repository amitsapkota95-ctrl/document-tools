import type { ToolDefinition } from "@/lib/tools/registry";
import Link from "next/link";

interface ToolCardProps {
  tool: ToolDefinition;
}

export function ToolCard({ tool }: ToolCardProps) {
  const Icon = tool.icon;

  return (
    <Link
      href={`/${tool.slug}`}
      className="eco-card group block rounded-xl p-6 shadow-eco transition-all duration-200 hover:-translate-y-1 hover:border-sage hover:shadow-eco-hover"
    >
      <div className="mb-4 inline-flex rounded-xl bg-moss-light p-3 ring-1 ring-moss-dark/50 transition-all group-hover:bg-sage/25 group-hover:ring-sage/60">
        <Icon
          className="h-7 w-7 text-sage-dark"
          strokeWidth={2}
          aria-hidden
        />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-forest">{tool.title}</h3>
      <p className="text-sm leading-relaxed text-sand group-hover:text-forest-muted">
        {tool.description}
      </p>
    </Link>
  );
}
