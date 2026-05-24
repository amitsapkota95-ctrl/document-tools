import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BusinessProfile } from "@/lib/invoice/types";

interface BusinessProfileState extends BusinessProfile {
  setField: <K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) => void;
  setBankField: <K extends keyof BusinessProfile["bankDetails"]>(
    key: K,
    value: BusinessProfile["bankDetails"][K],
  ) => void;
}

export const defaultBusinessProfile: BusinessProfile = {
  businessName: "Your Business",
  address: "",
  email: "",
  phone: "",
  website: "",
  taxRegistrations: "",
  logoDataUrl: null,
  accentColor: "#14532d",
  defaultCurrency: "USD",
  defaultLocale: "en",
  defaultRegionId: "none",
  defaultPaymentTerms: "Net 30",
  bankDetails: {
    accountName: "",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    iban: "",
    swift: "",
  },
};

export const useBusinessProfileStore = create<BusinessProfileState>()(
  persist(
    (set) => ({
      ...defaultBusinessProfile,
      setField: (key, value) => set({ [key]: value }),
      setBankField: (key, value) =>
        set((state) => ({
          bankDetails: { ...state.bankDetails, [key]: value },
        })),
    }),
    { name: "paperless-business-profile", skipHydration: true },
  ),
);
