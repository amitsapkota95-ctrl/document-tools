"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { AdvancedToolsToggle } from "@/components/tools/AdvancedToolsToggle";
import { ImageUploader } from "@/components/tools/ImageUploader";
import { CURRENCIES } from "@/lib/invoice/currencies";
import { LOCALE_OPTIONS } from "@/lib/invoice/locales";
import { TAX_REGIONS, getTaxRegion } from "@/lib/invoice/regions";
import {
  getClients,
  getSavedItems,
  saveItem,
  upsertClientFromInvoice,
  type CrmClient,
  type CrmItem,
} from "@/lib/crm/local-crm";
import { INPUT_CLASS, TAB_ACTIVE, TAB_INACTIVE } from "@/lib/ui/classes";
import { useBusinessProfileStore } from "@/stores/business-profile-store";
import { useInvoiceStore, useNumberSequenceStore } from "@/stores/invoice-store";
import type { DocumentStatus, DocumentType, TemplateTheme } from "@/lib/invoice/types";

const DOCUMENT_TYPES: DocumentType[] = ["invoice", "estimate", "proforma", "credit_note"];
const STATUSES: DocumentStatus[] = ["draft", "sent", "accepted", "invoiced", "paid"];
const THEMES: TemplateTheme[] = ["classic", "minimal", "bold"];

