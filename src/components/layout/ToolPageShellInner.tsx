"use client";

import { PrivacyBadge } from "@/components/ui/PrivacyBadge";
import { useToolLayout } from "@/contexts/tool-layout-context";

interface ToolPageShellInnerProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function ToolPageShellInner({ title, description, children }: ToolPageShellInnerProps) {
  const { isImmersive } = useToolLayout();

  return (
    <article className={isImmersive ? "" : "py-8 lg:py-10"}>
      {!isImmersive ? (
        <header className="mx-auto mb-8 max-w-7xl animate-fade-up px-6 lg:mb-10">
          <p className="mb-3 inline-block rounded-full bg-moss-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-sage-dark">
            Free · Private · Eco-light
          </p>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-forest">{title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-sand">{description}</p>
          <div className="mt-6">
            <PrivacyBadge />
          </div>
        </header>
      ) : null}
      <div className="w-full">{children}</div>
    </article>
  );
}
