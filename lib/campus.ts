import type { createClient } from "./supabase/server";
import { allRoles } from "./roles";
import type { Profile } from "./types";

type Db = Awaited<ReturnType<typeof createClient>>;

/**
 * The campus a Super Admin's own submissions are attributed to.
 *
 * Super Admins are linked to every campus (or to none), so unlike a teacher
 * they have no single "their" campus to derive one from. Named rather than
 * hard-coded by id because campus ids differ per environment.
 */
export const ADMIN_DEFAULT_CAMPUS_NAME = "কাজী বাড়ি ক্যাম্পাস";

/**
 * The campus to stamp on something a member submits.
 *
 * `preferred` is the campus the submission itself implies — the selected
 * batch's or course's campus, or the campus of the allocation it fulfils — and
 * always wins. It is null for a Staff class submitted without a matching
 * allocation, which is exactly the case that used to leave `campus_id` null.
 *
 * That mattered because RLS scopes coordinator reads by `campus_id`
 * (`tsub_coordinator_read` in supabase/07_task_submissions.sql): a null campus
 * is visible to Super Admins but to no coordinator, so those submissions
 * silently vanished from the Task Report of the very people meant to review
 * them. Falling back to the submitter's own campus keeps every submission in
 * exactly one coordinator's scope.
 */
export async function resolveSubmitterCampus(
  supabase: Db,
  profile: Profile,
  preferred: string | null,
): Promise<string | null> {
  if (preferred) return preferred;

  if (allRoles(profile).includes("super_admin")) {
    const { data } = await supabase
      .from("campuses")
      .select("id")
      .eq("name", ADMIN_DEFAULT_CAMPUS_NAME)
      .maybeSingle();
    if (data?.id) return data.id as string;
  }

  const { data: links } = await supabase
    .from("teacher_campuses")
    .select("campus_id")
    .eq("teacher_id", profile.id);
  return (links?.[0]?.campus_id as string | undefined) ?? null;
}
