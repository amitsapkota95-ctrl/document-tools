"use client";

import { useCallback, useState } from "react";
import { PdfPasswordModal } from "@/components/tools/PdfPasswordModal";
import { loadPdfJs } from "@/lib/pdf/load-pdfjs";
import { useToastStore } from "@/stores/toast-store";

export interface UnlockedPdfFile {
  file: File;
  password?: string;
}

function isPasswordError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return msg.includes("password") || msg.includes("encrypted");
}

export function usePdfPasswordUnlock() {
  const pushToast = useToastStore((s) => s.pushToast);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [resolveRef, setResolveRef] = useState<{
    resolve: (value: UnlockedPdfFile | null) => void;
  } | null>(null);

  const tryUnlock = useCallback(
    async (file: File, password?: string): Promise<UnlockedPdfFile | null> => {
      try {
        const bytes = await file.arrayBuffer();
        const pdfjs = await loadPdfJs();
        await pdfjs.getDocument({ data: bytes, password }).promise;
        return { file, password };
      } catch (err) {
        if (isPasswordError(err) && !password) {
          return new Promise((resolve) => {
            setPendingFile(file);
            setPasswordInput("");
            setResolveRef({ resolve });
          });
        }
        if (isPasswordError(err) && password) {
          pushToast("error", "Wrong password. Please try again.");
          return null;
        }
        pushToast("error", `Could not read "${file.name}". Make sure it is a valid PDF.`);
        return null;
      }
    },
    [pushToast],
  );

  const submitPassword = useCallback(async () => {
    if (!pendingFile || !passwordInput.trim() || !resolveRef) return;
    const result = await tryUnlock(pendingFile, passwordInput);
    if (result) {
      resolveRef.resolve(result);
      setPendingFile(null);
      setPasswordInput("");
      setResolveRef(null);
    }
  }, [pendingFile, passwordInput, resolveRef, tryUnlock]);

  const cancelPassword = useCallback(() => {
    resolveRef?.resolve(null);
    setPendingFile(null);
    setPasswordInput("");
    setResolveRef(null);
  }, [resolveRef]);

  const modal = (
    <PdfPasswordModal
      open={!!pendingFile}
      fileName={pendingFile?.name}
      password={passwordInput}
      onPasswordChange={setPasswordInput}
      onSubmit={submitPassword}
      onClose={cancelPassword}
    />
  );

  return { tryUnlock, modal };
}
