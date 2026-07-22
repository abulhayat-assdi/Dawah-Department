import { requireProfile, allRoles } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { ADMIN_NAV, COORDINATOR_NAV, TEACHER_NAV, ALL_PAGES } from "@/lib/constants";
import type { NavItem } from "@/lib/constants";

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  super_admin: ADMIN_NAV,
  coordinator: COORDINATOR_NAV,
  teacher: TEACHER_NAV,
};

// Teacher-only href variants of pages that also have an admin/coordinator
// href (Weekly Lesson Plan, Teacher Resources). When a profile holds
// multiple roles, these get merged in after every other role's pages —
// pull them up to sit right after "Submit Class Task" instead of trailing
// at the very bottom of the sidebar.
const SUBMIT_CLASS_TASK_HREF = "/my/submissions";
const TEACHER_ONLY_VARIANT_HREFS = new Set(["/my/lesson-plan", "/my/resources"]);

function withTeacherVariantsAfterSubmitTask(items: NavItem[]): NavItem[] {
  const extras = items.filter((item) => TEACHER_ONLY_VARIANT_HREFS.has(item.href));
  if (extras.length === 0) return items;
  const rest = items.filter((item) => !TEACHER_ONLY_VARIANT_HREFS.has(item.href));
  const anchor = rest.findIndex((item) => item.href === SUBMIT_CLASS_TASK_HREF);
  if (anchor === -1) return items;
  return [...rest.slice(0, anchor + 1), ...extras, ...rest.slice(anchor + 1)];
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  let nav: NavItem[];
  if (allRoles(profile).includes("super_admin")) {
    // Super Admin always has every page — current and future — with no
    // per-page grants needed. Skip the grants lookup entirely so a newly
    // added page shows up immediately without an Access Management edit.
    // Union in the nav of any other role the profile also holds (e.g.
    // Teacher/Member) so their role-specific pages — My Tasks, Submit
    // Class/Task, My Resources, My Profile — stay in the sidebar too.
    const seen = new Map<string, NavItem>();
    for (const role of allRoles(profile)) {
      for (const item of NAV_BY_ROLE[role] ?? []) {
        seen.set(item.href, item);
      }
    }
    nav = withTeacherVariantsAfterSubmitTask(Array.from(seen.values()));
  } else {
    const { data: grants } = await supabase
      .from("user_page_access")
      .select("href")
      .eq("profile_id", profile.id);

    if (grants && grants.length > 0) {
      const allowed = new Set(grants.map((g) => g.href as string));
      nav = withTeacherVariantsAfterSubmitTask(
        ALL_PAGES.filter((item) => allowed.has(item.href)),
      );
    } else {
      // No explicit grants yet — fall back to the union of nav for every
      // role this profile holds (primary role + Access-Management extras).
      const seen = new Map<string, NavItem>();
      for (const role of allRoles(profile)) {
        for (const item of NAV_BY_ROLE[role] ?? []) {
          seen.set(item.href, item);
        }
      }
      nav = withTeacherVariantsAfterSubmitTask(Array.from(seen.values()));
    }
  }

  return (
    <AppShell profile={profile} navHrefs={nav.map((item) => item.href)}>
      {children}
    </AppShell>
  );
}
