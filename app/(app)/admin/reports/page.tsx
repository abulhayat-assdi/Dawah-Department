import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, PageHeader, EmptyState, StatCard } from "@/components/ui";
import { formatDate, toBn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

interface ReportRow {
  id: string;
  teacher_id: string;
  report_date: string;
  work_hours: number;
  counseling_count: number;
  topics_covered: string | null;
  summary: string | null;
}

export default async function ReportsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: reportData }, { data: teacherData }] = await Promise.all([
    supabase
      .from("daily_reports")
      .select("*")
      .order("report_date", { ascending: false })
      .limit(100),
    supabase.from("profiles").select("*").eq("role", "teacher"),
  ]);
  const reports = (reportData ?? []) as ReportRow[];
  const teachers = (teacherData ?? []) as Profile[];
  const name = (id: string) =>
    teachers.find((t) => t.id === id)?.full_name ?? "Unknown";

  const reportedToday = new Set(
    reports.filter((r) => r.report_date === today).map((r) => r.teacher_id),
  );
  const missing = teachers.filter((t) => !reportedToday.has(t.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Reports"
        subtitle="Reports submitted by members and today's status."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Members" value={toBn(teachers.length)} icon="👥" accent="brand" />
        <StatCard label="Reported Today" value={toBn(reportedToday.size)} icon="✅" accent="green" />
        <StatCard label="Still Pending" value={toBn(missing.length)} icon="⚠️" accent="red" />
      </div>

      {missing.length > 0 && (
        <Card>
          <CardHeader title="Members Who Haven't Reported Today" subtitle="A reminder can be sent to them" />
          <div className="flex flex-wrap gap-2 p-5">
            {missing.map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700"
              >
                {t.full_name}
              </span>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Recent Reports" />
        {reports.length === 0 ? (
          <EmptyState icon="📝" title="No reports submitted yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase text-slate-500">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3 text-center">Work Hours</th>
                  <th className="px-4 py-3 text-center">Counseling</th>
                  <th className="px-4 py-3">Topics / Summary</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50">
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(r.report_date)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {name(r.teacher_id)}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {toBn(r.work_hours)}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {toBn(r.counseling_count)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.topics_covered || r.summary || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
