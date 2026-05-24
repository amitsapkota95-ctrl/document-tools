import { ShieldCheck } from "lucide-react";
import { BADGE_CLASS } from "@/lib/ui/classes";

export function PrivacyBadge() {
  return (
    <div className={BADGE_CLASS}>
      <ShieldCheck className="h-4 w-4 shrink-0 text-forest-500" aria-hidden />
      <span>100% private — processed in your browser, never uploaded</span>
    </div>
  );
}
