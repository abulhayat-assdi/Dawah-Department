"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type LessonPlanFormState = { ok: boolean; error: string | null } | null;

/**
 * Creates or updates a teacher's weekly plan for a batch (one record per
 * teacher/batch/month/week, upserted on that key). RLS additionally requires
 * a matching lesson_plan_assignments row, so a batch/month outside the
 * teacher's monthly allocation is rejected here even if the client is
 * tampered with.
 */
export async function saveLessonPlan(
  _prevState: LessonPlanFormState,
  formData: FormData,
): Promise<LessonPlanFormState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const batchId = String(formData.get("batch_id") ?? "");
  const targetMonth = String(formData.get("target_month") ?? "");
  const weekNumber = Number(formData.get("week_number") ?? 0);
  const description = String(formData.get("description") ?? "").trim();

  if (!batchId || !/^\d{4}-\d{2}$/.test(targetMonth)) {
    return { ok: false, error: "Select a batch and a valid month." };
  }
  if (!weekNumber || weekNumber < 1 || weekNumber > 5) {
    return { ok: false, error: "Select a week number." };
  }
  if (!description) {
    return { ok: false, error: "Lesson description is required." };
  }

  const { error } = await supabase.from("lesson_plans").upsert(
    {
      teacher_id: profile.id,
      batch_id: batchId,
      campus_id: String(formData.get("campus_id") ?? "") || null,
      target_month: targetMonth,
      week_number: weekNumber,
      description,
    },
    { onConflict: "teacher_id,batch_id,target_month,week_number" },
  );
  if (error) {
    return {
      ok: false,
      error: "Could not save the plan — the batch may not be assigned to you for this month.",
    };
  }

  revalidatePath("/my/lesson-plan");
  return { ok: true, error: null };
}

export async function deleteLessonPlan(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase
    .from("lesson_plans")
    .delete()
    .eq("id", String(formData.get("id")))
    .eq("teacher_id", profile.id);
  revalidatePath("/my/lesson-plan");
}
