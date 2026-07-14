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

/** Replaces the set of courses running at this campus (courses.campus_id). */
export async function setCampusCourses(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const campusId = String(formData.get("campus_id"));
  const courseIds = formData.getAll("course_ids").map(String).filter(Boolean);

  await supabase.from("courses").update({ campus_id: null }).eq("campus_id", campusId);
  if (courseIds.length) {
    await supabase.from("courses").update({ campus_id: campusId }).in("id", courseIds);
  }

  revalidatePath("/admin/campuses");
  revalidatePath(`/admin/campuses/${campusId}`);
  revalidatePath("/admin/courses");
  revalidatePath("/admin/tracker");
}
