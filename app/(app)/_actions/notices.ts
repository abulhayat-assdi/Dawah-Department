"use server";

import { revalidatePath } from "next/cache";
import { requireCoordinatorOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createNotice(formData: FormData) {
  const profile = await requireCoordinatorOrAdmin();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const campusId = String(formData.get("campus_id") ?? "").trim();
  const supabase = await createClient();
  await supabase.from("notices").insert({
    title,
    body: String(formData.get("body") ?? "").trim() || null,
    campus_id: campusId || null,
    created_by: profile.id,
  });
  revalidatePath("/dashboard");
}

export async function updateNotice(formData: FormData) {
  await requireCoordinatorOrAdmin();
  const campusId = String(formData.get("campus_id") ?? "").trim();
  const supabase = await createClient();
  await supabase
    .from("notices")
    .update({
      title: String(formData.get("title") ?? "").trim(),
      body: String(formData.get("body") ?? "").trim() || null,
      campus_id: campusId || null,
    })
    .eq("id", String(formData.get("id")));
  revalidatePath("/dashboard");
}

export async function deleteNotice(formData: FormData) {
  await requireCoordinatorOrAdmin();
  const supabase = await createClient();
  await supabase.from("notices").delete().eq("id", String(formData.get("id")));
  revalidatePath("/dashboard");
}
