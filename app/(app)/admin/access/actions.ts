"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

const ROLE_PRIORITY: UserRole[] = ["super_admin", "coordinator", "teacher"];

/**
 * Replaces a user's full role set and page-access grant list. The
 * highest-priority checked role becomes `profiles.role` (the primary role,
 * still relied on by existing single-role reads like the teacher picker on
 * a batch's detail page); every other checked role is stored as an extra
 * grant in `profile_roles`.
 */
export async function updateUserAccess(
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const profileId = String(formData.get("profile_id"));

  const checkedRoles = formData.getAll("roles").map(String) as UserRole[];
  if (checkedRoles.length === 0) {
    return { error: "At least one role must stay selected." };
  }
  const primaryRole =
    ROLE_PRIORITY.find((r) => checkedRoles.includes(r)) ?? "teacher";
  const extraRoles = checkedRoles.filter((r) => r !== primaryRole);

  const { error: roleError } = await supabase
    .from("profiles")
    .update({ role: primaryRole })
    .eq("id", profileId);
  if (roleError) return { error: roleError.message };

  await supabase.from("profile_roles").delete().eq("profile_id", profileId);
  if (extraRoles.length) {
    const { error } = await supabase
      .from("profile_roles")
      .insert(extraRoles.map((role) => ({ profile_id: profileId, role })));
    if (error) return { error: error.message };
  }

  const pages = formData.getAll("pages").map(String);
  await supabase.from("user_page_access").delete().eq("profile_id", profileId);
  if (pages.length) {
    const { error } = await supabase
      .from("user_page_access")
      .insert(pages.map((href) => ({ profile_id: profileId, href })));
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/access");
  return { ok: true };
}
