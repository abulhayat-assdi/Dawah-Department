"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createTeacher(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const full_name = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "teacher");

  // Create the auth user; the on_auth_user_created trigger inserts the profile.
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  });

  if (error || !data.user) {
    return { error: error?.message ?? "Failed to create the account." };
  }

  // Fill in the rest of the profile via the service-role client.
  await admin
    .from("profiles")
    .update({
      full_name,
      role,
      designation: String(formData.get("designation") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      location: String(formData.get("location") ?? "").trim() || null,
    })
    .eq("id", data.user.id);

  const campusIds = formData.getAll("campus_ids").map(String).filter(Boolean);
  if (campusIds.length) {
    await admin.from("teacher_campuses").insert(
      campusIds.map((campus_id) => ({ teacher_id: data.user!.id, campus_id })),
    );
  }

  revalidatePath("/admin/teachers");
  return { ok: true };
}

export async function toggleTeacherActive(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const active = String(formData.get("active")) === "true";
  await supabase.from("profiles").update({ is_active: !active }).eq("id", id);
  revalidatePath("/admin/teachers");
}

/** Edit an existing member's full profile, role and campus assignments. */
export async function updateTeacher(
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  const id = String(formData.get("id"));

  const { error } = await admin
    .from("profiles")
    .update({
      full_name: String(formData.get("full_name") ?? "").trim(),
      role: String(formData.get("role") ?? "teacher"),
      designation: String(formData.get("designation") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      location: String(formData.get("location") ?? "").trim() || null,
      background: String(formData.get("background") ?? "").trim() || null,
      bio: String(formData.get("bio") ?? "").trim() || null,
      photo_url: String(formData.get("photo_url") ?? "").trim() || null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  // Replace campus assignments with the submitted set.
  const campusIds = formData.getAll("campus_ids").map(String).filter(Boolean);
  await admin.from("teacher_campuses").delete().eq("teacher_id", id);
  if (campusIds.length) {
    await admin
      .from("teacher_campuses")
      .insert(campusIds.map((campus_id) => ({ teacher_id: id, campus_id })));
  }

  revalidatePath("/admin/teachers");
  revalidatePath(`/admin/teachers/${id}`);
  return { ok: true };
}

export async function resetTeacherPassword(
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  const { error } = await admin.auth.admin.updateUserById(id, { password });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteTeacher(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  // Deletes the auth user; the profile row cascades via its FK.
  await admin.auth.admin.deleteUser(id);
  revalidatePath("/admin/teachers");
  redirect("/admin/teachers");
}
