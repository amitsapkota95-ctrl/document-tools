import { CloudOff, Coins, Lock, UserX } from "lucide-react";
import { HeroDropzone } from "@/components/landing/HeroDropzone";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-cream-300 px-6 py-12 md:py-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-forest-500/5 to-transparent" />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="space-y-6 text-left lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-forest-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-forest-700">
            <Lock className="h-3 w-3 text-forest-500" aria-hidden />
            100% Private in your web browser
          </div>

          <h1 className="font-serif text-4xl font-bold leading-[1.1] tracking-tight text-forest-700 sm:text-5xl md:text-6xl">
            Your files.
            <br />
            <span className="font-medium italic text-forest-500">Your rules.</span>
          </h1>

          <p className="max-w-xl text-sm font-semibold leading-relaxed text-ink/70 sm:text-base">
            Free, helpful tools for simple, everyday document tasks. Merge sheets, sign contracts,
            make files smaller, and more—completely on your computer. Your files never touch a
            server, making it perfectly safe.
          </p>

          <div className="grid max-w-lg grid-cols-3 gap-4 border-t border-cream-300 pt-4">
            {[
              { icon: CloudOff, label: "No Uploads" },
              { icon: UserX, label: "No Accounts" },
              { icon: Coins, label: "100% Free" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-forest-200 bg-forest-50 text-forest-500">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </div>
                <span className="text-[11px] font-bold text-forest-700">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <HeroDropzone />
        </div>
      </div>
    </section>
  );
}
