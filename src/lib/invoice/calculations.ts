import type { DiscountType, InvoiceDraft, InvoiceTotals, LineItem, PricingMode, TaxComponent } from "./types";
import { combinedTaxRate } from "./regions";

function applyDiscount(amount: number, type: DiscountType, value: number): number {
  if (type === "percent") return amount * (value / 100);
  if (type === "fixed") return Math.min(amount, value);
  return 0;
}

function lineGrossBeforeDiscount(item: LineItem): number {
  return item.quantity * item.rate;
}

function extractNetFromGross(gross: number, totalTaxRate: number): number {
  if (totalTaxRate <= 0) return gross;
  return gross / (1 + totalTaxRate / 100);
}

function computeLineAmounts(
  item: LineItem,
  pricingMode: PricingMode,
  totalTaxRate: number,
  reverseCharge: boolean,
): { net: number; discount: number; tax: number; gross: number } {
  const grossBeforeDiscount = lineGrossBeforeDiscount(item);
  const discount = applyDiscount(grossBeforeDiscount, item.discountType, item.discountValue);
  const afterDiscount = Math.max(0, grossBeforeDiscount - discount);

  const effectiveRate = item.taxExempt || reverseCharge ? 0 : totalTaxRate;

  if (pricingMode === "exclusive") {
    const net = afterDiscount;
    const tax = effectiveRate > 0 ? net * (effectiveRate / 100) : 0;
    return { net, discount, tax, gross: net + tax };
  }

  const net = extractNetFromGross(afterDiscount, effectiveRate);
  const tax = afterDiscount - net;
  return { net, discount, tax, gross: afterDiscount };
}

export function calculateInvoiceTotals(draft: InvoiceDraft): InvoiceTotals {
  const totalTaxRate = combinedTaxRate(draft.taxComponents);
  const isCredit = draft.documentType === "credit_note";

  const lineCalculations = draft.items.map((item) => {
    const { net, discount, tax, gross } = computeLineAmounts(
      item,
      draft.pricingMode,
      totalTaxRate,
      draft.reverseCharge,
    );
    return { id: item.id, net, tax, gross, discount };
  });

  const subtotalNet = lineCalculations.reduce((s, l) => s + l.net, 0);
  const lineDiscountTotal = lineCalculations.reduce((s, l) => s + l.discount, 0);

  const documentDiscount = applyDiscount(
    subtotalNet,
    draft.documentDiscountType,
    draft.documentDiscountValue,
  );
  const taxableNet = Math.max(0, subtotalNet - documentDiscount);

  const taxableRatio = subtotalNet > 0 ? taxableNet / subtotalNet : 1;

  const taxBreakdown = draft.reverseCharge
    ? draft.taxComponents.map((c) => ({ id: c.id, label: c.label, rate: c.rate, amount: 0 }))
    : draft.taxComponents.map((c) => {
        let taxableAmount = 0;
        draft.items.forEach((item, idx) => {
          if (item.taxExempt) return;
          taxableAmount += lineCalculations[idx].net * taxableRatio;
        });
        return {
          id: c.id,
          label: c.label,
          rate: c.rate,
          amount: taxableAmount * (c.rate / 100),
        };
      });

  const taxTotal = taxBreakdown.reduce((s, t) => s + t.amount, 0);
  const subtotalGross = draft.pricingMode === "inclusive" ? subtotalNet + taxTotal : subtotalNet;
  let total =
    draft.pricingMode === "inclusive"
      ? subtotalGross - documentDiscount
      : taxableNet + taxTotal;

  if (isCredit) total = Math.abs(total);

  const depositAmount = draft.depositAmount || 0;
  const amountPaid = draft.amountPaid || 0;
  const depositDue = draft.depositPaid ? 0 : depositAmount;
  const balanceDue = Math.max(0, total - amountPaid - (draft.depositPaid ? depositAmount : 0));

  return {
    lineCalculations,
    subtotalNet,
    lineDiscountTotal,
    documentDiscount,
    taxableNet,
    taxBreakdown,
    taxTotal,
    subtotalGross,
    total,
    depositAmount: depositDue > 0 ? depositAmount : depositAmount,
    amountPaid,
    balanceDue: isCredit ? -balanceDue : balanceDue,
    isCredit,
  };
}

export function createDefaultLineItem(partial?: Partial<LineItem>): LineItem {
  return {
    id: crypto.randomUUID(),
    type: "standard",
    description: "Service",
    quantity: 1,
    unit: "each",
    rate: 100,
    discountType: "none",
    discountValue: 0,
    taxExempt: false,
    expenseReference: "",
    ...partial,
  };
}

export function createDefaultTaxComponent(partial?: Partial<TaxComponent>): TaxComponent {
  return {
    id: crypto.randomUUID(),
    label: "Tax",
    rate: 0,
    registrationNumber: "",
    ...partial,
  };
}
