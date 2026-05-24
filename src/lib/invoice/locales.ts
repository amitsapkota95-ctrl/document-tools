import type { DocumentType, InvoiceLocale } from "./types";

export interface LocaleStrings {
  documentTypes: Record<DocumentType, string>;
  billTo: string;
  from: string;
  description: string;
  qty: string;
  unit: string;
  rate: string;
  amount: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  grandTotal: string;
  balanceDue: string;
  amountPaid: string;
  deposit: string;
  depositDue: string;
  issueDate: string;
  dueDate: string;
  validUntil: string;
  paymentTerms: string;
  reference: string;
  relatedDocument: string;
  notes: string;
  terms: string;
  payNow: string;
  bankDetails: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string;
  iban: string;
  swift: string;
  reverseCharge: string;
  zeroRated: string;
  taxExempt: string;
  recurring: string;
  nextIssue: string;
  expenseRef: string;
  creditNote: string;
  notTaxInvoice: string;
  hours: string;
  status: Record<string, string>;
}

const en: LocaleStrings = {
  documentTypes: {
    invoice: "Invoice",
    estimate: "Estimate",
    proforma: "Proforma Invoice",
    credit_note: "Credit Note",
  },
  billTo: "Bill to",
  from: "From",
  description: "Description",
  qty: "Qty",
  unit: "Unit",
  rate: "Rate",
  amount: "Amount",
  subtotal: "Subtotal",
  discount: "Discount",
  tax: "Tax",
  total: "Total",
  grandTotal: "Grand Total",
  balanceDue: "Balance Due",
  amountPaid: "Amount Paid",
  deposit: "Deposit",
  depositDue: "Deposit Due",
  issueDate: "Issue Date",
  dueDate: "Due Date",
  validUntil: "Valid Until",
  paymentTerms: "Payment Terms",
  reference: "Reference / PO",
  relatedDocument: "Related Document",
  notes: "Notes",
  terms: "Terms & Conditions",
  payNow: "Pay Now",
  bankDetails: "Bank Details",
  accountName: "Account Name",
  accountNumber: "Account Number",
  routingNumber: "Sort Code / Routing",
  iban: "IBAN",
  swift: "SWIFT / BIC",
  reverseCharge: "Reverse charge — customer to account for VAT",
  zeroRated: "Zero-rated supply",
  taxExempt: "Tax exempt",
  recurring: "Recurring",
  nextIssue: "Next Issue",
  expenseRef: "Ref",
  creditNote: "Credit applied",
  notTaxInvoice: "This is not a tax invoice",
  hours: "Hours",
  status: {
    draft: "Draft",
    sent: "Sent",
    accepted: "Accepted",
    invoiced: "Invoiced",
    paid: "Paid",
  },
};

const de: LocaleStrings = {
  ...en,
  documentTypes: {
    invoice: "Rechnung",
    estimate: "Angebot",
    proforma: "Proforma-Rechnung",
    credit_note: "Gutschrift",
  },
  billTo: "Rechnungsempfänger",
  from: "Von",
  description: "Beschreibung",
  qty: "Menge",
  unit: "Einheit",
  rate: "Preis",
  amount: "Betrag",
  subtotal: "Zwischensumme",
  discount: "Rabatt",
  tax: "Steuer",
  total: "Summe",
  grandTotal: "Gesamtbetrag",
  balanceDue: "Offener Betrag",
  amountPaid: "Bezahlt",
  deposit: "Anzahlung",
  depositDue: "Anzahlung fällig",
  issueDate: "Rechnungsdatum",
  dueDate: "Fällig am",
  validUntil: "Gültig bis",
  paymentTerms: "Zahlungsbedingungen",
  reference: "Referenz / Bestellnr.",
  relatedDocument: "Bezugsdokument",
  notes: "Anmerkungen",
  terms: "AGB",
  payNow: "Jetzt bezahlen",
  bankDetails: "Bankverbindung",
  reverseCharge: "Reverse-Charge — Steuerschuldnerschaft des Leistungsempfängers",
  notTaxInvoice: "Dies ist keine Steuerrechnung",
  hours: "Stunden",
  status: {
    draft: "Entwurf",
    sent: "Gesendet",
    accepted: "Angenommen",
    invoiced: "In Rechnung gestellt",
    paid: "Bezahlt",
  },
};

