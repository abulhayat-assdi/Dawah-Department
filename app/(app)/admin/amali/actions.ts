"use server";

import { revalidatePath } from "next/cache";
import { requireCoordinatorOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createAmaliItem(formData: FormData) {
  await requireCoordinatorOrAdmin();
  const supabase = await createClient();
  await supabase.from("amali_items").insert({
    title: String(formData.get("title") ?? "").trim(),
    sequence: Number(formData.get("sequence") ?? 0),
    campus_id: String(formData.get("campus_id") ?? "") || null,
  });
  revalidatePath("/admin/amali");
  revalidatePath("/dashboard");
}

export async function toggleAmaliItem(formData: FormData) {
  await requireCoordinatorOrAdmin();
  const supabase = await createClient();
  await supabase
    .from("amali_items")
    .update({ is_active: String(formData.get("is_active")) === "true" })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/amali");
  revalidatePath("/dashboard");
}

export async function deleteAmaliItem(formData: FormData) {
  await requireCoordinatorOrAdmin();
  const supabase = await createClient();
  await supabase.from("amali_items").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/amali");
  revalidatePath("/dashboard");
}
