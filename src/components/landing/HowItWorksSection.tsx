import { CloudOff, Leaf, WifiOff } from "lucide-react";

const VALUE_PROPS = [
  {
    icon: CloudOff,
    title: "Your files never upload",
    description:
      "Other tools upload your personal files to external servers. Here, our code executes safely inside your browser window. Your privacy is 100% secure.",
  },
  {
    icon: WifiOff,
    title: "Works completely offline",
    description:
      "Once the web page loads, you can safely turn off your internet or disconnect. The tool works perfectly fine without an active network connection.",
  },
  {
    icon: Leaf,
    title: "Environmentally friendly",
    description:
      "By using your device's raw power instead of giant cloud servers, we reduce our carbon footprint to zero. Fast and eco-friendly.",
  },
] as const;

interface HowItWorksSectionProps {
  id?: string;
}

export function HowItWorksSection({ id = "how-it-works" }: HowItWorksSectionProps) {
  return (
    <section id={id} className="border-t border-cream-300 bg-cream-200 px-6 py-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="mx-auto max-w-xl space-y-3 text-center">
          <h2 className="font-serif text-3xl font-bold text-forest-700">Completely secure. Here is how.</h2>
          <p className="text-xs font-semibold leading-relaxed text-ink/60">
            Unlike other online converters, paperless.tools runs entirely in your local web browser
            window.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {VALUE_PROPS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="space-y-4 rounded-xl border border-cream-300 bg-white p-6 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-forest-200 bg-forest-50 text-forest-500">
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <h3 className="font-serif text-lg font-bold text-forest-700">{title}</h3>
              <p className="text-xs font-semibold leading-relaxed text-ink/70">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
