"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function readCourse(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    abbreviation: String(formData.get("abbreviation") ?? "").trim(),
    campus_id: String(formData.get("campus_id") ?? "") || null,
    category: String(formData.get("category") ?? "common"),
    duration_label: String(formData.get("duration_label") ?? "").trim() || null,
    default_total_classes: Number(formData.get("default_total_classes") ?? 0),
    description: String(formData.get("description") ?? "").trim() || null,
  };
}

export async function createCourse(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("courses").insert(readCourse(formData));
  revalidatePath("/admin/courses");
}

export async function updateCourse(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("courses")
    .update(readCourse(formData))
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${String(formData.get("id"))}`);
}

export async function deleteCourse(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("courses").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/courses");
  redirect("/admin/courses");
}

export async function addTopic(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const course_id = String(formData.get("course_id"));
  await supabase.from("syllabus_topics").insert({
    course_id,
    sequence: Number(formData.get("sequence") ?? 0),
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
  });
  revalidatePath(`/admin/courses/${course_id}`);
}

export async function deleteTopic(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const course_id = String(formData.get("course_id"));
  await supabase
    .from("syllabus_topics")
    .delete()
    .eq("id", String(formData.get("id")));
  revalidatePath(`/admin/courses/${course_id}`);
}
