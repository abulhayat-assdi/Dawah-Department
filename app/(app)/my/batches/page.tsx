import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { TrackerTable } from "@/components/tracker-table";
import type { CourseTrackerRow } from "@/lib/types";

export default async function MyBatchesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("batch_teachers")
    .select("batch_id")
    .eq("teacher_id", profile.id);
  const ids = (assignments ?? []).map((a) => a.batch_id);

  const { data } = ids.length
    ? await supabase.from("course_tracker").select("*").in("batch_id", ids)
    : { data: [] };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Batches"
        subtitle="Progress of the batches under your responsibility — click a course to update."
      />
      <Card className="p-1">
        <TrackerTable
          rows={(data ?? []) as CourseTrackerRow[]}
          hrefBase="/my/batches"
        />
      </Card>
    </div>
  );
}
