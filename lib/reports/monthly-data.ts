import { createClient } from "@/lib/supabase/server";
import type { CourseTrackerRow } from "@/lib/types";

export interface MemberSummary {
  teacher_id: string;
  name: string;
  days_reported: number;
  total_hours: number;
  total_counseling: number;
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

  const [{ data: teacherData }, { data: reportData }, { data: trackerData }] =
    await Promise.all([
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
    ]);

  const teachers = (teacherData ?? []) as { id: string; full_name: string }[];
  const reports = (reportData ?? []) as {
    teacher_id: string;
    work_hours: number;
    counseling_count: number;
  }[];

  const members: MemberSummary[] = teachers.map((t) => {
    const mine = reports.filter((r) => r.teacher_id === t.id);
    return {
      teacher_id: t.id,
      name: t.full_name || "—",
      days_reported: mine.length,
      total_hours: mine.reduce((s, r) => s + Number(r.work_hours || 0), 0),
      total_counseling: mine.reduce(
        (s, r) => s + Number(r.counseling_count || 0),
        0,
      ),
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
    tracker: (trackerData ?? []) as CourseTrackerRow[],
  };
}
