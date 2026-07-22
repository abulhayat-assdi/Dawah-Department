"use server";

import { revalidatePath } from "next/cache";
import { requireCoordinatorOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AssignmentFormState = { ok: boolean; error: string | null } | null;

/**
 * Replaces a teacher's lesson-plan batch allocation for a month with the
 * submitted set (delete-then-insert, same idiom as updateTeacher's
 * teacher_campuses handling). RLS additionally scopes coordinators to their
 * own campus's batches.
 */
export async function saveMonthlyAssignment(
  _prevState: AssignmentFormState,
  formData: FormData,
): Promise<AssignmentFormState> {
  const profile = await requireCoordinatorOrAdmin();
  const supabase = await createClient();

  const teacherId = String(formData.get("teacher_id") ?? "");
  const targetMonth = String(formData.get("target_month") ?? "");
  if (!teacherId || !/^\d{4}-\d{2}$/.test(targetMonth)) {
    return { ok: false, error: "Select a teacher and a valid month." };
  }

  const batchIds = [...new Set(formData.getAll("batch_id").map(String).filter(Boolean))];

  await supabase
    .from("lesson_plan_assignments")
    .delete()
    .eq("teacher_id", teacherId)
    .eq("target_month", targetMonth);

  if (batchIds.length) {
    const { data: batchRows } = await supabase
      .from("batches")
      .select("id, campus_id")
      .in("id", batchIds);
    const campusById = new Map(
      (batchRows ?? []).map((b) => [b.id as string, b.campus_id as string | null]),
    );

    const { error } = await supabase.from("lesson_plan_assignments").insert(
      batchIds.map((batch_id) => ({
        teacher_id: teacherId,
        batch_id,
        campus_id: campusById.get(batch_id) ?? null,
        target_month: targetMonth,
        created_by: profile.id,
      })),
    );
    if (error) return { ok: false, error: "Could not save the assignment. Try again." };
  }

  revalidatePath("/admin/lesson-plan");
  return { ok: true, error: null };
}