const fr: LocaleStrings = {
  ...en,
  documentTypes: {
    invoice: "Facture",
    estimate: "Devis",
    proforma: "Facture proforma",
    credit_note: "Avoir",
  },
  billTo: "Facturer à",
  from: "De",
  description: "Description",
  qty: "Qté",
  unit: "Unité",
  rate: "Prix",
  amount: "Montant",
  subtotal: "Sous-total",
  discount: "Remise",
  tax: "Taxe",
  total: "Total",
  grandTotal: "Total TTC",
  balanceDue: "Solde dû",
  amountPaid: "Montant payé",
  deposit: "Acompte",
  depositDue: "Acompte dû",
  issueDate: "Date d'émission",
  dueDate: "Date d'échéance",
  validUntil: "Valable jusqu'au",
  paymentTerms: "Conditions de paiement",
  reference: "Référence / BC",
  relatedDocument: "Document lié",
  notes: "Notes",
  terms: "Conditions générales",
  payNow: "Payer maintenant",
  bankDetails: "Coordonnées bancaires",
  reverseCharge: "Autoliquidation — TVA due par le client",
  notTaxInvoice: "Ceci n'est pas une facture fiscale",
  hours: "Heures",
  status: {
    draft: "Brouillon",
    sent: "Envoyé",
    accepted: "Accepté",
    invoiced: "Facturé",
    paid: "Payé",
  },
};

const es: LocaleStrings = {
  ...en,
  documentTypes: {
    invoice: "Factura",
    estimate: "Presupuesto",
    proforma: "Factura proforma",
    credit_note: "Nota de crédito",
  },
  billTo: "Facturar a",
  from: "De",
  description: "Descripción",
  qty: "Cant.",
  unit: "Unidad",
  rate: "Precio",
  amount: "Importe",
  subtotal: "Subtotal",
  discount: "Descuento",
  tax: "Impuesto",
  total: "Total",
  grandTotal: "Total general",
  balanceDue: "Saldo pendiente",
  amountPaid: "Importe pagado",
  deposit: "Depósito",
  depositDue: "Depósito pendiente",
  issueDate: "Fecha de emisión",
  dueDate: "Fecha de vencimiento",
  validUntil: "Válido hasta",
  paymentTerms: "Condiciones de pago",
  reference: "Referencia / PO",
  relatedDocument: "Documento relacionado",
  notes: "Notas",
  terms: "Términos y condiciones",
  payNow: "Pagar ahora",
  bankDetails: "Datos bancarios",
  reverseCharge: "Inversión del sujeto pasivo — IVA a cargo del cliente",
  notTaxInvoice: "Esto no es una factura fiscal",
  hours: "Horas",
  status: {
    draft: "Borrador",
    sent: "Enviado",
    accepted: "Aceptado",
    invoiced: "Facturado",
    paid: "Pagado",
  },
};

const nl: LocaleStrings = {
  ...en,
  documentTypes: {
    invoice: "Factuur",
    estimate: "Offerte",
    proforma: "Proforma factuur",
    credit_note: "Creditnota",
  },
  billTo: "Factureren aan",
  from: "Van",
  description: "Omschrijving",
  qty: "Aantal",
  unit: "Eenheid",
  rate: "Tarief",
  amount: "Bedrag",
  subtotal: "Subtotaal",
  discount: "Korting",
  tax: "Belasting",
  total: "Totaal",
  grandTotal: "Totaalbedrag",
  balanceDue: "Openstaand",
  amountPaid: "Betaald",
  deposit: "Aanbetaling",
  depositDue: "Aanbetaling verschuldigd",
  issueDate: "Factuurdatum",
  dueDate: "Vervaldatum",
  validUntil: "Geldig tot",
  paymentTerms: "Betalingsvoorwaarden",
  reference: "Referentie / PO",
  relatedDocument: "Gerelateerd document",
  notes: "Opmerkingen",
  terms: "Voorwaarden",
  payNow: "Nu betalen",
  bankDetails: "Bankgegevens",
  reverseCharge: "Verlegging — BTW verschuldigd door klant",
  notTaxInvoice: "Dit is geen belastingfactuur",
  hours: "Uren",
  status: {
    draft: "Concept",
    sent: "Verzonden",
    accepted: "Geaccepteerd",
    invoiced: "Gefactureerd",
    paid: "Betaald",
  },
};

