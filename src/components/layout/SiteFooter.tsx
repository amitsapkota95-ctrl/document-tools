import { Leaf } from "lucide-react";
import { FeedbackTrigger } from "@/components/feedback/FeedbackTrigger";
import { SITE_NAME } from "@/lib/seo/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-moss-dark/60 bg-paper/80">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage/20">
            <Leaf className="h-5 w-5 text-sage-dark" aria-hidden />
          </span>
          <p className="font-serif text-lg font-bold text-forest">{SITE_NAME}</p>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-sand">
          Every tool runs in your browser — no uploads, no accounts, no waste.
          Your documents stay on your device, and our footprint stays light.
        </p>
        <p className="mt-5 flex flex-wrap items-center gap-x-2 text-xs text-sand-light">
          <span>
            © {new Date().getFullYear()} {SITE_NAME}. All processing is client-side.
          </span>
          <span aria-hidden>·</span>
          <FeedbackTrigger variant="link" className="text-xs" />
        </p>
      </div>
    </footer>
  );
}
