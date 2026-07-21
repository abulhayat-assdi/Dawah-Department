"use server";

import { revalidatePath } from "next/cache";
import { requireCoordinatorOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type RoutineFormState = { ok: boolean } | null;

/**
 * Creates or updates the weekly routine for a batch (one record per batch,
 * upserted on batch_id). Restricted to Super Admins / Campus Coordinators;
 * RLS additionally scopes coordinators to their own campus.
 */
export async function saveRoutine(
  _prevState: RoutineFormState,
  formData: FormData,
): Promise<RoutineFormState> {
  const profile = await requireCoordinatorOrAdmin();
  const supabase = await createClient();

  const batchId = String(formData.get("batch_id") ?? "");
  if (!batchId) return { ok: false };

  const time = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v || null;
  };
  const days = (key: string) =>
    formData
      .getAll(key)
      .map((d) => Number(d))
      .filter((n) => !Number.isNaN(n));

  await supabase.from("campus_routines").upsert(
    {
      batch_id: batchId,
      campus_id: String(formData.get("campus_id") ?? "") || null,
      quran_start: time("quran_start"),
      quran_end: time("quran_end"),
      quran_days: days("quran_days"),
      dawah_start: time("dawah_start"),
      dawah_end: time("dawah_end"),
      dawah_days: days("dawah_days"),
      note: String(formData.get("note") ?? "").trim() || null,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "batch_id" },
  );

  revalidatePath("/routine");
  return { ok: true };
}

export async function deleteRoutine(formData: FormData) {
  await requireCoordinatorOrAdmin();
  const supabase = await createClient();
  await supabase
    .from("campus_routines")
    .delete()
    .eq("id", String(formData.get("id")));
  revalidatePath("/routine");
}
