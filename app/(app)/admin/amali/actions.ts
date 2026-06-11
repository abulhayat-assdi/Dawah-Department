"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createAmaliItem(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("amali_items").insert({
    title: String(formData.get("title") ?? "").trim(),
    sequence: Number(formData.get("sequence") ?? 0),
  });
  revalidatePath("/admin/amali");
  revalidatePath("/my/amali");
}

export async function toggleAmaliItem(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("amali_items")
    .update({ is_active: String(formData.get("is_active")) === "true" })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/amali");
  revalidatePath("/my/amali");
}

export async function deleteAmaliItem(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("amali_items").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/amali");
  revalidatePath("/my/amali");
}
