import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, PageHeader, EmptyState } from "@/components/ui";
import { TrackerTable } from "@/components/tracker-table";
import type { Campus, CourseTrackerRow } from "@/lib/types";

export default async function CampusGatewayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: campus } = await supabase
    .from("campuses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!campus) notFound();

  // Courses of this campus → their batches via the tracker view.
  const { data: courses } = await supabase
    .from("courses")
    .select("id")
    .eq("campus_id", id);
  const courseIds = (courses ?? []).map((c) => c.id as string);

  const { data: trackerData } = courseIds.length
    ? await supabase
        .from("course_tracker")
        .select("*")
        .in("course_id", courseIds)
        .order("status")
    : { data: [] as CourseTrackerRow[] };
  const tracker = (trackerData ?? []) as CourseTrackerRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title={(campus as Campus).name}
        subtitle={(campus as Campus).address || "Campus dawah progress"}
        action={
          <Link
            href="/admin/campuses"
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ← All campuses
          </Link>
        }
      />

      <Card>
        <CardHeader
          title="Batches & Dawah Progress"
          subtitle="Click a course to open its batch tracker"
        />
        {tracker.length === 0 ? (
          <EmptyState
            icon="🗂️"
            title="No batches in this campus yet"
            hint="Add courses and batches for this campus to see progress here."
          />
        ) : (
          <TrackerTable rows={tracker} />
        )}
      </Card>
    </div>
  );
}
