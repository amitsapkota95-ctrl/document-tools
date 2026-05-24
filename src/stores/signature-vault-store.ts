import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SavedSignature {
  id: string;
  label: string;
  dataUrl: string;
  createdAt: number;
}

interface SignatureVaultState {
  signatures: SavedSignature[];
  addSignature: (label: string, dataUrl: string) => void;
  removeSignature: (id: string) => void;
}

const MAX_SIGNATURES = 10;

export const useSignatureVaultStore = create<SignatureVaultState>()(
  persist(
    (set) => ({
      signatures: [],
      addSignature: (label, dataUrl) =>
        set((state) => {
          const next = [
            { id: crypto.randomUUID(), label, dataUrl, createdAt: Date.now() },
            ...state.signatures.filter((s) => s.dataUrl !== dataUrl),
          ].slice(0, MAX_SIGNATURES);
          return { signatures: next };
        }),
      removeSignature: (id) =>
        set((state) => ({
          signatures: state.signatures.filter((s) => s.id !== id),
        })),
    }),
    { name: "paperless-signatures" },
  ),
);
