"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MAX_RESOURCE_SIZE_MB, isAllowedResource } from "@/lib/resources";

const BUCKET = "teacher-resources";
const MAX_BYTES = MAX_RESOURCE_SIZE_MB * 1024 * 1024;

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Remove an object from the resources bucket, ignoring failures. */
async function removeObject(supabase: Supabase, path: string | null | undefined) {
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

/**
 * Server-side guard mirroring the browser checks. If the freshly-uploaded file
 * violates the size/type limits we delete it (so a rejected upload never leaks
 * storage) and report failure.
 */
async function fileIsValid(
  supabase: Supabase,
  path: string,
  fileName: string | null,
  fileSize: number | null,
): Promise<boolean> {
  if (fileSize && fileSize > MAX_BYTES) {
    await removeObject(supabase, path);
    return false;
  }
  if (fileName && !isAllowedResource(fileName)) {
    await removeObject(supabase, path);
    return false;
  }
  return true;
}

function readFileFields(formData: FormData) {
  return {
    file_url: String(formData.get("file_url") ?? "").trim(),
    file_path: String(formData.get("file_path") ?? "").trim(),
    file_name: String(formData.get("file_name") ?? "").trim() || null,
    file_size: Number(formData.get("file_size") ?? 0) || null,
    file_type: String(formData.get("file_type") ?? "").trim() || null,
  };
}

/** Create a new resource. Requires an uploaded file. */
export async function createTeacherResource(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const file = readFileFields(formData);
  if (!name || !file.file_url || !file.file_path) return;

  if (!(await fileIsValid(supabase, file.file_path, file.file_name, file.file_size))) {
    return;
  }

  await supabase.from("teacher_resources").insert({
    teacher_id: profile.id,
    campus_id: String(formData.get("campus_id") ?? "") || null,
    name,
    comments: String(formData.get("comments") ?? "").trim() || null,
    file_url: file.file_url,
    file_path: file.file_path,
    file_name: file.file_name,
    file_size: file.file_size,
    file_type: file.file_type,
  });

  revalidatePath("/my/resources");
  revalidatePath("/admin/teacher-resources");
}

/**
 * Update a resource's details, optionally replacing its file. When a new file
 * is provided (a different storage path), the previously stored object is
 * deleted before the new path is saved — preventing storage bloat.
 */
export async function updateTeacherResource(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Ownership check (also enforced by RLS).
  const { data: existing } = await supabase
    .from("teacher_resources")
    .select("file_path")
    .eq("id", id)
    .eq("teacher_id", profile.id)
    .single();
  if (!existing) return;

  const update: Record<string, unknown> = {
    name: String(formData.get("name") ?? "").trim(),
    comments: String(formData.get("comments") ?? "").trim() || null,
    campus_id: String(formData.get("campus_id") ?? "") || null,
    updated_at: new Date().toISOString(),
  };
  if (!update.name) return;

  // A replacement file was uploaded when file_path is set and differs.
  const file = readFileFields(formData);
  if (file.file_path && file.file_path !== existing.file_path) {
    if (!(await fileIsValid(supabase, file.file_path, file.file_name, file.file_size))) {
      return;
    }
    // Delete the old object first, then persist the new path.
    await removeObject(supabase, existing.file_path as string);
    update.file_url = file.file_url;
    update.file_path = file.file_path;
    update.file_name = file.file_name;
    update.file_size = file.file_size;
    update.file_type = file.file_type;
  }

  await supabase
    .from("teacher_resources")
    .update(update)
    .eq("id", id)
    .eq("teacher_id", profile.id);

  revalidatePath("/my/resources");
  revalidatePath("/admin/teacher-resources");
}

/** Delete a resource and its stored file. */
export async function deleteTeacherResource(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { data: existing } = await supabase
    .from("teacher_resources")
    .select("file_path")
    .eq("id", id)
    .eq("teacher_id", profile.id)
    .single();
  if (!existing) return;

  await removeObject(supabase, existing.file_path as string);
  await supabase
    .from("teacher_resources")
    .delete()
    .eq("id", id)
    .eq("teacher_id", profile.id);

  revalidatePath("/my/resources");
  revalidatePath("/admin/teacher-resources");
}
