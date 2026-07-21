import type {
  BatchStatus,
  ExamStatus,
  TaskStatus,
  UserRole,
} from "./types";

// English labels + Tailwind color classes for the status semantics in the spec.

export const EXAM_STATUS: Record<
  ExamStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  done: { label: "🟢 Completed", dot: "bg-green-500", text: "text-green-700", bg: "bg-green-50" },
  pending: { label: "🟡 Ongoing", dot: "bg-yellow-500", text: "text-yellow-700", bg: "bg-yellow-50" },
  none: { label: "🔴 Not held", dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
};

export const BATCH_STATUS: Record<
  BatchStatus,
  { label: string; text: string; bg: string }
> = {
  will_start: { label: "Upcoming", text: "text-blue-700", bg: "bg-blue-50" },
  ongoing: { label: "Ongoing", text: "text-brand-700", bg: "bg-brand-50" },
  completed: { label: "Completed", text: "text-green-700", bg: "bg-green-50" },
};

export const TASK_STATUS: Record<
  TaskStatus,
  { label: string; text: string; bg: string }
> = {
  todo: { label: "To do", text: "text-slate-700", bg: "bg-slate-100" },
  doing: { label: "In progress", text: "text-brand-700", bg: "bg-brand-50" },
  done: { label: "Done", text: "text-green-700", bg: "bg-green-50" },
};

export const PRIORITY_LABEL: Record<number, string> = {
  0: "Normal",
  1: "Important",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: "Super Admin",
  coordinator: "Campus Coordinator",
  teacher: "Teacher / Member",
};

export const COURSE_CATEGORY_LABEL: Record<string, string> = {
  alem: "Alem (scholar) students",
  general: "General students",
  common: "Both (scholars & general)",
};

// Sidebar navigation, keyed by role.
export interface NavItem {
  href: string;
  label: string;
  icon: string; // emoji keeps the bundle tiny; swap for an icon set later
}

export const ADMIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/admin/tracker", label: "Course Progress Tracker", icon: "📊" },
  { href: "/admin/campuses", label: "Campuses", icon: "🏛️" },
  { href: "/admin/teachers", label: "Teachers / Members", icon: "👥" },
  { href: "/admin/courses", label: "Courses & Syllabus", icon: "📚" },
  { href: "/admin/batches", label: "Batch Management", icon: "🗂️" },
  { href: "/admin/tasks", label: "Task Management", icon: "✅" },
  { href: "/admin/amali", label: "Amali Checklist", icon: "📿" },
  { href: "/admin/staff-tracker", label: "Staff Quran & Dawah Tracker", icon: "📖" },
  { href: "/admin/reports", label: "Reports", icon: "📝" },
  { href: "/admin/resources", label: "Resource Center", icon: "📁" },
  { href: "/admin/content", label: "Public Pages", icon: "🌐" },
  { href: "/admin/faculty", label: "Faculty (Public)", icon: "🧑‍🏫" },
  { href: "/admin/feedback", label: "Feedback & Complaints", icon: "📨" },
  { href: "/admin/access", label: "Access Management", icon: "🔐" },
];

// Campus Coordinators: scoped subset of ADMIN_NAV — no Campus/Course catalog
// management or public-site admin, but full batch/tracker/task/amali access
// within their assigned campus(es) (enforced by RLS, not just hidden nav).
export const COORDINATOR_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/admin/tracker", label: "Course Progress Tracker", icon: "📊" },
  { href: "/admin/teachers", label: "Teachers / Members", icon: "👥" },
  { href: "/admin/batches", label: "Batch Management", icon: "🗂️" },
  { href: "/admin/tasks", label: "Task Management", icon: "✅" },
  { href: "/admin/amali", label: "Amali Checklist", icon: "📿" },
  { href: "/admin/staff-tracker", label: "Staff Quran & Dawah Tracker", icon: "📖" },
  { href: "/admin/reports", label: "Reports", icon: "📝" },
];

export const TEACHER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/my/batches", label: "My Batches", icon: "🗂️" },
  { href: "/my/tasks", label: "My Tasks", icon: "✅" },
  { href: "/my/staff-tracker", label: "My Quran & Dawah", icon: "📖" },
  { href: "/my/report", label: "Daily Report", icon: "📝" },
  { href: "/my/profile", label: "My Profile", icon: "👤" },
];

// Deduped catalog of every known page (by href), used by the Access
// Management checkbox grid so the Super Admin can grant/revoke any page to
// any individual user regardless of role.
export const ALL_PAGES: NavItem[] = Array.from(
  new Map(
    [...ADMIN_NAV, ...COORDINATOR_NAV, ...TEACHER_NAV].map((item) => [
      item.href,
      item,
    ]),
  ).values(),
);
