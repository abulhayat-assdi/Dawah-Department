"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createResource(formData: FormData) {
  const profile = await requireAdmin();
  const supabase = await createClient();
  await supabase.from("resources").insert({
    title: String(formData.get("title") ?? "").trim(),
    type: String(formData.get("type") ?? "pdf"),
    url: String(formData.get("url") ?? "").trim() || null,
    course_id: String(formData.get("course_id") ?? "") || null,
    uploaded_by: profile.id,
  });
  revalidatePath("/admin/resources");
}

export async function deleteResource(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("resources").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/resources");
}
