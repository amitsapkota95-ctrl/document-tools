import Link from "next/link";
import { Leaf } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-cream-300 bg-cream/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-700 shadow-md shadow-forest-700/10">
            <Leaf className="h-5 w-5 text-cream-100" strokeWidth={2.5} aria-hidden />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-bold tracking-tight text-forest-700">
                paperless
                <span className="font-normal text-forest-500">.tools</span>
              </span>
              <span className="hidden rounded border border-forest-200 bg-forest-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-forest-700 sm:inline">
                Free &amp; Private
              </span>
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          <a
            href="#tools-directory"
            className="text-xs font-bold text-ink/75 transition-colors hover:text-forest-700"
          >
            Our Tools
          </a>
          <a
            href="#how-it-works"
            className="text-xs font-bold text-ink/75 transition-colors hover:text-forest-700"
          >
            How We Protect You
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 lg:inline-flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden />
            Works offline
          </span>
          <a
            href="#tools-directory"
            className="rounded-xl bg-forest-700 px-4 py-2 text-xs font-bold text-white shadow-paper transition-all hover:bg-forest-600"
          >
            Browse Tools
          </a>
        </div>
      </div>
    </header>
  );
}
