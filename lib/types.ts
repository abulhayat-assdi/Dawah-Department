// Shared domain types mirroring the Supabase schema.

export type UserRole = "super_admin" | "coordinator" | "teacher";
export type CourseCategory = "alem" | "general" | "common";
export type BatchStatus = "will_start" | "ongoing" | "completed";
export type ExamStatus = "done" | "pending" | "none";
export type TopicStatus = "pending" | "done";
export type TaskStatus = "todo" | "doing" | "done";
export type TaskClassType =
  | "quran"
  | "dawah"
  | "staff"
  | "other"
  | "form_verification";
export type AssessmentType = "entry" | "peer" | "exit";
export type ResourceType = "slide" | "pdf" | "book" | "link" | "video";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  /** Extra roles granted via the Access Management page, on top of `role` (the primary role). */
  extra_roles: UserRole[];
  designation: string | null;
  phone: string | null;
  location: string | null;
  photo_url: string | null;
  bio: string | null;
  background: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Campus {
  id: string;
  name: string;
  slug: string | null;
  address: string | null;
  description: string | null;
  image_url: string | null;
}

export interface Faculty {
  id: string;
  name: string;
  designation: string | null;
  photo_url: string | null;
  background: string | null;
  location: string | null;
  bio: string | null;
  featured: boolean;
  sort: number;
}

export interface Course {
  id: string;
  name: string;
  abbreviation: string;
  campus_id: string | null;
  category: CourseCategory;
  duration_label: string | null;
  default_total_classes: number;
  description: string | null;
}

export interface Batch {
  id: string;
  course_id: string;
  campus_id: string | null;
  batch_no: string;
  duration_label: string | null;
  start_date: string | null;
  expected_end_date: string | null;
  dawah_end_date: string | null;
  farewell_date: string | null;
  total_classes: number;
  completed_classes: number;
  active_student_count: number;
  midterm_status: ExamStatus;
  final_status: ExamStatus;
  status: BatchStatus;
  note: string | null;
}

/** Row shape of the `course_tracker` SQL view. */
export interface CourseTrackerRow {
  batch_id: string;
  course_id: string;
  course_info: string;
  course_name: string;
  campus_id: string | null;
  campus_name: string | null;
  batch_no: string;
  duration_label: string | null;
  start_date: string | null;
  total_classes: number;
  completed_classes: number;
  remaining_classes: number;
  progress_pct: number;
  midterm_status: ExamStatus;
  final_status: ExamStatus;
  status: BatchStatus;
  expected_end_date: string | null;
  farewell_date: string | null;
  days_left: number | null;
  projected_days_left: number | null;
}

export type ScheduleSource = "csv" | "manual";
export type ScheduleStatus = "pending" | "done" | "schedule_changed";

export interface ClassScheduleEntry {
  id: string;
  batch_id: string;
  teacher_id: string;
  class_date: string;
  topic_id: string | null;
  topic_label: string | null;
  source: ScheduleSource;
  status: ScheduleStatus;
  class_log_id: string | null;
}

export type SessionStatus = "scheduled" | "done" | "missed";

export interface StaffQuranSession {
  id: string;
  staff_id: string;
  campus_id: string;
  scheduled_date: string;
  status: SessionStatus;
  attendance: boolean;
  note: string | null;
}

export interface DawahCounselingSession {
  id: string;
  staff_id: string;
  campus_id: string;
  session_date: string;
  counselee_note: string | null;
  status: SessionStatus;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  campus_id: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  status: TaskStatus;
  priority: number;
  due_date: string | null;
  /** Category of the allocation; null for legacy/plain tasks. */
  class_type: TaskClassType | null;
  /** Target course for a Form-Verification allocation; null otherwise. */
  course_id: string | null;
  /** Target batch for a Quran/Dawah/Form-Verification allocation; null otherwise. */
  batch_id: string | null;
  /** Monthly class/task/form quota assigned to the member. */
  target_count: number;
  /** Month a monthly quota applies to, as "YYYY-MM"; null for "other" tasks. */
  target_month: string | null;
}

/** A teacher-submitted class update or completed task (see task_submissions). */
export interface TaskSubmission {
  id: string;
  /** Allocation this fulfils; null for an ad-hoc/additional class. */
  task_id: string | null;
  teacher_id: string;
  class_type: TaskClassType;
  campus_id: string | null;
  course_id: string | null;
  batch_id: string | null;
  /** Class date / completion date. */
  submission_date: string;
  /** Denormalised "YYYY-MM" of submission_date, for monthly aggregation. */
  target_month: string | null;
  topic: string | null;
  comments: string | null;
  /** True when submitted for a batch outside the teacher's allocation. */
  is_additional: boolean;
  /** Form Verification: number of forms verified in this submission. */
  verified_count: number;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
}

/** The class type of a routine session in the weekly grid. */
export type RoutineClassType = "quran" | "dawah";

/**
 * One weekly routine record per batch (see campus_routines). Holds the Quran
 * and Dawah class timings and the weekdays each runs on (0 = Saturday … 5 =
 * Thursday). `*_start`/`*_end` are "HH:MM:SS" time strings from Postgres.
 */
export interface CampusRoutine {
  id: string;
  batch_id: string;
  campus_id: string | null;
  quran_start: string | null;
  quran_end: string | null;
  quran_days: number[];
  dawah_start: string | null;
  dawah_end: string | null;
  dawah_days: number[];
  note: string | null;
  updated_at: string;
}

/** A teacher's private uploaded document/asset (see teacher_resources). */
export interface TeacherResource {
  id: string;
  teacher_id: string;
  campus_id: string | null;
  name: string;
  comments: string | null;
  /** Public URL of the stored file. */
  file_url: string;
  /** Storage object key within the `teacher-resources` bucket (for overwrite/delete). */
  file_path: string;
  file_name: string | null;
  /** Size in bytes. */
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyReport {
  id: string;
  teacher_id: string;
  report_date: string;
  work_hours: number;
  counseling_count: number;
  topics_covered: string | null;
  summary: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AmaliItem {
  id: string;
  title: string;
  sequence: number;
  is_active: boolean;
  campus_id: string | null;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  body: string | null;
  audio_url: string | null;
  file_url: string | null;
  file_name: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Notice {
  id: string;
  title: string;
  body: string | null;
  campus_id: string | null;
  campus: { name: string } | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
