"use client";

import type { PageRenderInfo, PlacedSignature } from "@/app/fill-and-sign/types";
import { PlacedSignatureBox } from "@/app/fill-and-sign/components/PlacedSignatureBox";
import { SIGN_PAGE_MAX_WIDTH } from "@/app/fill-and-sign/sign-page-display";

interface PdfSigningWorkspaceProps {
  pages: PageRenderInfo[];
  placedSignatures: PlacedSignature[];
  activeSignatureId: string | null;
  loadingPages: boolean;
  registerPageRef: (pageIndex: number, node: HTMLDivElement | null) => void;
  onActivateSignature: (id: string) => void;
  onUpdateSignature: (id: string, patch: Partial<PlacedSignature>) => void;
  onDeleteSignature: (id: string) => void;
  onApplyAllPages: (id: string) => void;
}

export function PdfSigningWorkspace({
  pages,
  placedSignatures,
  activeSignatureId,
  loadingPages,
  registerPageRef,
  onActivateSignature,
  onUpdateSignature,
  onDeleteSignature,
  onApplyAllPages,
}: PdfSigningWorkspaceProps) {
  if (loadingPages && pages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <div className="rounded-xl border border-cream-300 bg-white px-6 py-16 text-center text-sm font-semibold text-forest-600 shadow-paper">
          Rendering PDF pages…
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return null;
  }

  return (
    <div className="relative min-h-0 flex-1">
      {loadingPages ? (
        <p className="absolute left-0 right-0 top-0 z-10 shrink-0 bg-cream-200/80 px-4 py-2 text-sm font-semibold text-forest-600">
          Loading additional pages…
        </p>
      ) : null}
      <div
        className={`absolute inset-0 overflow-y-auto overscroll-y-contain p-3 sm:p-5 ${loadingPages ? "pt-10" : ""}`}
      >
        <div
          className="mx-auto w-full rounded-2xl border border-dashed border-cream-300 bg-white/80 p-4 shadow-paper backdrop-blur-sm sm:p-6 md:p-8"
          style={{ maxWidth: SIGN_PAGE_MAX_WIDTH + 96 }}
        >
          <div className="mx-auto flex flex-col items-center gap-10 pb-6">
            {pages.map((page) => {
              const pageSignatures = placedSignatures.filter(
                (signature) => signature.pageIndex === page.pageIndex,
              );

              return (
                <div
                  key={`${page.sourceDocId}-${page.sourcePageIndex}`}
                  ref={(node) => registerPageRef(page.pageIndex, node)}
                  data-page-index={page.pageIndex}
                  className="relative shrink-0 overflow-hidden rounded-xl border border-cream-300 bg-white shadow-paper"
                  style={{
                    width: page.displayWidth,
                    height: page.displayHeight,
                    maxWidth: "100%",
                  }}
                  onMouseDown={() => onActivateSignature("")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={page.dataUrl}
                    alt={`Page ${page.pageIndex + 1}`}
                    className="h-full w-full object-contain"
                    draggable={false}
                  />

                  {pageSignatures.map((signature) => (
                    <PlacedSignatureBox
                      key={signature.id}
                      signature={signature}
                      pageWidth={page.displayWidth}
                      pageHeight={page.displayHeight}
                      isActive={activeSignatureId === signature.id}
                      onActivate={() => onActivateSignature(signature.id)}
                      onChange={(patch) => onUpdateSignature(signature.id, patch)}
                      onDelete={() => onDeleteSignature(signature.id)}
                      onApplyAll={() => onApplyAllPages(signature.id)}
                      totalPages={pages.length}
                    />
                  ))}

                  <div className="pointer-events-none absolute bottom-3 right-3 rounded border border-cream-300 bg-cream-100/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-forest-700">
                    Page {page.pageIndex + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
