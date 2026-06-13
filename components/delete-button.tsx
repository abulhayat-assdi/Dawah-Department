"use client";

import { Button } from "@/components/ui";

/**
 * Delete form with a confirm() guard. Works inside server components because
 * the interactive bits live here in a client component.
 */
export function DeleteButton({
  action,
  id,
  label = "Delete",
  confirmText = "Are you sure? This cannot be undone.",
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label?: string;
  confirmText?: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger" className={className}>
        {label}
      </Button>
    </form>
  );
}
