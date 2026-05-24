import type { DocumentType, NumberSequences } from "./types";

export const DOCUMENT_PREFIX: Record<DocumentType, string> = {
  invoice: "INV",
  estimate: "EST",
  proforma: "PRO",
  credit_note: "CRN",
};

export const DEFAULT_SEQUENCES: NumberSequences = {
  invoice: 1,
  estimate: 1,
  proforma: 1,
  credit_note: 1,
};

export function formatDocumentNumber(type: DocumentType, sequence: number, prefix?: string): string {
  const p = prefix ?? DOCUMENT_PREFIX[type];
  return `${p}-${String(sequence).padStart(3, "0")}`;
}

export function nextDocumentNumber(
  type: DocumentType,
  sequences: NumberSequences,
  prefix?: string,
): { number: string; nextSequences: NumberSequences } {
  const seq = sequences[type];
  return {
    number: formatDocumentNumber(type, seq, prefix),
    nextSequences: { ...sequences, [type]: seq + 1 },
  };
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function defaultDueDate(): string {
  return addDays(todayIso(), 30);
}

export function defaultValidUntil(): string {
  return addDays(todayIso(), 14);
}

export function advanceRecurringDate(isoDate: string, frequency: string): string {
  const d = new Date(isoDate);
  switch (frequency) {
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.toISOString().slice(0, 10);
}
