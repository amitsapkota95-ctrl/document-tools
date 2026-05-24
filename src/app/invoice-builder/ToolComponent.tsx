"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Copy, FileDown, RefreshCw } from "lucide-react";
import { ToolButton } from "@/components/tools/ToolButton";
import { AdvancedToolsToggle } from "@/components/tools/AdvancedToolsToggle";
import { useToolLayout } from "@/contexts/tool-layout-context";
import { exportInvoicePdf } from "@/lib/invoice/export-pdf";
import { saveToHistory } from "@/lib/invoice/history";
import { upsertClientFromInvoice } from "@/lib/crm/local-crm";
import { downloadBlob } from "@/lib/pdf/download";
import { useBusinessProfileStore } from "@/stores/business-profile-store";
import {
  useInvoiceStore,
  useNumberSequenceStore,
} from "@/stores/invoice-store";
import type { BusinessProfile, InvoiceDraft, SavedDocument } from "@/lib/invoice/types";
import { DocumentHistoryPanel } from "./components/DocumentHistoryPanel";
import { InvoiceEditor } from "./components/InvoiceEditor";
import { InvoicePreview } from "./components/InvoicePreview";
import { InvoiceBuilderSkeleton } from "./InvoiceBuilderSkeleton";
import {
  INVOICE_BUILDER_EDIT_PANEL,
  INVOICE_BUILDER_GRID,
  INVOICE_BUILDER_PREVIEW_PANEL,
} from "./invoice-layout-classes";
import { useInvoiceStoresHydrated } from "./useInvoiceStoresHydrated";

function pickDraft(state: ReturnType<typeof useInvoiceStore.getState>): InvoiceDraft {
  const {
    setField,
    setRegionId,
    addItem,
    updateItem,
    removeItem,
    reorderItem,
    addTaxComponent,
    updateTaxComponent,
    removeTaxComponent,
    setDocumentType,
    convertToInvoice,
    createCreditNote,
    duplicateDraft,
    loadDraft,
    clearDraft,
    applyBusinessDefaults,
    regionId,
    ...draft
  } = state;
  void setField;
  void setRegionId;
  void addItem;
  void updateItem;
  void removeItem;
  void reorderItem;
  void addTaxComponent;
  void updateTaxComponent;
  void removeTaxComponent;
  void setDocumentType;
  void convertToInvoice;
  void createCreditNote;
  void duplicateDraft;
  void loadDraft;
  void clearDraft;
  void applyBusinessDefaults;
  void regionId;
  return draft;
}

function pickBusiness(state: ReturnType<typeof useBusinessProfileStore.getState>): BusinessProfile {
  const { setField, setBankField, ...profile } = state;
  void setField;
  void setBankField;
  return profile;
}

