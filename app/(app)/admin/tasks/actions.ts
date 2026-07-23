"use server";

import { revalidatePath } from "next/cache";
import { requireCoordinatorOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notify";

export async function createTask(formData: FormData) {
  const profile = await requireCoordinatorOrAdmin();
  const supabase = await createClient();
  const title = String(formData.get("title") ?? "").trim();
  const assignedTo = String(formData.get("assigned_to") ?? "") || null;
  const classType = String(formData.get("class_type") ?? "") || null;
  // Field relevance depends on the class type:
  //   quran/dawah/form_verification → course + batch (by course) + monthly quota
  //                                    (campus is derived from the batch);
  //   staff                         → monthly quota only;
  //   other                         → due date + priority (a plain dated task).
  const isMonthly =
    classType === "quran" ||
    classType === "dawah" ||
    classType === "staff" ||
    classType === "form_verification";
  const hasBatch =
    classType === "quran" ||
    classType === "dawah" ||
    classType === "form_verification";
  const hasCourse = hasBatch;
  const batchId = hasBatch ? String(formData.get("batch_id") ?? "") || null : null;
  // Campus is never picked directly on this form — for batch-based class
  // types it's carried on the batch itself; Staff Class / Other Task have no
  // batch and no campus concept, so campus_id stays null for them.
  let campusId: string | null = null;
  if (batchId) {
    const { data: batch } = await supabase
      .from("batches")
      .select("campus_id")
      .eq("id", batchId)
      .single();
    campusId = batch?.campus_id ?? null;
  }
  await supabase.from("tasks").insert({
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    campus_id: campusId,
    assigned_to: assignedTo,
    assigned_by: profile.id,
    class_type: classType,
    course_id: hasCourse ? String(formData.get("course_id") ?? "") || null : null,
    batch_id: batchId,
    target_month: isMonthly ? String(formData.get("target_month") ?? "") || null : null,
    target_count: isMonthly ? Number(formData.get("target_count") ?? 0) : 0,
    due_date: isMonthly ? null : String(formData.get("due_date") ?? "") || null,
    priority: isMonthly ? 0 : Number(formData.get("priority") ?? 0),
    status: "todo",
  });
  if (assignedTo) {
    await createNotification(assignedTo, {
      title: "নতুন টাস্ক বরাদ্দ হয়েছে",
      body: title,
      link: "/my/tasks",
    });
  }
  revalidatePath("/admin/tasks");
}

export async function deleteTask(formData: FormData) {
  await requireCoordinatorOrAdmin();
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/tasks");
}
