import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { buildToolMetadata } from "@/lib/seo/tool-metadata";
import ToolComponent from "./ToolComponent";

export const metadata = buildToolMetadata("compare-text");

export default function CompareTextPage() {
  return (
    <ToolPageShell tool="compare-text">
      <ToolComponent />
    </ToolPageShell>
  );
}
