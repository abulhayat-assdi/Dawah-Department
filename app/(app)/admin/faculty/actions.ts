"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function read(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    designation: String(formData.get("designation") ?? "").trim() || null,
    photo_url: String(formData.get("photo_url") ?? "").trim() || null,
    background: String(formData.get("background") ?? "").trim() || null,
    location: String(formData.get("location") ?? "").trim() || null,
    bio: String(formData.get("bio") ?? "").trim() || null,
    featured: formData.get("featured") === "on",
    sort: Number(formData.get("sort") ?? 0),
  };
}

function revalidate() {
  revalidatePath("/admin/faculty");
  revalidatePath("/faculty");
}

export async function createFaculty(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("faculty").insert(read(formData));
  revalidate();
}

export async function updateFaculty(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("faculty").update(read(formData)).eq("id", String(formData.get("id")));
  revalidate();
  redirect("/admin/faculty");
}

export async function deleteFaculty(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("faculty").delete().eq("id", String(formData.get("id")));
  revalidate();
}
