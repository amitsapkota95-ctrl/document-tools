"use client";

import { useEffect, useState } from "react";
import { History, Trash2 } from "lucide-react";
import { deleteFromHistory, getDocumentHistory } from "@/lib/invoice/history";
import { getLocaleStrings } from "@/lib/invoice/locales";
import type { InvoiceDraft, SavedDocument } from "@/lib/invoice/types";

interface DocumentHistoryPanelProps {
  onLoad: (draft: InvoiceDraft) => void;
}

export function DocumentHistoryPanel({ onLoad }: DocumentHistoryPanelProps) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<SavedDocument[]>([]);

  const refresh = () => getDocumentHistory().then(setHistory);

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  const handleDelete = async (id: string) => {
    await deleteFromHistory(id);
    refresh();
  };

  return (
    <div className="rounded-xl border border-moss-dark/50 bg-moss-light/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold text-forest"
      >
        <History className="h-4 w-4" />
        Document history ({history.length})
      </button>
      {open ? (
        <div className="max-h-64 space-y-2 overflow-y-auto border-t border-moss/50 px-4 py-3">
          {history.length === 0 ? (
            <p className="text-xs text-sand-light">Exported documents appear here for quick reload.</p>
          ) : (
            history.map((doc) => {
              const strings = getLocaleStrings(doc.draft.locale);
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-moss/60 bg-cream px-3 py-2"
                >
                  <button
                    type="button"
                    onClick={() => onLoad(doc.draft)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-semibold text-forest">
                      {strings.documentTypes[doc.draft.documentType]} {doc.draft.documentNumber}
                    </p>
                    <p className="truncate text-xs text-sand-light">
                      {doc.draft.clientName} — {new Date(doc.savedAt).toLocaleDateString()}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    className="shrink-0 rounded p-1 hover:bg-red-50"
                    aria-label="Delete from history"
                  >
                    <Trash2 className="h-4 w-4 text-red-700" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
