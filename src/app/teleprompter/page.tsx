import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { buildToolMetadata } from "@/lib/seo/tool-metadata";
import { TeleprompterFontProvider } from "./TeleprompterFontProvider";
import ToolComponent from "./ToolComponent";

export const metadata = buildToolMetadata("teleprompter");

export default function TeleprompterPage() {
  return (
    <ToolPageShell tool="teleprompter">
      <TeleprompterFontProvider>
        <ToolComponent />
      </TeleprompterFontProvider>
    </ToolPageShell>
  );
}