export default function InvoiceBuilderTool() {
  const hydrated = useInvoiceStoresHydrated();
  const { setImmersive } = useToolLayout();
  const [savedVisible, setSavedVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const initialized = useRef(false);

  const store = useInvoiceStore();
  const businessStore = useBusinessProfileStore();
  const sequences = useNumberSequenceStore();

  const draft = pickDraft(store);
  const business = pickBusiness(businessStore);

  useEffect(() => {
    setImmersive(true);
    return () => setImmersive(false);
  }, [setImmersive]);

  useEffect(() => {
    if (!hydrated) return;
    if (initialized.current) return;
    initialized.current = true;
    store.applyBusinessDefaults({
      currency: businessStore.defaultCurrency,
      locale: businessStore.defaultLocale,
      paymentTerms: businessStore.defaultPaymentTerms,
      regionId: businessStore.defaultRegionId,
      taxRegistrations: businessStore.taxRegistrations,
    });
  }, [hydrated, store, businessStore]);

  useEffect(() => {
    if (!hydrated) return;

    let timer: ReturnType<typeof setTimeout>;
    const flashSaved = () => {
      setSavedVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setSavedVisible(false), 2000);
    };

    flashSaved();
    const unsubDraft = useInvoiceStore.subscribe(flashSaved);
    const unsubBusiness = useBusinessProfileStore.subscribe(flashSaved);

    return () => {
      unsubDraft();
      unsubBusiness();
      clearTimeout(timer);
    };
  }, [hydrated]);

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await upsertClientFromInvoice(draft.clientName, draft.clientAddress, draft.clientEmail);
      const blob = await exportInvoicePdf(draft, business);
      downloadBlob(blob, `${draft.documentNumber}.pdf`);

      const saved: SavedDocument = {
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
        draft: structuredClone(draft),
        business: structuredClone(business),
      };
      await saveToHistory(saved);
      sequences.bump(draft.documentType);
    } finally {
      setExporting(false);
    }
  };

  const handleConvertToInvoice = () => {
    const { sequences: next } = store.convertToInvoice({
      invoice: sequences.invoice,
      estimate: sequences.estimate,
      proforma: sequences.proforma,
      credit_note: sequences.credit_note,
    });
    useNumberSequenceStore.setState(next);
  };

  const handleCreditNote = () => {
    const { sequences: next } = store.createCreditNote({
      invoice: sequences.invoice,
      estimate: sequences.estimate,
      proforma: sequences.proforma,
      credit_note: sequences.credit_note,
    });
    useNumberSequenceStore.setState(next);
  };

  const handleNewDocument = () => {
    const { sequences: next } = store.clearDraft(
      {
        invoice: sequences.invoice,
        estimate: sequences.estimate,
        proforma: sequences.proforma,
        credit_note: sequences.credit_note,
      },
      store.regionId,
    );
    useNumberSequenceStore.setState(next);
  };

  const handleLoadFromHistory = (loaded: InvoiceDraft) => {
    store.loadDraft(loaded);
  };

  if (!hydrated) {
    return <InvoiceBuilderSkeleton />;
  }

  return (
    <>
      <div className={INVOICE_BUILDER_GRID}>
        <section className={INVOICE_BUILDER_EDIT_PANEL} aria-label="Build invoice">
          <p
            aria-live="polite"
            className={`mb-4 text-xs font-semibold text-sand-light transition-opacity ${
              savedVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            Draft saved locally.
          </p>

          <div className="flex flex-col gap-2">
            <ToolButton variant="secondary" onClick={handleNewDocument} className="w-full">
              New Document
            </ToolButton>
          </div>

          <div className="mt-5 space-y-5">
            <InvoiceEditor />

            <AdvancedToolsToggle label="Document actions & history">
              {draft.documentType === "estimate" ? (
                <ToolButton variant="secondary" onClick={handleConvertToInvoice} className="w-full">
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  Convert to Invoice
                </ToolButton>
              ) : null}
              {draft.documentType === "invoice" ? (
                <ToolButton variant="secondary" onClick={handleCreditNote} className="w-full">
                  Create Credit Note
                </ToolButton>
              ) : null}
              <ToolButton variant="secondary" onClick={() => store.duplicateDraft()} className="w-full">
                <Copy className="mr-1.5 h-4 w-4" />
                Duplicate
              </ToolButton>
              <DocumentHistoryPanel onLoad={handleLoadFromHistory} />
            </AdvancedToolsToggle>
          </div>

          <div className="mt-5 rounded-xl border border-moss-dark/40 bg-moss-light/30 p-4 text-xs text-sand">
            <p className="font-bold text-forest">Suite shortcuts</p>
            <ul className="mt-2 space-y-1">
              <li>
                <Link href="/fill-and-sign" className="font-semibold underline">
                  Fill & Sign
                </Link>{" "}
                — sign your exported PDF
              </li>
              <li>
                <Link href="/qr-tools" className="font-semibold underline">
                  QR Tools
                </Link>{" "}
                — create a payment QR code
              </li>
              <li>
                <Link href="/compress-pdf" className="font-semibold underline">
                  Compress PDF
                </Link>{" "}
                — smaller email attachments
              </li>
            </ul>
          </div>
        </section>

        <section className={INVOICE_BUILDER_PREVIEW_PANEL} aria-label="Live preview">
          <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
            <p className="text-sm font-bold text-forest">Live preview</p>
            <ToolButton onClick={handleExportPdf} disabled={exporting} className="shrink-0">
              <FileDown className="mr-1.5 h-4 w-4" />
              {exporting ? "Exporting…" : "Download PDF"}
            </ToolButton>
          </div>
          <div className="min-h-0 flex-1">
            <InvoicePreview draft={draft} business={business} />
          </div>
        </section>
      </div>
    </>
  );
}
