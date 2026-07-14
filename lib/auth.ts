import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

/** Returns the signed-in user's profile, or null if not authenticated. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

/** Like getProfile() but redirects to /login when unauthenticated. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Requires the super_admin role; redirects teachers to their dashboard. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "super_admin") redirect("/dashboard");
  return profile;
}

/** Requires super_admin or coordinator; redirects teachers to their dashboard. */
export async function requireCoordinatorOrAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "super_admin" && profile.role !== "coordinator") {
    redirect("/dashboard");
  }
  return profile;
}
