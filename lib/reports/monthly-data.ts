import { createClient } from "@/lib/supabase/server";
import type { CourseTrackerRow } from "@/lib/types";

export interface MemberSummary {
  teacher_id: string;
  name: string;
  days_reported: number;
  total_hours: number;
  total_counseling: number;
  classes_taken: number;
  batches: string[];
}

export interface MonthlyReport {
  month: string; // "YYYY-MM"
  monthLabel: string; // e.g. "June 2026"
  generatedAt: string;
  members: MemberSummary[];
  totals: { hours: number; counseling: number; reports: number };
  tracker: CourseTrackerRow[];
}

/** First and last ISO date of a "YYYY-MM" month. */
function monthRange(month: string): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0)); // day 0 of next month = last day
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

/**
 * Aggregate a month's activity for the monthly export. Must be called from an
 * admin context (the route guards with requireAdmin) so RLS returns all rows.
 */
export async function getMonthlyReport(month: string): Promise<MonthlyReport> {
  const supabase = await createClient();
  const { start, end } = monthRange(month);

  const [
    { data: teacherData },
    { data: reportData },
    { data: trackerData },
    { data: classLogData },
    { data: assignmentData },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "teacher")
      .eq("is_active", true),
    supabase
      .from("daily_reports")
      .select("teacher_id, work_hours, counseling_count")
      .gte("report_date", start)
      .lte("report_date", end),
    supabase.from("course_tracker").select("*").order("course_info"),
    supabase
      .from("class_logs")
      .select("teacher_id")
      .gte("class_date", start)
      .lte("class_date", end)
      .eq("confirmed", true),
    supabase.from("batch_teachers").select("teacher_id, batch_id"),
  ]);

  const teachers = (teacherData ?? []) as { id: string; full_name: string }[];
  const reports = (reportData ?? []) as {
    teacher_id: string;
    work_hours: number;
    counseling_count: number;
  }[];
  const classLogs = (classLogData ?? []) as { teacher_id: string }[];
  const assignments = (assignmentData ?? []) as {
    teacher_id: string;
    batch_id: string;
  }[];
  const tracker = (trackerData ?? []) as CourseTrackerRow[];
  const batchLabel = new Map(
    tracker.map((t) => [t.batch_id, `${t.course_info}-${t.batch_no}`]),
  );

  const members: MemberSummary[] = teachers.map((t) => {
    const mine = reports.filter((r) => r.teacher_id === t.id);
    const myBatchIds = assignments
      .filter((a) => a.teacher_id === t.id)
      .map((a) => a.batch_id);
    return {
      teacher_id: t.id,
      name: t.full_name || "—",
      days_reported: mine.length,
      total_hours: mine.reduce((s, r) => s + Number(r.work_hours || 0), 0),
      total_counseling: mine.reduce(
        (s, r) => s + Number(r.counseling_count || 0),
        0,
      ),
      classes_taken: classLogs.filter((l) => l.teacher_id === t.id).length,
      batches: myBatchIds.map((id) => batchLabel.get(id) ?? "—"),
    };
  });

  const totals = {
    hours: members.reduce((s, m) => s + m.total_hours, 0),
    counseling: members.reduce((s, m) => s + m.total_counseling, 0),
    reports: reports.length,
  };

  const monthLabel = new Date(`${month}-01T00:00:00Z`).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return {
    month,
    monthLabel,
    generatedAt: new Date().toISOString().slice(0, 10),
    members,
    totals,
    tracker,
  };
}

/** Rolls a full year's monthly reports up into per-month + yearly totals. */
export interface YearlyReport {
  year: string;
  generatedAt: string;
  monthly: { month: string; monthLabel: string; hours: number; counseling: number; classes: number; reports: number }[];
  totals: { hours: number; counseling: number; classes: number; reports: number };
}

export async function getYearlyReport(year: string): Promise<YearlyReport> {
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const reports = await Promise.all(months.map((m) => getMonthlyReport(m)));

  const monthly = reports.map((r) => ({
    month: r.month,
    monthLabel: r.monthLabel,
    hours: r.totals.hours,
    counseling: r.totals.counseling,
    classes: r.members.reduce((s, m) => s + m.classes_taken, 0),
    reports: r.totals.reports,
  }));

  const totals = monthly.reduce(
    (acc, m) => ({
      hours: acc.hours + m.hours,
      counseling: acc.counseling + m.counseling,
      classes: acc.classes + m.classes,
      reports: acc.reports + m.reports,
    }),
    { hours: 0, counseling: 0, classes: 0, reports: 0 },
  );

  return {
    year,
    generatedAt: new Date().toISOString().slice(0, 10),
    monthly,
    totals,
  };
}
