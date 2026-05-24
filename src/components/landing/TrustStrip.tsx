import { Leaf } from "lucide-react";

export function TrustStrip() {
  return (
    <div className="border-b border-cream-300 bg-cream-200 px-6 py-5 text-center">
      <p className="text-xs font-bold tracking-wide text-ink/60">
        <Leaf className="mr-2 inline h-3.5 w-3.5 text-forest-500" aria-hidden />
        Every task runs locally in your browser — your files never leave your device.
      </p>
    </div>
  );
}
