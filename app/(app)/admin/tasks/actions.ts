"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notify";

export async function createTask(formData: FormData) {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const title = String(formData.get("title") ?? "").trim();
  const assignedTo = String(formData.get("assigned_to") ?? "") || null;
  await supabase.from("tasks").insert({
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    assigned_to: assignedTo,
    assigned_by: profile.id,
    due_date: String(formData.get("due_date") ?? "") || null,
    priority: Number(formData.get("priority") ?? 0),
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
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/tasks");
}
