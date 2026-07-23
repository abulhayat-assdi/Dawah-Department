"use client";

import { ConfirmButton } from "@/components/confirm-button";

/**
 * Danger button that asks for confirmation in a designed dialog before running
 * a delete server action. Thin wrapper over {@link ConfirmButton}.
 */
export function DeleteButton({
  action,
  id,
  label = "Delete",
  confirmText,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label?: string;
  confirmText?: string;
  className?: string;
}) {
  return (
    <ConfirmButton
      action={action}
      fields={{ id }}
      variant="danger"
      triggerClassName={className}
      message={confirmText}
      confirmLabel="ডিলিট করুন"
    >
      {label}
    </ConfirmButton>
  );
}