const pt: LocaleStrings = {
  ...en,
  documentTypes: {
    invoice: "Fatura",
    estimate: "Orçamento",
    proforma: "Fatura proforma",
    credit_note: "Nota de crédito",
  },
  billTo: "Faturar para",
  from: "De",
  description: "Descrição",
  qty: "Qtd",
  unit: "Unidade",
  rate: "Preço",
  amount: "Valor",
  subtotal: "Subtotal",
  discount: "Desconto",
  tax: "Imposto",
  total: "Total",
  grandTotal: "Total geral",
  balanceDue: "Saldo devido",
  amountPaid: "Valor pago",
  deposit: "Depósito",
  depositDue: "Depósito devido",
  issueDate: "Data de emissão",
  dueDate: "Data de vencimento",
  validUntil: "Válido até",
  paymentTerms: "Condições de pagamento",
  reference: "Referência / PO",
  relatedDocument: "Documento relacionado",
  notes: "Notas",
  terms: "Termos e condições",
  payNow: "Pagar agora",
  bankDetails: "Dados bancários",
  reverseCharge: "Autoliquidação — IVA devido pelo cliente",
  notTaxInvoice: "Isto não é uma fatura fiscal",
  hours: "Horas",
  status: {
    draft: "Rascunho",
    sent: "Enviado",
    accepted: "Aceite",
    invoiced: "Faturado",
    paid: "Pago",
  },
};

const it: LocaleStrings = {
  ...en,
  documentTypes: {
    invoice: "Fattura",
    estimate: "Preventivo",
    proforma: "Fattura proforma",
    credit_note: "Nota di credito",
  },
  billTo: "Fatturare a",
  from: "Da",
  description: "Descrizione",
  qty: "Qtà",
  unit: "Unità",
  rate: "Prezzo",
  amount: "Importo",
  subtotal: "Subtotale",
  discount: "Sconto",
  tax: "Imposta",
  total: "Totale",
  grandTotal: "Totale generale",
  balanceDue: "Saldo dovuto",
  amountPaid: "Importo pagato",
  deposit: "Acconto",
  depositDue: "Acconto dovuto",
  issueDate: "Data emissione",
  dueDate: "Scadenza",
  validUntil: "Valido fino al",
  paymentTerms: "Termini di pagamento",
  reference: "Riferimento / PO",
  relatedDocument: "Documento correlato",
  notes: "Note",
  terms: "Termini e condizioni",
  payNow: "Paga ora",
  bankDetails: "Coordinate bancarie",
  reverseCharge: "Inversione contabile — IVA a carico del cliente",
  notTaxInvoice: "Questo non è un documento fiscale",
  hours: "Ore",
  status: {
    draft: "Bozza",
    sent: "Inviato",
    accepted: "Accettato",
    invoiced: "Fatturato",
    paid: "Pagato",
  },
};

const ja: LocaleStrings = {
  ...en,
  documentTypes: {
    invoice: "請求書",
    estimate: "見積書",
    proforma: "プロフォーマ請求書",
    credit_note: "クレジットノート",
  },
  billTo: "請求先",
  from: "発行元",
  description: "内容",
  qty: "数量",
  unit: "単位",
  rate: "単価",
  amount: "金額",
  subtotal: "小計",
  discount: "割引",
  tax: "税",
  total: "合計",
  grandTotal: "総計",
  balanceDue: "未払い残高",
  amountPaid: "支払済み",
  deposit: "前金",
  depositDue: "前金請求",
  issueDate: "発行日",
  dueDate: "支払期限",
  validUntil: "有効期限",
  paymentTerms: "支払条件",
  reference: "参照 / PO",
  relatedDocument: "関連書類",
  notes: "備考",
  terms: "取引条件",
  payNow: "今すぐ支払う",
  bankDetails: "銀行口座",
  reverseCharge: "リバースチャarge — 消費税は顧客負担",
  notTaxInvoice: "これは税務上の請求書ではありません",
  hours: "時間",
  status: {
    draft: "下書き",
    sent: "送信済み",
    accepted: "承認済み",
    invoiced: "請求済み",
    paid: "支払済み",
  },
};

export const LOCALE_OPTIONS: { code: InvoiceLocale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "nl", label: "Nederlands" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "ja", label: "日本語" },
];

export function getLocaleStrings(locale: InvoiceLocale): LocaleStrings {
  switch (locale) {
    case "de":
      return de;
    case "fr":
      return fr;
    case "es":
      return es;
    case "nl":
      return nl;
    case "pt":
      return pt;
    case "it":
      return it;
    case "ja":
      return ja;
    default:
      return en;
  }
}

export function formatDate(dateStr: string, locale: InvoiceLocale): string {
  if (!dateStr) return "—";
  try {
    const loc = locale === "ja" ? "ja-JP" : locale === "de" ? "de-DE" : `${locale}-${locale.toUpperCase()}`;
    return new Intl.DateTimeFormat(loc, { dateStyle: "medium" }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}