export function InvoiceEditor() {
  const [clients, setClients] = useState<CrmClient[]>([]);
  const [savedItems, setSavedItems] = useState<CrmItem[]>([]);

  const business = useBusinessProfileStore();
  const draft = useInvoiceStore();
  const sequences = useNumberSequenceStore();
  const {
    setField,
    setDocumentType,
    setRegionId,
    addItem,
    updateItem,
    removeItem,
    reorderItem,
    addTaxComponent,
    updateTaxComponent,
    removeTaxComponent,
    regionId,
  } = draft;

  useEffect(() => {
    getClients().then(setClients);
    getSavedItems().then(setSavedItems);
  }, []);

  const region = getTaxRegion(regionId);

  const selectClient = (name: string) => {
    const client = clients.find((c) => c.name === name);
    setField("clientName", name);
    if (client?.address) setField("clientAddress", client.address);
    if (client?.email) setField("clientEmail", client.email);
  };

  const saveLineToCatalog = async (description: string, rate: number) => {
    if (!description.trim()) return;
    const item: CrmItem = { id: crypto.randomUUID(), description, rate };
    await saveItem(item);
    setSavedItems(await getSavedItems());
  };

  const applySavedItem = (item: CrmItem) => {
    addItem({ description: item.description, rate: item.rate });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {DOCUMENT_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              const next = setDocumentType(type, {
                invoice: sequences.invoice,
                estimate: sequences.estimate,
                proforma: sequences.proforma,
                credit_note: sequences.credit_note,
              });
              useNumberSequenceStore.setState(next);
            }}
            className={`px-3 py-1.5 text-xs font-semibold capitalize sm:text-sm ${
              draft.documentType === type ? TAB_ACTIVE : TAB_INACTIVE
            }`}
          >
            {type.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          Status
          <select
            value={draft.status}
            onChange={(e) => setField("status", e.target.value as DocumentStatus)}
            className={INPUT_CLASS}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Document number
          <input
            value={draft.documentNumber}
            onChange={(e) => setField("documentNumber", e.target.value)}
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <fieldset className="space-y-3 rounded-xl border border-cream-300/50 bg-cream-200/20 p-4">
        <legend className="px-1 text-sm font-bold text-forest-700">Your business</legend>
        <label className="block text-sm font-semibold">
          Business name
          <input
            value={business.businessName}
            onChange={(e) => business.setField("businessName", e.target.value)}
            className={INPUT_CLASS}
          />
        </label>
        <ImageUploader
          label="Business logo"
          hint="Drop your logo here or click to browse — shown on invoices and PDF exports"
          imageUrl={business.logoDataUrl}
          onImage={(dataUrl) => business.setField("logoDataUrl", dataUrl)}
          onRemove={() => business.setField("logoDataUrl", null)}
        />
        <label className="block text-sm font-semibold">
          Address
          <textarea
            value={business.address}
            onChange={(e) => business.setField("address", e.target.value)}
            rows={2}
            className={INPUT_CLASS}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Email
            <input
              type="email"
              value={business.email}
              onChange={(e) => business.setField("email", e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className="block text-sm font-semibold">
            Phone
            <input
              value={business.phone}
              onChange={(e) => business.setField("phone", e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
        </div>
        <label className="block text-sm font-semibold">
          Tax registration (display)
          <input
            value={business.taxRegistrations}
            onChange={(e) => business.setField("taxRegistrations", e.target.value)}
            placeholder="VAT No. GB123456789"
            className={INPUT_CLASS}
          />
        </label>
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-cream-300/50 bg-cream-200/20 p-4">
        <legend className="px-1 text-sm font-bold text-forest-700">Client</legend>
        <label className="block text-sm font-semibold">
          Client name
          <input
            list="client-list"
            value={draft.clientName}
            onChange={(e) => selectClient(e.target.value)}
            onBlur={() => upsertClientFromInvoice(draft.clientName, draft.clientAddress, draft.clientEmail)}
            className={INPUT_CLASS}
          />
          <datalist id="client-list">
            {clients.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </label>
        <label className="block text-sm font-semibold">
          Client address
          <textarea
            value={draft.clientAddress}
            onChange={(e) => setField("clientAddress", e.target.value)}
            rows={2}
            className={INPUT_CLASS}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Client email
            <input
              type="email"
              value={draft.clientEmail}
              onChange={(e) => setField("clientEmail", e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className="block text-sm font-semibold">
            Client tax ID
            <input
              value={draft.clientTaxId}
              onChange={(e) => setField("clientTaxId", e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-cream-300/50 bg-cream-200/20 p-4">
        <legend className="px-1 text-sm font-bold text-forest-700">Dates & reference</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Issue date
            <input
              type="date"
              value={draft.issueDate}
              onChange={(e) => setField("issueDate", e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          {draft.documentType === "estimate" ? (
            <label className="block text-sm font-semibold">
              Valid until
              <input
                type="date"
                value={draft.validUntil}
                onChange={(e) => setField("validUntil", e.target.value)}
                className={INPUT_CLASS}
              />
            </label>
          ) : (
            <label className="block text-sm font-semibold">
              Due date
              <input
                type="date"
                value={draft.dueDate}
                onChange={(e) => setField("dueDate", e.target.value)}
                className={INPUT_CLASS}
              />
            </label>
          )}
        </div>
        <label className="block text-sm font-semibold">
          Reference / PO
          <input
            value={draft.referenceNumber}
            onChange={(e) => setField("referenceNumber", e.target.value)}
            className={INPUT_CLASS}
          />
        </label>
        {draft.documentType === "credit_note" || draft.relatedDocumentNumber ? (
          <label className="block text-sm font-semibold">
            Related document
            <input
              value={draft.relatedDocumentNumber}
              onChange={(e) => setField("relatedDocumentNumber", e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
        ) : null}
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-cream-300/50 bg-cream-200/20 p-4">
        <legend className="px-1 text-sm font-bold text-forest-700">Line items</legend>
        {draft.items.map((item) => (
          <div key={item.id} className="flex items-end gap-2 rounded-lg border border-cream-300 bg-cream p-3">
            <label className="min-w-0 flex-1 text-xs font-semibold">
              Description
              <input
                value={item.description}
                onChange={(e) => updateItem(item.id, "description", e.target.value)}
                placeholder="Description"
                className={INPUT_CLASS}
              />
            </label>
            <label className="w-16 shrink-0 text-xs font-semibold sm:w-20">
              Qty
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                className={INPUT_CLASS}
              />
            </label>
            <label className="w-20 shrink-0 text-xs font-semibold sm:w-24">
              Rate
              <input
                type="number"
                value={item.rate}
                onChange={(e) => updateItem(item.id, "rate", Number(e.target.value))}
                className={INPUT_CLASS}
              />
            </label>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              disabled={draft.items.length === 1}
              className="mb-0.5 shrink-0 rounded p-2 text-red-700 hover:bg-red-50 disabled:opacity-30"
              aria-label="Remove line item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => addItem()} className="text-sm font-semibold underline">
          + Add line item
        </button>

        <AdvancedToolsToggle label="Line item options">
          {savedItems.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <p className="w-full text-xs font-semibold text-ink/60">Saved catalog</p>
              {savedItems.map((si) => (
                <button
                  key={si.id}
                  type="button"
                  onClick={() => applySavedItem(si)}
                  className="rounded-lg border border-cream-300 bg-cream px-2 py-1 text-xs font-semibold hover:bg-cream-200"
                >
                  + {si.description}
                </button>
              ))}
            </div>
          ) : null}

          {draft.items.map((item, idx) => (
            <div key={item.id} className="space-y-2 rounded-lg border border-cream-300 bg-cream p-3">
              <p className="text-xs font-bold text-forest-700">
                Line {idx + 1}
                {item.description ? `: ${item.description}` : ""}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={item.type}
                  onChange={(e) => updateItem(item.id, "type", e.target.value)}
                  className="rounded border border-cream-300 bg-cream px-2 py-1 text-xs font-semibold"
                >
                  <option value="standard">Standard</option>
                  <option value="time">Time (hours)</option>
                </select>
                <button
                  type="button"
                  onClick={() => reorderItem(item.id, "up")}
                  disabled={idx === 0}
                  className="rounded px-2 py-1 text-xs font-semibold hover:bg-cream-200 disabled:opacity-30"
                >
                  Move up
                </button>
                <button
                  type="button"
                  onClick={() => reorderItem(item.id, "down")}
                  disabled={idx === draft.items.length - 1}
                  className="rounded px-2 py-1 text-xs font-semibold hover:bg-cream-200 disabled:opacity-30"
                >
                  Move down
                </button>
              </div>
              {item.type === "standard" ? (
                <label className="block text-xs font-semibold">
                  Unit
                  <input
                    value={item.unit}
                    onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                    className={INPUT_CLASS}
                  />
                </label>
              ) : null}
              <label className="block text-xs font-semibold">
                Expense ref
                <input
                  value={item.expenseReference}
                  onChange={(e) => updateItem(item.id, "expenseReference", e.target.value)}
                  placeholder="Receipt #"
                  className={INPUT_CLASS}
                />
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <label className="text-xs font-semibold">
                  Line discount
                  <select
                    value={item.discountType}
                    onChange={(e) => updateItem(item.id, "discountType", e.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="none">None</option>
                    <option value="percent">%</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </label>
                {item.discountType !== "none" ? (
                  <label className="text-xs font-semibold">
                    Value
                    <input
                      type="number"
                      value={item.discountValue}
                      onChange={(e) => updateItem(item.id, "discountValue", Number(e.target.value))}
                      className={INPUT_CLASS}
                    />
                  </label>
                ) : null}
                <label className="flex items-center gap-2 self-end pb-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={item.taxExempt}
                    onChange={(e) => updateItem(item.id, "taxExempt", e.target.checked)}
                  />
                  Tax exempt
                </label>
              </div>
              <button
                type="button"
                onClick={() => saveLineToCatalog(item.description, item.rate)}
                className="text-xs font-semibold text-forest-600 underline"
              >
                Save to catalog
              </button>
            </div>
          ))}
        </AdvancedToolsToggle>
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-cream-300/50 bg-cream-200/20 p-4">
        <legend className="px-1 text-sm font-bold text-forest-700">Tax</legend>
        <label className="block text-sm font-semibold">
          Tax region preset
          <select
            value={regionId}
            onChange={(e) => setRegionId(e.target.value, business.taxRegistrations)}
            className={INPUT_CLASS}
          >
            {TAX_REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <label className="block text-sm font-semibold">
        Currency
        <select
          value={draft.currency}
          onChange={(e) => setField("currency", e.target.value)}
          className={INPUT_CLASS}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-semibold">
        Notes
        <textarea
          value={draft.notes}
          onChange={(e) => setField("notes", e.target.value)}
          rows={2}
          className={INPUT_CLASS}
        />
      </label>
      <label className="block text-sm font-semibold">
        Terms & conditions
        <textarea
          value={draft.terms}
          onChange={(e) => setField("terms", e.target.value)}
          rows={2}
          className={INPUT_CLASS}
        />
      </label>

      <AdvancedToolsToggle label="Branding & layout">
        <label className="block text-sm font-semibold">
          Accent color
          <input
            type="color"
            value={business.accentColor}
            onChange={(e) => business.setField("accentColor", e.target.value)}
            className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-cream-300"
          />
        </label>
        <div>
          <p className="mb-2 text-sm font-semibold">Template theme</p>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((theme) => (
              <button
                key={theme}
                type="button"
                onClick={() => setField("templateTheme", theme)}
                className={`px-3 py-1.5 text-xs font-semibold capitalize ${
                  draft.templateTheme === theme ? TAB_ACTIVE : TAB_INACTIVE
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>
        <label className="block text-sm font-semibold">
          Language
          <select
            value={draft.locale}
            onChange={(e) => setField("locale", e.target.value as typeof draft.locale)}
            className={INPUT_CLASS}
          >
            {LOCALE_OPTIONS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </AdvancedToolsToggle>

      <AdvancedToolsToggle label="Tax details">
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="radio"
              checked={draft.pricingMode === "exclusive"}
              onChange={() => setField("pricingMode", "exclusive")}
            />
            Tax exclusive (add tax on top)
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="radio"
              checked={draft.pricingMode === "inclusive"}
              onChange={() => setField("pricingMode", "inclusive")}
            />
            Tax inclusive (prices include tax)
          </label>
        </div>

        {draft.taxComponents.map((t) => (
          <div key={t.id} className="grid grid-cols-3 gap-2">
            <input
              value={t.label}
              onChange={(e) => updateTaxComponent(t.id, "label", e.target.value)}
              placeholder="Label"
              className={INPUT_CLASS}
            />
            <input
              type="number"
              value={t.rate}
              onChange={(e) => updateTaxComponent(t.id, "rate", Number(e.target.value))}
              placeholder="Rate %"
              className={INPUT_CLASS}
            />
            <div className="flex gap-1">
              <input
                value={t.registrationNumber}
                onChange={(e) => updateTaxComponent(t.id, "registrationNumber", e.target.value)}
                placeholder={region.registrationPlaceholder}
                className={INPUT_CLASS}
              />
              {draft.taxComponents.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeTaxComponent(t.id)}
                  className="shrink-0 rounded p-2 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        ))}
        <button type="button" onClick={addTaxComponent} className="text-sm font-semibold underline">
          + Add tax component (multi-tax)
        </button>

        {region.reverseChargeAvailable ? (
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={draft.reverseCharge}
              onChange={(e) => setField("reverseCharge", e.target.checked)}
            />
            Reverse charge (EU B2B — 0% tax, customer accounts for VAT)
          </label>
        ) : null}

        <label className="block text-sm font-semibold">
          Zero-rated note (optional)
          <input
            value={draft.zeroRatedNote}
            onChange={(e) => setField("zeroRatedNote", e.target.value)}
            placeholder="Export of services — zero-rated"
            className={INPUT_CLASS}
          />
        </label>
      </AdvancedToolsToggle>

      <AdvancedToolsToggle label="Payments & discounts">
        <label className="block text-sm font-semibold">
          Payment terms
          <input
            value={draft.paymentTerms}
            onChange={(e) => setField("paymentTerms", e.target.value)}
            placeholder="Net 30"
            className={INPUT_CLASS}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Document discount
            <select
              value={draft.documentDiscountType}
              onChange={(e) => setField("documentDiscountType", e.target.value as "none" | "percent" | "fixed")}
              className={INPUT_CLASS}
            >
              <option value="none">None</option>
              <option value="percent">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </label>
          {draft.documentDiscountType !== "none" ? (
            <label className="block text-sm font-semibold">
              Discount value
              <input
                type="number"
                value={draft.documentDiscountValue}
                onChange={(e) => setField("documentDiscountValue", Number(e.target.value))}
                className={INPUT_CLASS}
              />
            </label>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Deposit amount
            <input
              type="number"
              value={draft.depositAmount}
              onChange={(e) => setField("depositAmount", Number(e.target.value))}
              className={INPUT_CLASS}
            />
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={draft.depositPaid}
              onChange={(e) => setField("depositPaid", e.target.checked)}
            />
            Deposit paid
          </label>
        </div>
        <label className="block text-sm font-semibold">
          Amount paid (partial payments)
          <input
            type="number"
            value={draft.amountPaid}
            onChange={(e) => setField("amountPaid", Number(e.target.value))}
            className={INPUT_CLASS}
          />
        </label>
        <label className="block text-sm font-semibold">
          Payment link
          <input
            type="url"
            value={draft.paymentLink}
            onChange={(e) => setField("paymentLink", e.target.value)}
            placeholder="https://buy.stripe.com/..."
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={draft.showPaymentQr}
            onChange={(e) => setField("showPaymentQr", e.target.checked)}
          />
          Show payment QR code on document
        </label>
      </AdvancedToolsToggle>

      <AdvancedToolsToggle label="Bank details & recurring">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Account name
            <input
              value={business.bankDetails.accountName}
              onChange={(e) => business.setBankField("accountName", e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className="block text-sm font-semibold">
            Bank name
            <input
              value={business.bankDetails.bankName}
              onChange={(e) => business.setBankField("bankName", e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className="block text-sm font-semibold">
            Account number
            <input
              value={business.bankDetails.accountNumber}
              onChange={(e) => business.setBankField("accountNumber", e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className="block text-sm font-semibold">
            Sort code / routing
            <input
              value={business.bankDetails.routingNumber}
              onChange={(e) => business.setBankField("routingNumber", e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className="block text-sm font-semibold">
            IBAN
            <input
              value={business.bankDetails.iban}
              onChange={(e) => business.setBankField("iban", e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className="block text-sm font-semibold">
            SWIFT / BIC
            <input
              value={business.bankDetails.swift}
              onChange={(e) => business.setBankField("swift", e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={draft.isRecurringTemplate}
            onChange={(e) => setField("isRecurringTemplate", e.target.checked)}
          />
          Recurring invoice template
        </label>
        {draft.isRecurringTemplate ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Frequency
              <select
                value={draft.recurringFrequency}
                onChange={(e) => setField("recurringFrequency", e.target.value as typeof draft.recurringFrequency)}
                className={INPUT_CLASS}
              >
                <option value="">Select…</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Next issue date
              <input
                type="date"
                value={draft.recurringNextDate}
                onChange={(e) => setField("recurringNextDate", e.target.value)}
                className={INPUT_CLASS}
              />
            </label>
          </div>
        ) : null}

        <p className="text-xs text-ink/50">
          Clients and saved line items are stored locally in your browser. No account required.
        </p>
      </AdvancedToolsToggle>
    </div>
  );
}
