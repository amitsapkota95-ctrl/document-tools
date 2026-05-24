import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { buildToolMetadata } from "@/lib/seo/tool-metadata";
import { InvoiceBuilderSkeleton } from "./InvoiceBuilderSkeleton";
import ToolComponent from "./ToolComponent";

export const metadata = buildToolMetadata("invoice-builder");

export default function InvoiceBuilderPage() {
  return (
    <ToolPageShell tool="invoice-builder">
      <ClientOnly fallback={<InvoiceBuilderSkeleton />}>
        <ToolComponent />
      </ClientOnly>
    </ToolPageShell>
  );
}
