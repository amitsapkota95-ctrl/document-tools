import Link from "next/link";
import { Leaf } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-moss-dark/80 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-serif text-xl font-bold text-forest"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage/20">
            <Leaf className="h-5 w-5 text-sage-dark" strokeWidth={2.5} aria-hidden />
          </span>
          paperless.tools
        </Link>
        <nav className="text-sm" aria-label="Main">
          <Link
            href="/"
            className="rounded-lg bg-moss-light/80 px-4 py-2 font-medium text-forest transition-colors hover:bg-sage/20 hover:text-forest-muted"
          >
            All Tools
          </Link>
        </nav>
      </div>
    </header>
  );
}
