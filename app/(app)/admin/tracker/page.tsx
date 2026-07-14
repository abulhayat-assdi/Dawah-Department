import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader, StatCard } from "@/components/ui";
import { TrackerTable } from "@/components/tracker-table";
import { TrackerFilters } from "@/components/tracker-filters";
import { toBn } from "@/lib/utils";
import type { Campus, Course, CourseTrackerRow } from "@/lib/types";

export default async function TrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const campusId = String(sp.campus_id ?? "");
  const courseId = String(sp.course_id ?? "");

  const supabase = await createClient();
  const [{ data }, { data: campusData }, { data: courseData }] = await Promise.all([
    supabase.from("course_tracker").select("*").order("start_date", { ascending: false }),
    supabase.from("campuses").select("*").order("name"),
    supabase.from("courses").select("*").order("abbreviation"),
  ]);

  let rows = (data ?? []) as CourseTrackerRow[];
  if (campusId) rows = rows.filter((r) => r.campus_id === campusId);
  if (courseId) rows = rows.filter((r) => r.course_id === courseId);

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

      <Card>
        <TrackerFilters
          campuses={(campusData ?? []) as Campus[]}
          courses={(courseData ?? []) as Course[]}
          campusId={campusId}
          courseId={courseId}
        />
      </Card>

      <Card className="p-1">
        <TrackerTable rows={rows} />
      </Card>
    </div>
  );
}
