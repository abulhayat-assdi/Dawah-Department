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

export const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: "Super Admin (Coordinator)",
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
  { href: "/admin/reports", label: "Reports", icon: "📝" },
  { href: "/admin/resources", label: "Resource Center", icon: "📁" },
  { href: "/admin/feedback", label: "Feedback & Complaints", icon: "📨" },
];

export const TEACHER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/my/batches", label: "My Batches", icon: "🗂️" },
  { href: "/my/tasks", label: "My Tasks", icon: "✅" },
  { href: "/my/report", label: "Daily Report", icon: "📝" },
  { href: "/my/profile", label: "My Profile", icon: "👤" },
];
