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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/50 p-4 backdrop-blur-sm">
      <div
        className="eco-card w-full max-w-md rounded-xl p-6 shadow-eco-lg"
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
      >
        <h2 id="modal-title" className="font-serif text-xl font-bold text-forest">
          {title}
        </h2>
        <div className="mt-4">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-moss-dark bg-moss-light/80 px-4 py-2 text-sm font-semibold text-forest hover:bg-moss-light"
          >
            Cancel
          </button>
          {actions}
        </div>
      </div>
    </div>
  );
}
