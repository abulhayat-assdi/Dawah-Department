import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader, StatCard } from "@/components/ui";
import { TrackerTable } from "@/components/tracker-table";
import { toBn } from "@/lib/utils";
import type { CourseTrackerRow } from "@/lib/types";

export default async function TrackerPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("course_tracker")
    .select("*")
    .order("start_date", { ascending: false });

  const rows = (data ?? []) as CourseTrackerRow[];
  const completed = rows.filter((r) => r.status === "completed").length;
  const ongoing = rows.filter((r) => r.status === "ongoing").length;
  const upcoming = rows.filter((r) => r.status === "will_start").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Progress Tracker"
        subtitle="Progress of every batch across every campus, in one table."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Batches" value={toBn(rows.length)} icon="🗂️" accent="brand" />
        <StatCard label="Ongoing" value={toBn(ongoing)} icon="📊" accent="yellow" />
        <StatCard label="Completed" value={toBn(completed)} icon="✅" accent="green" />
        <StatCard label="Upcoming" value={toBn(upcoming)} icon="🕒" accent="blue" />
      </div>

      <Card className="p-1">
        <TrackerTable rows={rows} />
      </Card>
    </div>
  );
}
