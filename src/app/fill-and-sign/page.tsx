import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { buildToolMetadata } from "@/lib/seo/tool-metadata";
import ToolComponent from "./ToolComponent";

export const metadata = buildToolMetadata("fill-and-sign");

export default function FillAndSignPage() {
  return (
    <ToolPageShell tool="fill-and-sign">
      <ToolComponent />
    </ToolPageShell>
  );
}
