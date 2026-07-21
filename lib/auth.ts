import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile, UserRole } from "./types";
import { allRoles } from "./roles";

export { allRoles };

/** Returns the signed-in user's profile, or null if not authenticated. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data }, { data: extraRoleRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("profile_roles").select("role").eq("profile_id", user.id),
  ]);
  if (!data) return null;

  return {
    ...(data as Profile),
    extra_roles: (extraRoleRows ?? []).map((r) => r.role as UserRole),
  };
}

/** Like getProfile() but redirects to /login when unauthenticated. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Requires the super_admin role (primary or granted); redirects otherwise. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (!allRoles(profile).includes("super_admin")) redirect("/dashboard");
  return profile;
}

/**
 * Requires either the super_admin role (primary or granted) OR an explicit
 * per-user page grant for `href` (set from the Access Management page).
 * Redirects to /dashboard otherwise. Use for pages that are Super-Admin-only
 * by default but that the Super Admin can hand to an individual member,
 * page by page.
 */
export async function requirePageAccess(href: string): Promise<Profile> {
  const profile = await requireProfile();
  if (allRoles(profile).includes("super_admin")) return profile;
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_page_access")
    .select("href")
    .eq("profile_id", profile.id)
    .eq("href", href)
    .maybeSingle();
  if (!data) redirect("/dashboard");
  return profile;
}

/** Requires super_admin or coordinator (primary or granted); redirects otherwise. */
export async function requireCoordinatorOrAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  const roles = allRoles(profile);
  if (!roles.includes("super_admin") && !roles.includes("coordinator")) {
    redirect("/dashboard");
  }
  return profile;
}
