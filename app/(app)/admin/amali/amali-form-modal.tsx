"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Label, Input, Select, Button } from "@/components/ui";
import { createAmaliItem, type AmaliFormState } from "./actions";
import type { Campus } from "@/lib/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "সংরক্ষণ হচ্ছে…" : "যোগ করুন"}
    </Button>
  );
}

export function AmaliFormModal({ campuses }: { campuses: Campus[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<AmaliFormState | null, FormData>(
    createAmaliItem,
    null,
  );

  // Close the dialog once a submit succeeds. Reacting to a new action result
  // during render (guarded so it only fires once per result) avoids a
  // setState-in-effect render cascade; the dialog's <form> unmounts on close,
  // so a fresh, blank one is mounted next time it opens — no manual reset.
  const [handled, setHandled] = useState<AmaliFormState | null>(null);
  if (state && state !== handled) {
    setHandled(state);
    if (!state.error) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>নতুন আমল যোগ করুন</Button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-brand-950/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="animate-fade-up relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                নতুন আমল যোগ করুন
              </h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form action={formAction} className="space-y-4 p-5">
              <div>
                <Label htmlFor="title">শিরোনাম</Label>
                <Input id="title" name="title" required placeholder="যেমন: তাহাজ্জুদ" />
              </div>
              <div>
                <Label htmlFor="campus_id">Campus (leave blank for a global routine)</Label>
                <Select id="campus_id" name="campus_id" defaultValue="">
                  <option value="">Global — every campus</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="start_date">শুরুর তারিখ</Label>
                  <Input id="start_date" name="start_date" type="date" />
                </div>
                <div>
                  <Label htmlFor="end_date">শেষের তারিখ</Label>
                  <Input id="end_date" name="end_date" type="date" />
                </div>
              </div>

              {state?.error && (
                <p className="text-sm text-red-600">{state.error}</p>
              )}

              <SubmitButton />
            </form>
          </div>
        </div>
      )}
    </>
  );
}
