"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createNotice(formData: FormData) {
  const profile = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const supabase = await createClient();
  await supabase.from("notices").insert({
    title,
    body: String(formData.get("body") ?? "").trim() || null,
    created_by: profile.id,
  });
  revalidatePath("/dashboard");
}

export async function updateNotice(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("notices")
    .update({
      title: String(formData.get("title") ?? "").trim(),
      body: String(formData.get("body") ?? "").trim() || null,
    })
    .eq("id", String(formData.get("id")));
  revalidatePath("/dashboard");
}

export async function deleteNotice(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("notices").delete().eq("id", String(formData.get("id")));
  revalidatePath("/dashboard");
}
