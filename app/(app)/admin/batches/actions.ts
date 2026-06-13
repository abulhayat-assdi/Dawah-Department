"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createBatch(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const total = Number(formData.get("total_classes") ?? 0);
  await supabase.from("batches").insert({
    course_id: String(formData.get("course_id")),
    batch_no: String(formData.get("batch_no") ?? "").trim(),
    duration_label: String(formData.get("duration_label") ?? "").trim() || null,
    start_date: String(formData.get("start_date") ?? "") || null,
    dawah_end_date: String(formData.get("dawah_end_date") ?? "") || null,
    farewell_date: String(formData.get("farewell_date") ?? "") || null,
    total_classes: total,
    status: String(formData.get("status") ?? "will_start"),
  });
  revalidatePath("/admin/batches");
}

export async function deleteBatch(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("batches").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/batches");
  redirect("/admin/batches");
}

export async function assignTeacher(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const batch_id = String(formData.get("batch_id"));
  await supabase.from("batch_teachers").insert({
    batch_id,
    teacher_id: String(formData.get("teacher_id")),
    role_label: String(formData.get("role_label") ?? "").trim() || null,
  });
  revalidatePath(`/admin/batches/${batch_id}`);
}

export async function unassignTeacher(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const batch_id = String(formData.get("batch_id"));
  await supabase
    .from("batch_teachers")
    .delete()
    .eq("batch_id", batch_id)
    .eq("teacher_id", String(formData.get("teacher_id")));
  revalidatePath(`/admin/batches/${batch_id}`);
}
