"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function readCampus(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    image_url: String(formData.get("image_url") ?? "").trim() || null,
  };
}

export async function createCampus(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("campuses").insert(readCampus(formData));
  revalidatePath("/admin/campuses");
  revalidatePath("/activities");
}

export async function updateCampus(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("campuses")
    .update(readCampus(formData))
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/campuses");
  revalidatePath(`/admin/campuses/${String(formData.get("id"))}`);
  revalidatePath("/activities");
}

export async function deleteCampus(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("campuses").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/campuses");
  revalidatePath("/activities");
  redirect("/admin/campuses");
}
