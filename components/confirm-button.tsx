"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";
import { clsx } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

/**
 * A trigger button that pops a designed confirmation dialog before running a
 * server action. Replaces the browser's native `confirm()` everywhere on the
 * site so the confirm step matches the app's look.
 *
 * The trigger is `type="button"` and the actual submit `<form>` lives inside a
 * portal on `document.body`, so this can be dropped inside another `<form>`
 * (e.g. the routine builder) without creating an invalid nested form.
 */
export function ConfirmButton({
  action,
  fields,
  children,
  triggerClassName,
  triggerAriaLabel,
  variant,
  tone = "danger",
  title = "আপনি কি নিশ্চিত?",
  message = "এই কাজটি আর ফিরিয়ে আনা যাবে না।",
  confirmLabel = "নিশ্চিত করুন",
  cancelLabel = "বাতিল করুন",
  icon,
}: {
  action: (formData: FormData) => void | Promise<void>;
  /** Hidden inputs submitted with the action, e.g. `{ id }`. */
  fields?: Record<string, string | number | null | undefined>;
  children: React.ReactNode;
  triggerClassName?: string;
  triggerAriaLabel?: string;
  /** When set, the trigger renders as a styled `<Button>` of this variant. */
  variant?: Variant;
  /** Accent + confirm-button colour of the dialog. */
  tone?: "danger" | "primary";
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const trigger = variant ? (
    <Button
      type="button"
      variant={variant}
      className={triggerClassName}
      aria-label={triggerAriaLabel}
      onClick={() => setOpen(true)}
    >
      {children}
    </Button>
  ) : (
    <button
      type="button"
      className={triggerClassName}
      aria-label={triggerAriaLabel}
      onClick={() => setOpen(true)}
    >
      {children}
    </button>
  );

  const accent =
    tone === "danger" ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-600";
  const confirmVariant: Variant = tone === "danger" ? "danger" : "primary";

  return (
    <>
      {trigger}
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] grid place-items-center bg-brand-950/70 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="animate-fade-up w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={clsx(
                  "mx-auto grid size-12 place-items-center rounded-full text-2xl",
                  accent,
                )}
              >
                {icon ?? (tone === "danger" ? "🗑️" : "❓")}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-500">{message}</p>
              <div className="mt-6 flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                >
                  {cancelLabel}
                </Button>
                <form action={action} className="flex-1">
                  {fields &&
                    Object.entries(fields).map(([k, v]) =>
                      v == null ? null : (
                        <input
                          key={k}
                          type="hidden"
                          name={k}
                          value={String(v)}
                        />
                      ),
                    )}
                  <ConfirmSubmit variant={confirmVariant} label={confirmLabel} />
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function ConfirmSubmit({
  variant,
  label,
}: {
  variant: Variant;
  label: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      className="w-full"
      disabled={pending}
    >
      {pending ? "অপেক্ষা করুন…" : label}
    </Button>
  );
}
