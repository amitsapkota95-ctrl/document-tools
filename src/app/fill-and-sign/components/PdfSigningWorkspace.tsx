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
        <div className="rounded-xl border border-moss/70 bg-moss-light/50 px-6 py-16 text-center text-sm text-forest-muted shadow-eco">
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
        <p className="absolute left-0 right-0 top-0 z-10 shrink-0 bg-moss-light/20 px-4 py-2 text-sm text-forest-muted">
          Loading additional pages…
        </p>
      ) : null}
      <div
        className={`absolute inset-0 overflow-y-auto overscroll-y-contain p-3 sm:p-5 ${loadingPages ? "pt-10" : ""}`}
      >
        <div
          className="mx-auto w-full rounded-2xl border border-dashed border-moss/50 bg-cream/90 p-4 shadow-eco backdrop-blur-sm sm:p-6 md:p-8"
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
                  className="relative shrink-0 overflow-hidden rounded-lg border border-moss/70 bg-cream shadow-eco"
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
                    className="block h-full w-full select-none object-contain"
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

                  <div className="absolute bottom-2 right-2 rounded-md border border-moss/70 bg-cream/95 px-2 py-0.5 text-[11px] font-semibold text-forest-muted shadow-eco">
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
