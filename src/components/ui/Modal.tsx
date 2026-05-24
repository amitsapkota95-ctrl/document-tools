"use client";

interface ModalProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  actions?: React.ReactNode;
}

export function Modal({ open, title, children, onClose, actions }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div
        className="paper-card w-full max-w-md rounded-2xl p-6 shadow-paper-lg"
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
      >
        <h2 id="modal-title" className="font-serif text-xl font-bold text-forest-700">
          {title}
        </h2>
        <div className="mt-4">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-cream-300 bg-white px-4 py-2 text-xs font-bold text-forest-700 hover:bg-cream-200"
          >
            Cancel
          </button>
          {actions}
        </div>
      </div>
    </div>
  );
}
