import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createDefaultLineItem } from "@/lib/invoice/calculations";
import { getTaxRegion, regionToTaxComponents } from "@/lib/invoice/regions";
import {
  defaultDueDate,
  defaultValidUntil,
  formatDocumentNumber,
  nextDocumentNumber,
  todayIso,
} from "@/lib/invoice/numbering";
import type {
  DocumentType,
  InvoiceDraft,
  LineItem,
  NumberSequences,
  TaxComponent,
} from "@/lib/invoice/types";

interface InvoiceState extends InvoiceDraft {
  regionId: string;
  setField: <K extends keyof InvoiceDraft>(key: K, value: InvoiceDraft[K]) => void;
  setRegionId: (regionId: string, registrationNumber?: string) => void;
  addItem: (partial?: Partial<LineItem>) => void;
  updateItem: (id: string, field: keyof LineItem, value: string | number | boolean) => void;
  removeItem: (id: string) => void;
  reorderItem: (id: string, direction: "up" | "down") => void;
  addTaxComponent: () => void;
  updateTaxComponent: (id: string, field: keyof TaxComponent, value: string | number) => void;
  removeTaxComponent: (id: string) => void;
  setDocumentType: (type: DocumentType, sequences: NumberSequences) => NumberSequences;
  convertToInvoice: (sequences: NumberSequences) => { sequences: NumberSequences };
  createCreditNote: (sequences: NumberSequences) => { sequences: NumberSequences };
  duplicateDraft: () => void;
  loadDraft: (draft: InvoiceDraft, regionId?: string) => void;
  clearDraft: (sequences: NumberSequences, regionId: string) => {
    sequences: NumberSequences;
    draft: InvoiceDraft;
  };
  applyBusinessDefaults: (opts: {
    currency: string;
    locale: InvoiceDraft["locale"];
    paymentTerms: string;
    regionId: string;
    taxRegistrations: string;
  }) => void;
}

export const defaultDraft: InvoiceDraft = {
  documentType: "invoice",
  status: "draft",
  documentNumber: "INV-001",
  referenceNumber: "",
  relatedDocumentNumber: "",

  clientName: "",
  clientAddress: "",
  clientEmail: "",
  clientTaxId: "",

  issueDate: todayIso(),
  dueDate: defaultDueDate(),
  validUntil: defaultValidUntil(),

  items: [createDefaultLineItem({ id: "default-line-1" })],
  notes: "",
  terms: "",

  taxComponents: [],
  pricingMode: "exclusive",
  reverseCharge: false,
  zeroRatedNote: "",

  documentDiscountType: "none",
  documentDiscountValue: 0,
  depositAmount: 0,
  depositPaid: false,
  amountPaid: 0,

  paymentLink: "",
  showPaymentQr: true,
  paymentTerms: "Net 30",

  isRecurringTemplate: false,
  recurringFrequency: "",
  recurringNextDate: "",

  templateTheme: "classic",
  locale: "en",
  currency: "USD",
};

interface PersistedV1 {
  businessName?: string;
  clientName?: string;
  clientAddress?: string;
  invoiceNumber?: string;
  notes?: string;
  taxRate?: number;
  paymentLink?: string;
  items?: { id: string; description: string; quantity: number; rate: number }[];
  logoDataUrl?: string | null;
}

