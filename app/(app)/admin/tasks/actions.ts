"use server";

import { revalidatePath } from "next/cache";
import { requireCoordinatorOrAdmin, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notify";

export async function createTask(formData: FormData) {
  const profile = await requireCoordinatorOrAdmin();
  const supabase = await createClient();
  const title = String(formData.get("title") ?? "").trim();
  const assignedTo = String(formData.get("assigned_to") ?? "") || null;
  const classType = String(formData.get("class_type") ?? "") || null;
  // Field relevance depends on the class type:
  //   quran/dawah        → batch (by campus) + monthly quota;
  //   staff              → monthly quota only;
  //   form_verification  → course + batch (by course) + monthly quota;
  //   other              → due date + priority (a plain dated task).
  const isMonthly =
    classType === "quran" ||
    classType === "dawah" ||
    classType === "staff" ||
    classType === "form_verification";
  const hasBatch =
    classType === "quran" ||
    classType === "dawah" ||
    classType === "form_verification";
  const hasCourse = classType === "form_verification";
  await supabase.from("tasks").insert({
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    campus_id: String(formData.get("campus_id") ?? "") || null,
    assigned_to: assignedTo,
    assigned_by: profile.id,
    class_type: classType,
    course_id: hasCourse ? String(formData.get("course_id") ?? "") || null : null,
    batch_id: hasBatch ? String(formData.get("batch_id") ?? "") || null : null,
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

/** Used by both admin and the assignee (RLS allows both). */
export async function updateTaskStatus(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({ status: String(formData.get("status")) })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/tasks");
  revalidatePath("/my/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTask(formData: FormData) {
  await requireCoordinatorOrAdmin();
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/tasks");
}
