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
          className="rounded-lg border-2 border-sage bg-sage px-4 py-2 text-sm font-bold text-forest hover:bg-sage-light disabled:opacity-50"
        >
          Unlock
        </button>
      }
    >
      <p className="text-sm font-semibold text-sand">
        This file is locked. Please enter the password to process it locally.
      </p>
      {fileName ? (
        <p className="mt-2 text-xs text-sand-light">
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
        className={`${INPUT_CLASS} mt-4 border-2 border-sage`}
        placeholder="Password"
        autoFocus
      />
    </Modal>
  );
}
