import { CategoryHeader } from "@/components/ui/CategoryHeader";
import { ToolCard } from "@/components/ui/ToolCard";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";
import { BADGE_CLASS } from "@/lib/ui/classes";
import { TOOL_CATEGORIES } from "@/lib/tools/registry";
import { Leaf, Shield, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <section className="eco-hero-wash mb-16 animate-fade-up rounded-2xl border border-moss-dark/60 p-8 md:p-12">
        <div className="max-w-3xl">
          <div className={`${BADGE_CLASS} mb-6`}>
            <Leaf className="h-4 w-4 text-sage-dark" aria-hidden />
            <span>100% private · Runs entirely in your browser</span>
          </div>
          <h1 className="font-serif text-5xl font-bold leading-[1.08] tracking-tight text-forest md:text-6xl">
            Your documents,{" "}
            <span className="text-sage-dark">your rules.</span>
          </h1>
          <p className="mt-6 text-xl leading-relaxed text-sand">
            Free tools for everyday document tasks — merge, compress, convert,
            and sign PDFs, and more. No uploads. No accounts. No tracking.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PrivacyBadge />
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            {[
              { icon: Shield, text: "Files never leave your device" },
              { icon: Zap, text: "Instant — no waiting" },
              { icon: Leaf, text: "Works offline" },
            ].map(({ icon: Icon, text }) => (
              <span
                key={text}
                className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-forest ring-1 ring-moss-dark/40"
              >
                <Icon className="h-4 w-4 text-sage-dark" aria-hidden />
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {TOOL_CATEGORIES.map((category) => (
        <section key={category.id} className="mb-16">
          <CategoryHeader title={category.title} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {category.tools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
