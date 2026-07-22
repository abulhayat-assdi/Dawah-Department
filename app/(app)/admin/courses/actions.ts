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

/** Adds a new named entry to the syllabus library, with an optional PDF. */
export async function createSyllabusDocument(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const url = String(formData.get("file_url") ?? "").trim() || null;

  const { data: maxRow } = await supabase
    .from("syllabus_documents")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = ((maxRow?.sort_order as number) ?? 0) + 1;

  await supabase.from("syllabus_documents").insert({ title, url, sort_order });
  revalidatePath("/admin/courses");
  revalidatePath("/academic");
}

/** Replaces the PDF attached to an existing syllabus library entry. */
export async function updateSyllabusDocumentFile(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const url = String(formData.get("file_url") ?? "").trim();
  if (!url) return;
  await supabase
    .from("syllabus_documents")
    .update({ url })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/courses");
  revalidatePath("/academic");
}

export async function deleteSyllabusDocument(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("syllabus_documents").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/courses");
  revalidatePath("/academic");
}

/** Topics belong to a course but are managed from a batch's detail page; an
 * optional batch_id lets us revalidate that page too (course_id alone can't
 * tell us which batch the admin was looking at). */
function revalidateTopicViews(formData: FormData, course_id: string) {
  revalidatePath(`/admin/courses/${course_id}`);
  const batch_id = formData.get("batch_id");
  if (batch_id) revalidatePath(`/admin/batches/${String(batch_id)}`);
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
  revalidateTopicViews(formData, course_id);
}

export async function deleteTopic(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const course_id = String(formData.get("course_id"));
  await supabase
    .from("syllabus_topics")
    .delete()
    .eq("id", String(formData.get("id")));
  revalidateTopicViews(formData, course_id);
}
