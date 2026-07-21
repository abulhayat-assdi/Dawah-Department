import type {
  BatchStatus,
  ExamStatus,
  RoutineClassType,
  TaskClassType,
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

export const TASK_CLASS_TYPE: Record<
  TaskClassType,
  {
    label: string;
    text: string;
    bg: string;
    /** Shows the Course dropdown when true (Form Verification). */
    needsCourse: boolean;
    /** Shows the Batch dropdown when true. */
    needsBatch: boolean;
    /** true = monthly quota (month + count); false = a plain dated task. */
    monthly: boolean;
    /** Label for the target-count input; only used when `monthly`. */
    countLabel: string;
  }
> = {
  quran: { label: "Quran Class", text: "text-brand-700", bg: "bg-brand-50", needsCourse: false, needsBatch: true, monthly: true, countLabel: "Classes to be taken this month" },
  dawah: { label: "Dawah Class", text: "text-blue-700", bg: "bg-blue-50", needsCourse: false, needsBatch: true, monthly: true, countLabel: "Classes to be taken this month" },
  staff: { label: "Staff Class", text: "text-purple-700", bg: "bg-purple-50", needsCourse: false, needsBatch: false, monthly: true, countLabel: "Classes to be taken this month" },
  other: { label: "Other Task", text: "text-slate-700", bg: "bg-slate-100", needsCourse: false, needsBatch: false, monthly: false, countLabel: "" },
  form_verification: { label: "Form Verification", text: "text-emerald-700", bg: "bg-emerald-50", needsCourse: true, needsBatch: true, monthly: true, countLabel: "Number of Forms to Verify" },
};

// Weekly routine grid: Saturday → Thursday (Friday is the holiday, hidden).
// `index` is what gets stored in campus_routines.quran_days / dawah_days.
export const DAYS_OF_WEEK: { index: number; label: string; short: string }[] = [
  { index: 0, label: "Saturday", short: "Sat" },
  { index: 1, label: "Sunday", short: "Sun" },
  { index: 2, label: "Monday", short: "Mon" },
  { index: 3, label: "Tuesday", short: "Tue" },
  { index: 4, label: "Wednesday", short: "Wed" },
  { index: 5, label: "Thursday", short: "Thu" },
];

// Styling + labels for the two routine class types (Quran / Dawah).
export const ROUTINE_CLASS_TYPE: Record<
  RoutineClassType,
  { label: string; text: string; bg: string; dot: string; ring: string }
> = {
  quran: {
    label: "Quran Class",
    text: "text-brand-700",
    bg: "bg-brand-50",
    dot: "bg-brand-500",
    ring: "ring-brand-200",
  },
  dawah: {
    label: "Dawah Class",
    text: "text-blue-700",
    bg: "bg-blue-50",
    dot: "bg-blue-500",
    ring: "ring-blue-200",
  },
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
  { href: "/admin/campuses", label: "Campuses & Courses", icon: "🏛️" },
  { href: "/admin/teachers", label: "Teachers / Members", icon: "👥" },
  { href: "/admin/courses", label: "Courses & Syllabus", icon: "📚" },
  { href: "/admin/batches", label: "Batch Management", icon: "🗂️" },
  { href: "/routine", label: "Campus Routine", icon: "🗓️" },
  { href: "/admin/tasks", label: "Task Management", icon: "✅" },
  { href: "/admin/task-report", label: "Task Report", icon: "📈" },
  { href: "/admin/amali", label: "Amali Checklist", icon: "📿" },
  { href: "/admin/reports", label: "Reports", icon: "📝" },
  { href: "/admin/teacher-resources", label: "Teacher Resources", icon: "🗄️" },
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
  { href: "/routine", label: "Campus Routine", icon: "🗓️" },
  { href: "/admin/tasks", label: "Task Management", icon: "✅" },
  { href: "/admin/task-report", label: "Task Report", icon: "📈" },
  { href: "/admin/amali", label: "Amali Checklist", icon: "📿" },
  { href: "/admin/reports", label: "Reports", icon: "📝" },
  { href: "/admin/teacher-resources", label: "Teacher Resources", icon: "🗄️" },
  { href: "/admin/feedback", label: "Feedback & Complaints", icon: "📨" },
];

export const TEACHER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/routine", label: "Campus Routine", icon: "🗓️" },
  { href: "/my/tasks", label: "My Tasks", icon: "✅" },
  { href: "/my/submissions", label: "Submit Class / Task", icon: "📤" },
  { href: "/my/resources", label: "My Resources", icon: "📁" },
  { href: "/admin/feedback", label: "Feedback & Complaints", icon: "📨" },
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
