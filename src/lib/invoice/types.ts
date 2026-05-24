export type DocumentType = "invoice" | "estimate" | "proforma" | "credit_note";
export type DocumentStatus = "draft" | "sent" | "accepted" | "invoiced" | "paid";
export type LineItemType = "standard" | "time";
export type PricingMode = "exclusive" | "inclusive";
export type TemplateTheme = "classic" | "minimal" | "bold";
export type DiscountType = "none" | "percent" | "fixed";
export type RecurringFrequency = "" | "weekly" | "monthly" | "quarterly" | "yearly";

export type InvoiceLocale =
  | "en"
  | "de"
  | "fr"
  | "es"
  | "nl"
  | "pt"
  | "it"
  | "ja";

export interface TaxComponent {
  id: string;
  label: string;
  rate: number;
  registrationNumber: string;
}

export interface LineItem {
  id: string;
  type: LineItemType;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  discountType: DiscountType;
  discountValue: number;
  taxExempt: boolean;
  expenseReference: string;
}

export interface BankDetails {
  accountName: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  iban: string;
  swift: string;
}

export interface BusinessProfile {
  businessName: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  taxRegistrations: string;
  logoDataUrl: string | null;
  accentColor: string;
  defaultCurrency: string;
  defaultLocale: InvoiceLocale;
  defaultRegionId: string;
  defaultPaymentTerms: string;
  bankDetails: BankDetails;
}

export interface InvoiceDraft {
  documentType: DocumentType;
  status: DocumentStatus;
  documentNumber: string;
  referenceNumber: string;
  relatedDocumentNumber: string;

  clientName: string;
  clientAddress: string;
  clientEmail: string;
  clientTaxId: string;

  issueDate: string;
  dueDate: string;
  validUntil: string;

  items: LineItem[];
  notes: string;
  terms: string;

  taxComponents: TaxComponent[];
  pricingMode: PricingMode;
  reverseCharge: boolean;
  zeroRatedNote: string;

  documentDiscountType: DiscountType;
  documentDiscountValue: number;
  depositAmount: number;
  depositPaid: boolean;
  amountPaid: number;

  paymentLink: string;
  showPaymentQr: boolean;
  paymentTerms: string;

  isRecurringTemplate: boolean;
  recurringFrequency: RecurringFrequency;
  recurringNextDate: string;

  templateTheme: TemplateTheme;
  locale: InvoiceLocale;
  currency: string;
}

export interface TaxBreakdownLine {
  id: string;
  label: string;
  rate: number;
  amount: number;
}

export interface LineCalculation {
  id: string;
  net: number;
  tax: number;
  gross: number;
  discount: number;
}

export interface InvoiceTotals {
  lineCalculations: LineCalculation[];
  subtotalNet: number;
  lineDiscountTotal: number;
  documentDiscount: number;
  taxableNet: number;
  taxBreakdown: TaxBreakdownLine[];
  taxTotal: number;
  subtotalGross: number;
  total: number;
  depositAmount: number;
  amountPaid: number;
  balanceDue: number;
  isCredit: boolean;
}

export interface SavedDocument {
  id: string;
  savedAt: string;
  draft: InvoiceDraft;
  business: BusinessProfile;
}

export interface NumberSequences {
  invoice: number;
  estimate: number;
  proforma: number;
  credit_note: number;
}
