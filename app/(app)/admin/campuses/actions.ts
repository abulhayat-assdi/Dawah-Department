"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createCampus(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("campuses").insert({
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
  });
  revalidatePath("/admin/campuses");
}

export async function deleteCampus(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("campuses").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/campuses");
}
