import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  PageHeader,
  Label,
  Input,
  Select,
  Button,
  EmptyState,
} from "@/components/ui";
import { TrackerTable } from "@/components/tracker-table";
import { createBatch } from "./actions";
import type { Course, CourseTrackerRow } from "@/lib/types";

export default async function BatchesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: tracker }, { data: courseData }] = await Promise.all([
    supabase.from("course_tracker").select("*").order("start_date", { ascending: false }),
    supabase.from("courses").select("*").order("abbreviation"),
  ]);
  const rows = (tracker ?? []) as CourseTrackerRow[];
  const courses = (courseData ?? []) as Course[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batch Management"
        subtitle="Start a new batch and assign teachers."
      />

      <Card>
        <CardHeader title="Start a New Batch" />
        <form action={createBatch} className="grid gap-3 p-5 md:grid-cols-3 lg:grid-cols-6">
          <div className="md:col-span-2">
            <Label htmlFor="course_id">Course</Label>
            <Select id="course_id" name="course_id" required defaultValue="">
              <option value="">— Select —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.abbreviation} — {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="batch_no">Batch No.</Label>
            <Input id="batch_no" name="batch_no" required placeholder="01" />
          </div>
          <div>
            <Label htmlFor="total_classes">Total Classes</Label>
            <Input id="total_classes" name="total_classes" type="number" defaultValue={0} />
          </div>
          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <Input id="start_date" name="start_date" type="date" />
          </div>
          <div>
            <Label htmlFor="dawah_end_date">Last Dawah Class</Label>
            <Input id="dawah_end_date" name="dawah_end_date" type="date" />
          </div>
          <div>
            <Label htmlFor="farewell_date">Farewell Date</Label>
            <Input id="farewell_date" name="farewell_date" type="date" />
          </div>
          <input type="hidden" name="status" value="ongoing" />
          <div className="md:col-span-3 lg:col-span-6">
            <Button type="submit">Add Batch</Button>
          </div>
        </form>
      </Card>

      <Card className="p-1">
        {rows.length === 0 ? (
          <EmptyState icon="🗂️" title="No batches yet" />
        ) : (
          <TrackerTable rows={rows} hrefBase="/admin/batches" />
        )}
      </Card>
    </div>
  );
}
