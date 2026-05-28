import { Leaf } from "lucide-react";
import { FeedbackTrigger } from "@/components/feedback/FeedbackTrigger";
import { SITE_NAME } from "@/lib/seo/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-forest-800 bg-forest-700 py-12 text-cream-100/80">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 grid grid-cols-1 items-center gap-8 border-b border-white/10 pb-8 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <Leaf className="h-5 w-5" aria-hidden />
              <span className="font-serif text-lg font-bold">
                paperless
                <span className="font-normal text-white/60">.tools</span>
              </span>
            </div>
            <p className="max-w-sm text-xs font-medium leading-relaxed text-cream-100/60">
              Bespoke file editors built with zero cloud storage and complete client-side security.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 md:justify-center">
            <a
              href="#tools-directory"
              className="text-xs font-bold transition-colors hover:text-white"
            >
              All Tools
            </a>
            <a
              href="#how-it-works"
              className="text-xs font-bold transition-colors hover:text-white"
            >
              How It Works
            </a>
            <a
              href="/privacy"
              className="text-xs font-bold transition-colors hover:text-white"
            >
              Privacy
            </a>
          </div>

          <div className="md:text-right">
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-hidden />
              Local Browser Sandbox Mode
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 text-xs font-semibold text-cream-100/55 sm:flex-row">
          <p className="flex flex-wrap items-center gap-x-2">
            <span>
              © {new Date().getFullYear()} {SITE_NAME}. All document tasks run safely in your own
              browser.
            </span>
            <span aria-hidden>·</span>
            <FeedbackTrigger variant="link" className="text-xs text-cream-100/55 hover:text-white" />
          </p>
          <p>Made for everyone who values simplicity and clean privacy.</p>
        </div>
      </div>
    </footer>
  );
}
