import type { TaxComponent } from "./types";

export interface TaxRegionPreset {
  id: string;
  label: string;
  country: string;
  taxComponents: Omit<TaxComponent, "id">[];
  registrationLabel: string;
  registrationPlaceholder: string;
  reverseChargeAvailable: boolean;
  pricingModeDefault: "exclusive" | "inclusive";
}

function tax(label: string, rate: number, registrationNumber = ""): Omit<TaxComponent, "id"> {
  return { label, rate, registrationNumber };
}

export const TAX_REGIONS: TaxRegionPreset[] = [
  {
    id: "none",
    label: "No tax / Tax exempt",
    country: "",
    taxComponents: [],
    registrationLabel: "Tax ID",
    registrationPlaceholder: "",
    reverseChargeAvailable: false,
    pricingModeDefault: "exclusive",
  },
  {
    id: "us",
    label: "United States — Sales Tax",
    country: "US",
    taxComponents: [tax("Sales Tax", 0)],
    registrationLabel: "EIN / Tax ID",
    registrationPlaceholder: "12-3456789",
    reverseChargeAvailable: false,
    pricingModeDefault: "exclusive",
  },
  {
    id: "uk",
    label: "United Kingdom — VAT",
    country: "GB",
    taxComponents: [tax("VAT", 20)],
    registrationLabel: "VAT Number",
    registrationPlaceholder: "GB123456789",
    reverseChargeAvailable: true,
    pricingModeDefault: "exclusive",
  },
  {
    id: "eu-standard",
    label: "European Union — VAT (standard)",
    country: "EU",
    taxComponents: [tax("VAT", 21)],
    registrationLabel: "VAT Number",
    registrationPlaceholder: "EU123456789",
    reverseChargeAvailable: true,
    pricingModeDefault: "exclusive",
  },
  {
    id: "de",
    label: "Germany — VAT (USt)",
    country: "DE",
    taxComponents: [tax("USt", 19)],
    registrationLabel: "USt-IdNr.",
    registrationPlaceholder: "DE123456789",
    reverseChargeAvailable: true,
    pricingModeDefault: "exclusive",
  },
  {
    id: "fr",
    label: "France — TVA",
    country: "FR",
    taxComponents: [tax("TVA", 20)],
    registrationLabel: "N° TVA",
    registrationPlaceholder: "FR12345678901",
    reverseChargeAvailable: true,
    pricingModeDefault: "exclusive",
  },
  {
    id: "au",
    label: "Australia — GST",
    country: "AU",
    taxComponents: [tax("GST", 10)],
    registrationLabel: "ABN",
    registrationPlaceholder: "12 345 678 901",
    reverseChargeAvailable: false,
    pricingModeDefault: "inclusive",
  },
  {
    id: "nz",
    label: "New Zealand — GST",
    country: "NZ",
    taxComponents: [tax("GST", 15)],
    registrationLabel: "GST Number",
    registrationPlaceholder: "123-456-789",
    reverseChargeAvailable: false,
    pricingModeDefault: "inclusive",
  },
  {
    id: "ca-gst",
    label: "Canada — GST only",
    country: "CA",
    taxComponents: [tax("GST", 5)],
    registrationLabel: "Business Number (BN)",
    registrationPlaceholder: "123456789 RT0001",
    reverseChargeAvailable: false,
    pricingModeDefault: "exclusive",
  },
  {
    id: "ca-bc",
    label: "Canada — GST + PST (BC)",
    country: "CA",
    taxComponents: [tax("GST", 5), tax("PST", 7)],
    registrationLabel: "Business Number (BN)",
    registrationPlaceholder: "123456789 RT0001",
    reverseChargeAvailable: false,
    pricingModeDefault: "exclusive",
  },
  {
    id: "ca-on",
    label: "Canada — HST (Ontario)",
    country: "CA",
    taxComponents: [tax("HST", 13)],
    registrationLabel: "Business Number (BN)",
    registrationPlaceholder: "123456789 RT0001",
    reverseChargeAvailable: false,
    pricingModeDefault: "exclusive",
  },
  {
    id: "in",
    label: "India — GST",
    country: "IN",
    taxComponents: [tax("CGST", 9), tax("SGST", 9)],
    registrationLabel: "GSTIN",
    registrationPlaceholder: "22AAAAA0000A1Z5",
    reverseChargeAvailable: false,
    pricingModeDefault: "exclusive",
  },
  {
    id: "in-igst",
    label: "India — IGST (interstate)",
    country: "IN",
    taxComponents: [tax("IGST", 18)],
    registrationLabel: "GSTIN",
    registrationPlaceholder: "22AAAAA0000A1Z5",
    reverseChargeAvailable: false,
    pricingModeDefault: "exclusive",
  },
  {
    id: "sg",
    label: "Singapore — GST",
    country: "SG",
    taxComponents: [tax("GST", 9)],
    registrationLabel: "GST Reg No.",
    registrationPlaceholder: "M12345678X",
    reverseChargeAvailable: false,
    pricingModeDefault: "exclusive",
  },
  {
    id: "jp",
    label: "Japan — Consumption Tax",
    country: "JP",
    taxComponents: [tax("Consumption Tax", 10)],
    registrationLabel: "Registration No.",
    registrationPlaceholder: "T1234567890123",
    reverseChargeAvailable: false,
    pricingModeDefault: "inclusive",
  },
  {
    id: "za",
    label: "South Africa — VAT",
    country: "ZA",
    taxComponents: [tax("VAT", 15)],
    registrationLabel: "VAT Number",
    registrationPlaceholder: "4123456789",
    reverseChargeAvailable: false,
    pricingModeDefault: "exclusive",
  },
  {
    id: "ae",
    label: "UAE — VAT",
    country: "AE",
    taxComponents: [tax("VAT", 5)],
    registrationLabel: "TRN",
    registrationPlaceholder: "100123456700003",
    reverseChargeAvailable: false,
    pricingModeDefault: "exclusive",
  },
  {
    id: "custom",
    label: "Custom tax rates",
    country: "",
    taxComponents: [tax("Tax", 0)],
    registrationLabel: "Tax ID",
    registrationPlaceholder: "",
    reverseChargeAvailable: true,
    pricingModeDefault: "exclusive",
  },
];

export function getTaxRegion(id: string): TaxRegionPreset {
  return TAX_REGIONS.find((r) => r.id === id) ?? TAX_REGIONS[0];
}

export function regionToTaxComponents(regionId: string, registrationNumber = ""): TaxComponent[] {
  const region = getTaxRegion(regionId);
  return region.taxComponents.map((t) => ({
    ...t,
    id: crypto.randomUUID(),
    registrationNumber: registrationNumber || t.registrationNumber,
  }));
}

export function combinedTaxRate(components: TaxComponent[]): number {
  return components.reduce((sum, c) => sum + c.rate, 0);
}
