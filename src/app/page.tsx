import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ToolsDirectory } from "@/components/landing/ToolsDirectory";
import { TrustStrip } from "@/components/landing/TrustStrip";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <TrustStrip />
      <ToolsDirectory />
      <HowItWorksSection />
    </div>
  );
}
