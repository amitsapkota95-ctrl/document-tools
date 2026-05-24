"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ToolCard } from "@/components/ui/ToolCard";
import { ALL_TOOLS, TOOL_CATEGORIES, type ToolCategory } from "@/lib/tools/registry";

type FilterCategory = "all" | ToolCategory["id"];

const TABS: { id: FilterCategory; label: string }[] = [
  { id: "all", label: "All Tools" },
  { id: "pdf", label: "PDF Tools" },
  { id: "content", label: "Writing & Office" },
  { id: "utilities", label: "Utilities" },
];

interface ToolsDirectoryProps {
  id?: string;
}

export function ToolsDirectory({ id = "tools-directory" }: ToolsDirectoryProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FilterCategory>("all");

  const filteredTools = useMemo(() => {
    const cleanQuery = query.toLowerCase().trim();

    return ALL_TOOLS.filter((tool) => {
      const categoryMatch =
        category === "all" ||
        TOOL_CATEGORIES.some((cat) => cat.id === category && cat.tools.some((t) => t.slug === tool.slug));

      if (!categoryMatch) return false;
      if (!cleanQuery) return true;

      return (
        tool.title.toLowerCase().includes(cleanQuery) ||
        tool.description.toLowerCase().includes(cleanQuery)
      );
    });
  }, [query, category]);

  return (
    <section id={id} className="mx-auto max-w-6xl flex-grow space-y-10 px-6 py-16">
      <div className="mx-auto max-w-xl space-y-3 text-center">
        <h2 className="font-serif text-3xl font-bold text-forest-700">What would you like to do?</h2>
        <p className="text-xs font-semibold leading-relaxed text-ink/60">
          Choose a friendly tool below to begin. All tasks happen instantly on your device.
        </p>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 border-b border-cream-300 pb-6 md:flex-row">
        <div className="flex w-full items-center gap-1.5 rounded-xl border border-cream-300 bg-cream-200 p-1 md:w-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategory(tab.id)}
              className={`flex-1 rounded-lg px-4 py-1.5 text-xs font-bold transition-all md:flex-none ${
                category === tab.id
                  ? "bg-forest-700 text-white"
                  : "text-ink/60 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search
            className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for a simple tool..."
            className="w-full rounded-xl border border-cream-300 bg-white py-2.5 pl-9 pr-4 text-xs font-semibold text-ink shadow-paper-sm outline-none transition-all placeholder:text-cream-400 focus:border-forest-500 focus:ring-1 focus:ring-forest-500/30"
          />
        </div>
      </div>

      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="space-y-3 py-12 text-center">
          <h3 className="font-serif text-xl font-bold text-forest-700">We couldn&apos;t find that tool</h3>
          <p className="text-xs font-semibold text-ink/60">
            Try typing a simpler word like &quot;sign&quot;, &quot;join&quot;, or &quot;invoice&quot;.
          </p>
        </div>
      )}
    </section>
  );
}
