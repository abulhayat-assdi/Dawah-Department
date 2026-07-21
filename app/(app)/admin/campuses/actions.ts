"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageAccess } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const CAMPUS_PAGE = "/admin/campuses";

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
  await requirePageAccess(CAMPUS_PAGE);
  const supabase = await createClient();
  await supabase.from("campuses").insert(readCampus(formData));
  revalidatePath("/admin/campuses");
  revalidatePath("/activities");
}

export async function updateCampus(formData: FormData) {
  await requirePageAccess(CAMPUS_PAGE);
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
  await requirePageAccess(CAMPUS_PAGE);
  const supabase = await createClient();
  await supabase.from("campuses").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/campuses");
  revalidatePath("/activities");
  redirect("/admin/campuses");
}

/** Replaces the set of courses running at this campus (courses.campus_id). */
export async function setCampusCourses(formData: FormData) {
  await requirePageAccess(CAMPUS_PAGE);
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

/**
 * Creates a brand-new master course and, in the same step, assigns it to this
 * campus (courses.campus_id). Called from the "Add Course" form on the campus
 * detail page — the new course then shows up (checked) in the assignment grid.
 */
export async function createCourseForCampus(formData: FormData) {
  await requirePageAccess(CAMPUS_PAGE);
  const supabase = await createClient();
  const campusId = String(formData.get("campus_id"));
  const abbreviation = String(formData.get("abbreviation") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!campusId || !abbreviation || !name) return;

  await supabase.from("courses").insert({
    abbreviation,
    name,
    campus_id: campusId,
    category: "common",
    default_total_classes: 0,
  });

  revalidatePath(`/admin/campuses/${campusId}`);
  revalidatePath("/admin/campuses");
  revalidatePath("/admin/courses");
  revalidatePath("/admin/tracker");
}
