import type { ReactNode } from "react";
import { useDialog } from "./useDialog.ts";
import { PrimaryButton } from "./PrimaryButton.tsx";
import { SecondaryButton } from "./SecondaryButton.tsx";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "Keep editing",
  confirmVariant = "danger",
  confirmDisabled = false,
  cancelDisabled = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const ref = useDialog(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#07182b]/70 p-4 sm:items-center" onMouseDown={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl outline-none"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-title" className="font-serif text-2xl text-navy">
          {title}
        </h2>
        <div className="mt-3 text-sm leading-6 text-muted">{children}</div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <SecondaryButton type="button" onClick={onClose} disabled={cancelDisabled}>
            {cancelLabel}
          </SecondaryButton>
          <PrimaryButton type="button" variant={confirmVariant} onClick={onConfirm} disabled={confirmDisabled}>
            {confirmLabel}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
