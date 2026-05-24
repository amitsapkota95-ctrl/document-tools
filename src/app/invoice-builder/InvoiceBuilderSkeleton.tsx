import {
  INVOICE_BUILDER_EDIT_PANEL,
  INVOICE_BUILDER_GRID,
  INVOICE_BUILDER_PREVIEW_PANEL,
} from "./invoice-layout-classes";

export function InvoiceBuilderSkeleton() {
  return (
    <div className={`${INVOICE_BUILDER_GRID} animate-pulse`} aria-hidden>
      <div className={`${INVOICE_BUILDER_EDIT_PANEL} space-y-4`}>
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((index) => (
            <div key={index} className="h-9 w-full rounded-lg bg-cream-200" />
          ))}
        </div>
        <div className="h-40 rounded-xl bg-cream-200" />
        <div className="h-32 rounded-xl bg-cream-200" />
        <div className="h-48 rounded-xl bg-cream-200" />
      </div>
      <div className={`${INVOICE_BUILDER_PREVIEW_PANEL} space-y-4`}>
        <div className="h-6 w-32 rounded bg-cream-200" />
        <div className="h-[520px] rounded-xl bg-cream-200" />
      </div>
    </div>
  );
}