function migrateV1(old: PersistedV1): Partial<InvoiceState> {
  return {
    clientName: old.clientName ?? "",
    clientAddress: old.clientAddress ?? "",
    documentNumber: old.invoiceNumber ?? "INV-001",
    notes: old.notes ?? "",
    paymentLink: old.paymentLink ?? "",
    taxComponents:
      old.taxRate && old.taxRate > 0
        ? [{ id: crypto.randomUUID(), label: "Tax", rate: old.taxRate, registrationNumber: "" }]
        : [],
    items: (old.items ?? [{ id: "1", description: "Service", quantity: 1, rate: 100 }]).map((i) =>
      createDefaultLineItem({
        id: i.id,
        description: i.description,
        quantity: i.quantity,
        rate: i.rate,
      }),
    ),
    regionId: old.taxRate && old.taxRate > 0 ? "custom" : "none",
  };
}

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => ({
      ...defaultDraft,
      regionId: "none",

      setField: (key, value) => set({ [key]: value }),

      setRegionId: (regionId, registrationNumber) => {
        const preset = getTaxRegion(regionId);
        const components = preset.taxComponents.map((t) => ({
          ...t,
          id: crypto.randomUUID(),
          registrationNumber: registrationNumber || t.registrationNumber,
        }));
        set({
          regionId,
          taxComponents: components,
          reverseCharge: false,
          pricingMode: preset.pricingModeDefault,
        });
      },

      addItem: (partial) =>
        set((state) => ({
          items: [...state.items, createDefaultLineItem(partial)],
        })),

      updateItem: (id, field, value) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, [field]: value } : item,
          ),
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.length > 1 ? state.items.filter((i) => i.id !== id) : state.items,
        })),

      reorderItem: (id, direction) =>
        set((state) => {
          const idx = state.items.findIndex((i) => i.id === id);
          if (idx < 0) return state;
          const next = direction === "up" ? idx - 1 : idx + 1;
          if (next < 0 || next >= state.items.length) return state;
          const items = [...state.items];
          [items[idx], items[next]] = [items[next], items[idx]];
          return { items };
        }),

      addTaxComponent: () =>
        set((state) => ({
          taxComponents: [
            ...state.taxComponents,
            { id: crypto.randomUUID(), label: "Tax", rate: 0, registrationNumber: "" },
          ],
          regionId: "custom",
        })),

      updateTaxComponent: (id, field, value) =>
        set((state) => ({
          taxComponents: state.taxComponents.map((t) =>
            t.id === id ? { ...t, [field]: value } : t,
          ),
          regionId: "custom",
        })),

      removeTaxComponent: (id) =>
        set((state) => ({
          taxComponents: state.taxComponents.filter((t) => t.id !== id),
        })),

      setDocumentType: (type, sequences) => {
        const { number, nextSequences } = nextDocumentNumber(type, sequences);
        set({
          documentType: type,
          documentNumber: number,
          issueDate: todayIso(),
          dueDate: defaultDueDate(),
          validUntil: defaultValidUntil(),
        });
        return nextSequences;
      },

      convertToInvoice: (sequences) => {
        const state = get();
        const { number, nextSequences } = nextDocumentNumber("invoice", sequences);
        set({
          documentType: "invoice",
          status: "invoiced",
          documentNumber: number,
          relatedDocumentNumber: state.documentNumber,
          dueDate: defaultDueDate(),
          issueDate: todayIso(),
        });
        return { sequences: nextSequences };
      },

      createCreditNote: (sequences) => {
        const state = get();
        const { number, nextSequences } = nextDocumentNumber("credit_note", sequences);
        set({
          documentType: "credit_note",
          status: "draft",
          documentNumber: number,
          relatedDocumentNumber: state.documentNumber,
          issueDate: todayIso(),
        });
        return { sequences: nextSequences };
      },

      duplicateDraft: () => {
        const state = get();
        set({
          ...state,
          documentNumber: `${state.documentNumber}-copy`,
          status: "draft",
          issueDate: todayIso(),
          dueDate: defaultDueDate(),
          validUntil: defaultValidUntil(),
          amountPaid: 0,
          depositPaid: false,
        });
      },

      loadDraft: (draft, regionId) => set({ ...draft, regionId: regionId ?? get().regionId }),

      clearDraft: (sequences, regionId) => {
        const type = get().documentType;
        const { number, nextSequences } = nextDocumentNumber(type, sequences);
        const components = regionToTaxComponents(regionId);
        const draft: InvoiceDraft = {
          ...defaultDraft,
          documentType: type,
          documentNumber: number,
          taxComponents: components,
          issueDate: todayIso(),
          dueDate: defaultDueDate(),
          validUntil: defaultValidUntil(),
          currency: get().currency,
          locale: get().locale,
          paymentTerms: get().paymentTerms,
          templateTheme: get().templateTheme,
        };
        set({ ...draft, regionId });
        return { sequences: nextSequences, draft };
      },

      applyBusinessDefaults: (opts) => {
        const preset = getTaxRegion(opts.regionId);
        const components = regionToTaxComponents(opts.regionId, opts.taxRegistrations);
        set({
          currency: opts.currency,
          locale: opts.locale,
          paymentTerms: opts.paymentTerms,
          regionId: opts.regionId,
          taxComponents: components,
          pricingMode: preset.pricingModeDefault,
        });
      },
    }),
    {
      name: "paperless-invoice-draft",
      version: 2,
      skipHydration: true,
      migrate: (persisted, version) => {
        if (version === 0 || version === 1) {
          const old = persisted as PersistedV1 & Partial<InvoiceState>;
          return { ...defaultDraft, ...old, ...migrateV1(old), regionId: old.regionId ?? "none" };
        }
        return persisted as InvoiceState;
      },
    },
  ),
);

export const useNumberSequenceStore = create<NumberSequences & { bump: (type: DocumentType) => void; setSeq: (type: DocumentType, n: number) => void }>()(
  persist(
    (set) => ({
      invoice: 1,
      estimate: 1,
      proforma: 1,
      credit_note: 1,
      bump: (type) => set((s) => ({ [type]: s[type] + 1 })),
      setSeq: (type, n) => set({ [type]: n }),
    }),
    { name: "paperless-invoice-sequences", skipHydration: true },
  ),
);

export function peekNextNumber(type: DocumentType, sequences: NumberSequences): string {
  return formatDocumentNumber(type, sequences[type]);
}
