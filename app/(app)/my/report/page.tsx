import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  PageHeader,
  Label,
  Input,
  Textarea,
  Button,
  EmptyState,
} from "@/components/ui";
import { formatDate, toBn } from "@/lib/utils";
import { submitReport } from "./actions";

interface ReportRow {
  id: string;
  report_date: string;
  work_hours: number;
  counseling_count: number;
  topics_covered: string | null;
  summary: string | null;
}

export default async function MyReportPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: todayReport }, { data: history }] = await Promise.all([
    supabase
      .from("daily_reports")
      .select("*")
      .eq("teacher_id", profile.id)
      .eq("report_date", today)
      .maybeSingle(),
    supabase
      .from("daily_reports")
      .select("*")
      .eq("teacher_id", profile.id)
      .order("report_date", { ascending: false })
      .limit(14),
  ]);
  const r = todayReport as ReportRow | null;
  const rows = (history ?? []) as ReportRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Report"
        subtitle="Submit each day's work hours, counseling and topics covered."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Today's Report"
            subtitle={r ? "Already submitted — you can update it" : "Submit today's report"}
          />
          <form action={submitReport} className="space-y-4 p-5">
            <input type="hidden" name="report_date" value={today} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="work_hours">Work Hours</Label>
                <Input
                  id="work_hours"
                  name="work_hours"
                  type="number"
                  step="0.5"
                  defaultValue={r?.work_hours ?? 0}
                />
              </div>
              <div>
                <Label htmlFor="counseling_count">Counseling Count</Label>
                <Input
                  id="counseling_count"
                  name="counseling_count"
                  type="number"
                  defaultValue={r?.counseling_count ?? 0}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="topics_covered">Topics Covered</Label>
              <Textarea
                id="topics_covered"
                name="topics_covered"
                defaultValue={r?.topics_covered ?? ""}
                className="min-h-16"
              />
            </div>
            <div>
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                name="summary"
                defaultValue={r?.summary ?? ""}
              />
            </div>
            <Button type="submit" className="w-full">
              {r ? "Update" : "Submit Report"}
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Last 14 Days" />
          {rows.length === 0 ? (
            <EmptyState icon="📝" title="No reports" />
          ) : (
            <ul className="divide-y divide-slate-50">
              {rows.map((h) => (
                <li key={h.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">
                      {formatDate(h.report_date)}
                    </span>
                    <span className="text-xs text-slate-400">
                      ⏱ {toBn(h.work_hours)} hrs · 🤝 {toBn(h.counseling_count)}
                    </span>
                  </div>
                  {h.topics_covered && (
                    <p className="mt-0.5 text-sm text-slate-500">
                      {h.topics_covered}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
