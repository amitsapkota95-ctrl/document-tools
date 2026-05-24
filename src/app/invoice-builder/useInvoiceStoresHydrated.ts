"use client";

import { useEffect, useState } from "react";
import { useBusinessProfileStore } from "@/stores/business-profile-store";
import { useInvoiceStore, useNumberSequenceStore } from "@/stores/invoice-store";

/** Wait for persisted invoice stores to rehydrate from localStorage before rendering forms. */
export function useInvoiceStoresHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const rehydrate = async () => {
      await Promise.all([
        useInvoiceStore.persist.rehydrate(),
        useBusinessProfileStore.persist.rehydrate(),
        useNumberSequenceStore.persist.rehydrate(),
      ]);
      if (!cancelled) setHydrated(true);
    };

    void rehydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  return hydrated;
}
