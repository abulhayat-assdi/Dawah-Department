import type { Profile, UserRole } from "./types";

/** All roles a profile has: its primary role plus any Access-Management grants. */
export function allRoles(profile: Profile): UserRole[] {
  return Array.from(new Set([profile.role, ...profile.extra_roles]));
}
