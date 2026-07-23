import {
  ADMIN_NAV,
  ALL_PAGES,
  COORDINATOR_NAV,
  TEACHER_NAV,
  type NavItem,
} from "./constants";
import type { UserRole } from "./types";

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

function unionOfRoleNav(roles: UserRole[]): NavItem[] {
  const seen = new Map<string, NavItem>();
  for (const role of roles) {
    for (const item of NAV_BY_ROLE[role] ?? []) seen.set(item.href, item);
  }
  return withTeacherVariantsAfterSubmitTask(Array.from(seen.values()));
}

/**
 * The sidebar a profile actually gets, from its roles plus its per-page
 * Access Management grants. Single source of truth — used by the app layout
 * to render the sidebar and by lib/notify to work out who can even see the
 * page a notification points at.
 *
 *   • super_admin  → every page of every role it holds, no grants needed, so
 *                    a newly added page shows up without an Access edit;
 *   • has grants   → exactly the granted pages;
 *   • no grants    → the union of nav for every role it holds.
 */
export function resolveNavItems(roles: UserRole[], grants: string[]): NavItem[] {
  if (roles.includes("super_admin")) return unionOfRoleNav(roles);
  if (grants.length > 0) {
    const allowed = new Set(grants);
    return withTeacherVariantsAfterSubmitTask(
      ALL_PAGES.filter((item) => allowed.has(item.href)),
    );
  }
  return unionOfRoleNav(roles);
}

/**
 * Which sidebar entry a notification `link` (or the current pathname) belongs
 * to — the longest nav href the path sits under, so `/admin/batches/<id>`
 * counts against "Batch Management" while `/admin/task-report` never gets
 * swallowed by `/admin/tasks`. Returns null for links with no sidebar home
 * (e.g. `/messages`, `/my/report`), which therefore raise no badge.
 */
export function matchNavHref(
  link: string | null | undefined,
  navHrefs: string[],
): string | null {
  if (!link) return null;
  const path = link.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  let best: string | null = null;
  for (const href of navHrefs) {
    if (path !== href && !path.startsWith(`${href}/`)) continue;
    if (best === null || href.length > best.length) best = href;
  }
  return best;
}
