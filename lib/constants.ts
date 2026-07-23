import type {
  BatchStatus,
  ExamStatus,
  RoutineClassType,
  TaskClassType,
  TaskStatus,
  UserRole,
} from "./types";
import {
  LayoutDashboard,
  LineChart,
  ClipboardList,
  FileBarChart,
  ListChecks,
  CalendarDays,
  NotebookPen,
  BookOpenCheck,
  UploadCloud,
  FolderKanban,
  BookOpen,
  Building2,
  GraduationCap,
  FileSpreadsheet,
  Globe,
  Users2,
  MessageSquareWarning,
  ShieldCheck,
  Users,
  UserCircle2,
  type LucideIcon,
} from "lucide-react";

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
  quran: { label: "Quran Class", text: "text-brand-700", bg: "bg-brand-50", needsCourse: true, needsBatch: true, monthly: true, countLabel: "Classes to be taken this month" },
  dawah: { label: "Dawah Class", text: "text-blue-700", bg: "bg-blue-50", needsCourse: true, needsBatch: true, monthly: true, countLabel: "Classes to be taken this month" },
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

// Week numbers offered by the Weekly Lesson Plan module's week selector.
export const LESSON_PLAN_WEEKS = [1, 2, 3, 4, 5];

// Sidebar navigation, keyed by role. Order follows the fixed 1–19 spec —
// do not resort alphabetically or by feature area. The Weekly Lesson Plan
// entry is separate in-progress work (not part of the numbered spec) kept
// in its existing slot, right after Campus Routine, for every role.
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_1_DASHBOARD: NavItem = { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard };
const NAV_2_TRACKER: NavItem = { href: "/admin/tracker", label: "Course Progress Tracker", icon: LineChart };
const NAV_3_TASKS: NavItem = { href: "/admin/tasks", label: "Task Management", icon: ClipboardList };
const NAV_4_TASK_REPORT: NavItem = { href: "/admin/task-report", label: "Task Report", icon: FileBarChart };
const NAV_5_MY_TASKS: NavItem = { href: "/my/tasks", label: "My Tasks", icon: ListChecks };
const NAV_6_ROUTINE: NavItem = { href: "/routine", label: "Campus Routine", icon: CalendarDays };
const NAV_LESSON_PLAN_ADMIN: NavItem = { href: "/admin/lesson-plan", label: "Weekly Lesson Plan", icon: NotebookPen };
const NAV_LESSON_PLAN_TEACHER: NavItem = { href: "/my/lesson-plan", label: "Weekly Lesson Plan", icon: NotebookPen };
const NAV_7_AMALI: NavItem = { href: "/admin/amali", label: "Amali Checklist", icon: BookOpenCheck };
const NAV_8_SUBMIT_CLASS_TASK: NavItem = { href: "/my/submissions", label: "Submit Class Task", icon: UploadCloud };
const NAV_9_BATCHES: NavItem = { href: "/admin/batches", label: "Batch Management", icon: FolderKanban };
const NAV_10_TEACHER_RESOURCES_ADMIN: NavItem = { href: "/admin/teacher-resources", label: "Teacher Resources", icon: BookOpen };
const NAV_10_TEACHER_RESOURCES_TEACHER: NavItem = { href: "/my/resources", label: "Teacher Resources", icon: BookOpen };
const NAV_11_CAMPUSES: NavItem = { href: "/admin/campuses", label: "Campuses & Courses", icon: Building2 };
const NAV_12_COURSES: NavItem = { href: "/admin/courses", label: "Course & Syllabus", icon: GraduationCap };
const NAV_13_REPORTS: NavItem = { href: "/admin/reports", label: "Reports", icon: FileSpreadsheet };
const NAV_14_CONTENT: NavItem = { href: "/admin/content", label: "Public Pages", icon: Globe };
const NAV_15_FACULTY: NavItem = { href: "/admin/faculty", label: "Faculty (Public)", icon: Users2 };
const NAV_16_FEEDBACK: NavItem = { href: "/admin/feedback", label: "Feedback & Complaints", icon: MessageSquareWarning };
const NAV_17_ACCESS: NavItem = { href: "/admin/access", label: "Access Management", icon: ShieldCheck };
const NAV_18_TEACHERS: NavItem = { href: "/admin/teachers", label: "Teachers / Members", icon: Users };
const NAV_19_PROFILE: NavItem = { href: "/my/profile", label: "My Profile", icon: UserCircle2 };

// Super Admin: all 19 spec links, in strict order, full read/write.
export const ADMIN_NAV: NavItem[] = [
  NAV_1_DASHBOARD,
  NAV_2_TRACKER,
  NAV_3_TASKS,
  NAV_4_TASK_REPORT,
  NAV_5_MY_TASKS,
  NAV_6_ROUTINE,
  NAV_LESSON_PLAN_ADMIN,
  NAV_7_AMALI,
  NAV_8_SUBMIT_CLASS_TASK,
  NAV_9_BATCHES,
  NAV_10_TEACHER_RESOURCES_ADMIN,
  NAV_11_CAMPUSES,
  NAV_12_COURSES,
  NAV_13_REPORTS,
  NAV_14_CONTENT,
  NAV_15_FACULTY,
  NAV_16_FEEDBACK,
  NAV_17_ACCESS,
  NAV_18_TEACHERS,
  NAV_19_PROFILE,
];

// Campus/Shed Coordinators: the Teacher/Member subset plus Task Management,
// Task Report, Batch Management, Reports and Faculty (Public), scoped to
// their assigned campus(es) via RLS — not just hidden nav.
export const COORDINATOR_NAV: NavItem[] = [
  NAV_1_DASHBOARD,
  NAV_3_TASKS,
  NAV_4_TASK_REPORT,
  NAV_5_MY_TASKS,
  NAV_6_ROUTINE,
  NAV_LESSON_PLAN_ADMIN,
  NAV_7_AMALI,
  NAV_8_SUBMIT_CLASS_TASK,
  NAV_9_BATCHES,
  NAV_10_TEACHER_RESOURCES_ADMIN,
  NAV_12_COURSES,
  NAV_13_REPORTS,
  NAV_15_FACULTY,
  NAV_19_PROFILE,
];

// Teachers / Regular Members: only their own working set.
export const TEACHER_NAV: NavItem[] = [
  NAV_1_DASHBOARD,
  NAV_5_MY_TASKS,
  NAV_6_ROUTINE,
  NAV_LESSON_PLAN_TEACHER,
  NAV_7_AMALI,
  NAV_8_SUBMIT_CLASS_TASK,
  NAV_10_TEACHER_RESOURCES_TEACHER,
  NAV_12_COURSES,
  NAV_19_PROFILE,
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
