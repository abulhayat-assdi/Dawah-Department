import Link from "next/link";
import { requireCoordinatorOrAdmin, allRoles } from "@/lib/auth";
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
import type { Campus, Course, CourseTrackerRow } from "@/lib/types";

export default async function BatchesPage() {
  const profile = await requireCoordinatorOrAdmin();
  const isSuperAdmin = allRoles(profile).includes("super_admin");
  const supabase = await createClient();

  let campusIds: string[] | null = null; // null = every campus (super_admin)
  if (profile.role === "coordinator") {
    const { data } = await supabase
      .from("teacher_campuses")
      .select("campus_id")
      .eq("teacher_id", profile.id);
    campusIds = (data ?? []).map((r) => r.campus_id as string);
  }

  const [{ data: campusData }, { data: courseData }] = await Promise.all([
    campusIds
      ? campusIds.length
        ? supabase.from("campuses").select("*").in("id", campusIds).order("name")
        : Promise.resolve({ data: [] as Campus[] })
      : supabase.from("campuses").select("*").order("name"),
    supabase.from("courses").select("*").order("abbreviation"),
  ]);
  const campuses = (campusData ?? []) as Campus[];
  const courses = (courseData ?? []) as Course[];
  const scopedCampusIds = campuses.map((c) => c.id);

  // Coordinators only see batches in their own campus(es); super_admin sees
  // everything, including legacy batches with no campus_id assigned yet.
  const { data: tracker } =
    profile.role === "coordinator"
      ? scopedCampusIds.length
        ? await supabase
            .from("course_tracker")
            .select("*")
            .in("campus_id", scopedCampusIds)
            .order("start_date", { ascending: false })
        : { data: [] as CourseTrackerRow[] }
      : await supabase
          .from("course_tracker")
          .select("*")
          .order("start_date", { ascending: false });
  const rows = (tracker ?? []) as CourseTrackerRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batch Management"
        subtitle="Start a new batch and assign teachers."
        action={
          isSuperAdmin && (
            <Link
              href="/admin/batches/trash"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              🗑️ Trash
            </Link>
          )
        }
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
            <Label htmlFor="campus_id">Campus</Label>
            <Select id="campus_id" name="campus_id" required defaultValue="">
              <option value="">— Select —</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
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
            <Label htmlFor="active_student_count">Active Students</Label>
            <Input
              id="active_student_count"
              name="active_student_count"
              type="number"
              defaultValue={0}
            />
          </div>
          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <Input id="start_date" name="start_date" type="date" />
          </div>
          <div>
            <Label htmlFor="expected_end_date">Expected End Date</Label>
            <Input id="expected_end_date" name="expected_end_date" type="date" />
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
          <TrackerTable rows={rows} hrefBase="/admin/batches" canDelete={isSuperAdmin} />
        )}
      </Card>
    </div>
  );
}
