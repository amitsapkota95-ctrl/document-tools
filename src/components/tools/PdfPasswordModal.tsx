"use client";

import { Modal } from "@/components/ui/Modal";
import { INPUT_CLASS } from "@/lib/ui/classes";

interface PdfPasswordModalProps {
  open: boolean;
  fileName?: string;
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function PdfPasswordModal({
  open,
  fileName,
  password,
  onPasswordChange,
  onSubmit,
  onClose,
}: PdfPasswordModalProps) {
  return (
    <Modal
      open={open}
      title="This file is locked"
      onClose={onClose}
      actions={
        <button
          type="button"
          onClick={onSubmit}
          disabled={!password.trim()}
          className="rounded-xl bg-forest-700 px-4 py-2 text-xs font-bold text-cream-100 hover:bg-forest-600 disabled:opacity-50"
        >
          Unlock
        </button>
      }
    >
      <p className="text-sm font-semibold text-ink/60">
        This file is locked. Please enter the password to process it locally.
      </p>
      {fileName ? (
        <p className="mt-2 text-xs text-ink/50">
          File: <span className="font-mono">{fileName}</span>
        </p>
      ) : null}
      <input
        type="password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && password.trim()) onSubmit();
        }}
        className={`${INPUT_CLASS} mt-4`}
        placeholder="Password"
        autoFocus
      />
    </Modal>
  );
}
