import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  PageHeader,
  EmptyState,
  Label,
  Input,
  Textarea,
  Button,
} from "@/components/ui";
import { TrackerTable } from "@/components/tracker-table";
import { FileUpload } from "@/components/file-upload";
import { DeleteButton } from "@/components/delete-button";
import { updateCampus, deleteCampus } from "../actions";
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
  const c = campus as Campus;

  return (
    <div className="space-y-6">
      <PageHeader
        title={c.name}
        subtitle={c.address || "Campus dawah progress"}
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
        <CardHeader title="Edit Campus" subtitle="Update this campus's details" />
        <form action={updateCampus} className="grid gap-4 p-5 md:grid-cols-2">
          <input type="hidden" name="id" value={id} />
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={c.name} />
          </div>
          <div>
            <Label htmlFor="slug">Slug (optional)</Label>
            <Input id="slug" name="slug" defaultValue={c.slug ?? ""} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={c.address ?? ""} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={c.description ?? ""} />
          </div>
          <div className="md:col-span-2">
            <FileUpload
              name="image_url"
              bucket="resources"
              kind="image"
              label="Campus Image (for public site)"
              defaultUrl={c.image_url}
            />
          </div>
          <div className="flex items-center gap-3 md:col-span-2">
            <Button type="submit">Save changes</Button>
            <DeleteButton
              action={deleteCampus}
              id={id}
              label="Delete campus"
              confirmText="এই ক্যাম্পাসটি মুছে ফেলবেন?"
            />
          </div>
        </form>
      </Card>

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
