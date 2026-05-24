"use client";

import { QRCodeSVG } from "qrcode.react";
import { calculateInvoiceTotals } from "@/lib/invoice/calculations";
import { formatMoney } from "@/lib/invoice/currencies";
import { formatDate, getLocaleStrings } from "@/lib/invoice/locales";
import type { BusinessProfile, InvoiceDraft } from "@/lib/invoice/types";

interface InvoicePreviewProps {
  draft: InvoiceDraft;
  business: BusinessProfile;
}

export function InvoicePreview({ draft, business }: InvoicePreviewProps) {
  const strings = getLocaleStrings(draft.locale);
  const totals = calculateInvoiceTotals(draft);
  const money = (n: number) => formatMoney(n, draft.currency, draft.locale);
  const docTitle = strings.documentTypes[draft.documentType];
  const accent = business.accentColor || "#14532d";

  const themeClasses = {
    classic: "font-serif",
    minimal: "border border-cream-300",
    bold: "border-t-4",
  }[draft.templateTheme];

  const headerStyle =
    draft.templateTheme === "bold"
      ? { borderTopColor: accent, backgroundColor: `${accent}08` }
      : undefined;

  return (
    <div
      className={`${themeClasses} paper-card rounded-xl bg-cream p-6 shadow-paper sm:p-8`}
      style={headerStyle}
    >
      <div className="grid gap-6 sm:grid-cols-2 sm:items-start">
        <div className="flex min-w-0 gap-3">
          {business.logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logoDataUrl}
              alt=""
              className="h-12 w-12 shrink-0 object-contain sm:w-16"
            />
          ) : null}
          <div className="min-w-0">
            <h2 className="break-words font-serif text-xl font-bold text-forest-700 sm:text-2xl">
              {business.businessName}
            </h2>
            {business.address ? (
              <p className="mt-1 break-words whitespace-pre-line text-xs text-ink/60">{business.address}</p>
            ) : null}
            {[business.email, business.phone, business.website].filter(Boolean).map((line) => (
              <p key={line} className="break-all text-xs text-ink/50">
                {line}
              </p>
            ))}
          </div>
        </div>

        <div className="min-w-0 text-left sm:text-right">
          <p className="break-words text-2xl font-bold" style={{ color: accent }}>
            {docTitle}
          </p>
          <p className="mt-1 break-all text-sm font-semibold text-forest-700">{draft.documentNumber}</p>
          <span className="mt-2 inline-block rounded-full bg-cream-200 px-2.5 py-0.5 text-xs font-semibold text-forest-600">
            {strings.status[draft.status]}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 border-t border-cream-300 pt-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink/50">{strings.billTo}</p>
          <p className="mt-1 font-semibold text-forest-700">{draft.clientName || "—"}</p>
          {draft.clientAddress ? (
            <p className="mt-1 whitespace-pre-line text-xs text-ink/60">{draft.clientAddress}</p>
          ) : null}
          {draft.clientEmail ? <p className="text-xs text-ink/50">{draft.clientEmail}</p> : null}
          {draft.clientTaxId ? <p className="text-xs text-ink/50">{draft.clientTaxId}</p> : null}
        </div>

        <div className="space-y-1 text-sm sm:text-right">
          <p>
            <span className="font-semibold text-ink/60">{strings.issueDate}: </span>
            {formatDate(draft.issueDate, draft.locale)}
          </p>
          {draft.documentType === "estimate" ? (
            <p>
              <span className="font-semibold text-ink/60">{strings.validUntil}: </span>
              {formatDate(draft.validUntil, draft.locale)}
            </p>
          ) : (
            <p>
              <span className="font-semibold text-ink/60">{strings.dueDate}: </span>
              {formatDate(draft.dueDate, draft.locale)}
            </p>
          )}
          {draft.paymentTerms ? (
            <p>
              <span className="font-semibold text-ink/60">{strings.paymentTerms}: </span>
              {draft.paymentTerms}
            </p>
          ) : null}
          {draft.referenceNumber ? (
            <p>
              <span className="font-semibold text-ink/60">{strings.reference}: </span>
              {draft.referenceNumber}
            </p>
          ) : null}
          {draft.relatedDocumentNumber ? (
            <p>
              <span className="font-semibold text-ink/60">{strings.relatedDocument}: </span>
              {draft.relatedDocumentNumber}
            </p>
          ) : null}
        </div>
      </div>

      {draft.documentType === "estimate" ? (
        <p className="mt-4 text-xs italic text-ink/50">{strings.notTaxInvoice}</p>
      ) : null}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr
              className="text-left text-xs font-bold uppercase tracking-wide text-cream"
              style={{ backgroundColor: accent }}
            >
              <th className="px-2 py-2">{strings.description}</th>
              <th className="px-2 py-2">{strings.qty}</th>
              <th className="px-2 py-2">{strings.unit}</th>
              <th className="px-2 py-2">{strings.rate}</th>
              <th className="px-2 py-2 text-right">{strings.amount}</th>
            </tr>
          </thead>
          <tbody>
            {draft.items.map((item, idx) => {
              const calc = totals.lineCalculations[idx];
              return (
                <tr key={item.id} className="border-b border-cream-300">
                  <td className="px-2 py-2">
                    <span>{item.description}</span>
                    {item.expenseReference ? (
                      <span className="ml-1 text-xs text-ink/50">
                        ({strings.expenseRef}: {item.expenseReference})
                      </span>
                    ) : null}
                    {item.taxExempt ? (
                      <span className="ml-2 text-xs text-ink/50">({strings.taxExempt})</span>
                    ) : null}
                  </td>
                  <td className="px-2 py-2">{item.quantity}</td>
                  <td className="px-2 py-2">{item.type === "time" ? strings.hours : item.unit}</td>
                  <td className="px-2 py-2">{money(item.rate)}</td>
                  <td className="px-2 py-2 text-right font-medium">{money(calc.gross)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-8">
        <div className="min-w-[220px] space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-ink/60">{strings.subtotal}</span>
            <span>{money(totals.subtotalNet)}</span>
          </div>
          {totals.lineDiscountTotal > 0 ? (
            <div className="flex justify-between gap-4 text-ink/50">
              <span>{strings.discount} (lines)</span>
              <span>-{money(totals.lineDiscountTotal)}</span>
            </div>
          ) : null}
          {totals.documentDiscount > 0 ? (
            <div className="flex justify-between gap-4 text-ink/50">
              <span>{strings.discount}</span>
              <span>-{money(totals.documentDiscount)}</span>
            </div>
          ) : null}

          {draft.reverseCharge ? (
            <p className="text-xs italic text-ink/50">{strings.reverseCharge}</p>
          ) : (
            totals.taxBreakdown.map((t) =>
              t.rate > 0 ? (
                <div key={t.id} className="flex justify-between gap-4">
                  <span className="text-ink/60">
                    {t.label} ({t.rate}%)
                  </span>
                  <span>{money(t.amount)}</span>
                </div>
              ) : null,
            )
          )}

          {draft.zeroRatedNote ? (
            <p className="text-xs text-ink/50">
              {strings.zeroRated}: {draft.zeroRatedNote}
            </p>
          ) : null}

          <div
            className="flex justify-between gap-4 border-t border-cream-300 pt-2 text-base font-bold"
            style={{ color: accent }}
          >
            <span>{strings.grandTotal}</span>
            <span>{money(totals.total)}</span>
          </div>

          {draft.depositAmount > 0 ? (
            <div className="flex justify-between gap-4">
              <span className="text-ink/60">
                {draft.depositPaid ? strings.deposit : strings.depositDue}
              </span>
              <span>{money(draft.depositAmount)}</span>
            </div>
          ) : null}
          {draft.amountPaid > 0 ? (
            <div className="flex justify-between gap-4">
              <span className="text-ink/60">{strings.amountPaid}</span>
              <span>{money(draft.amountPaid)}</span>
            </div>
          ) : null}
          {totals.balanceDue !== totals.total ? (
            <div className="flex justify-between gap-4 font-bold">
              <span>{strings.balanceDue}</span>
              <span>{money(Math.abs(totals.balanceDue))}</span>
            </div>
          ) : null}
        </div>
      </div>

      {(business.taxRegistrations || draft.taxComponents.some((t) => t.registrationNumber)) && (
        <div className="mt-4 space-y-0.5 text-xs text-ink/50">
          {business.taxRegistrations ? <p>{business.taxRegistrations}</p> : null}
          {draft.taxComponents.map(
            (t) =>
              t.registrationNumber ? (
                <p key={t.id}>
                  {t.label}: {t.registrationNumber}
                </p>
              ) : null,
          )}
        </div>
      )}

      {(business.bankDetails.accountName || business.bankDetails.iban) && (
        <div className="mt-4 rounded-lg bg-cream-200/60 p-3 text-xs">
          <p className="font-bold text-forest-700">{strings.bankDetails}</p>
          {business.bankDetails.accountName ? (
            <p>
              {strings.accountName}: {business.bankDetails.accountName}
            </p>
          ) : null}
          {business.bankDetails.bankName ? <p>Bank: {business.bankDetails.bankName}</p> : null}
          {business.bankDetails.accountNumber ? (
            <p>
              {strings.accountNumber}: {business.bankDetails.accountNumber}
            </p>
          ) : null}
          {business.bankDetails.routingNumber ? (
            <p>
              {strings.routingNumber}: {business.bankDetails.routingNumber}
            </p>
          ) : null}
          {business.bankDetails.iban ? (
            <p>
              {strings.iban}: {business.bankDetails.iban}
            </p>
          ) : null}
          {business.bankDetails.swift ? (
            <p>
              {strings.swift}: {business.bankDetails.swift}
            </p>
          ) : null}
        </div>
      )}

      {draft.paymentLink ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <a
            href={draft.paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg px-6 py-2.5 text-sm font-bold text-cream transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            {strings.payNow} →
          </a>
          {draft.showPaymentQr ? (
            <div className="rounded-lg border border-cream-300 bg-white p-2">
              <QRCodeSVG value={draft.paymentLink} size={88} />
            </div>
          ) : null}
        </div>
      ) : null}

      {draft.isRecurringTemplate && draft.recurringFrequency ? (
        <p className="mt-4 text-center text-xs text-ink/50">
          {strings.recurring}: {draft.recurringFrequency}
          {draft.recurringNextDate
            ? ` — ${strings.nextIssue}: ${formatDate(draft.recurringNextDate, draft.locale)}`
            : ""}
        </p>
      ) : null}

      {draft.notes ? (
        <div className="mt-4 border-t border-cream-300 pt-4">
          <p className="text-xs font-bold text-ink/60">{strings.notes}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-ink/60">{draft.notes}</p>
        </div>
      ) : null}

      {draft.terms ? (
        <div className="mt-4 border-t border-cream-300 pt-4">
          <p className="text-xs font-bold text-ink/60">{strings.terms}</p>
          <p className="mt-1 whitespace-pre-line text-xs text-ink/50">{draft.terms}</p>
        </div>
      ) : null}
    </div>
  );
}
