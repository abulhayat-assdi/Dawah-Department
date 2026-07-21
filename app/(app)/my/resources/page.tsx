import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  PageHeader,
  Label,
  Input,
  Textarea,
  Select,
  Button,
  EmptyState,
} from "@/components/ui";
import type { TeacherResource } from "@/lib/types";
import { createTeacherResource } from "./actions";
import { ResourceDropzone } from "./resource-dropzone";
import { ResourceItem, type CampusOption } from "./resource-item";

export default async function MyResourcesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: campusLinks }, { data: resData }] = await Promise.all([
    supabase
      .from("teacher_campuses")
      .select("campus_id, campuses(id, name)")
      .eq("teacher_id", profile.id),
    supabase
      .from("teacher_resources")
      .select("*")
      .eq("teacher_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  // Supabase types an embedded relation as an array; a campus_id FK resolves to
  // at most one row, so normalise to the first element.
  const campuses: CampusOption[] = (campusLinks ?? [])
    .map((row) => {
      const rel = (row as { campuses: CampusOption | CampusOption[] | null })
        .campuses;
      const c = Array.isArray(rel) ? rel[0] : rel;
      return c ? { id: c.id, name: c.name } : null;
    })
    .filter((c): c is CampusOption => c !== null);

  const resources = (resData ?? []) as TeacherResource[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Resources"
        subtitle="Upload and manage your own classroom documents. Only you and the administration can see these files."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* -------------------------------------------------- Add Resource */}
        <Card className="h-fit lg:col-span-1">
          <CardHeader title="Add Resource" />
          <form action={createTeacherResource} className="space-y-4 p-5">
            <div>
              <Label htmlFor="name">Resource Name</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="e.g. Tajweed Handout"
              />
            </div>
            <div>
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                name="comments"
                className="min-h-16"
                placeholder="Optional description, remarks or notes"
              />
            </div>
            {campuses.length > 0 && (
              <div>
                <Label htmlFor="campus_id">Campus</Label>
                <Select
                  id="campus_id"
                  name="campus_id"
                  defaultValue={campuses.length === 1 ? campuses[0].id : ""}
                >
                  {campuses.length > 1 && <option value="">— Select —</option>}
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div>
              <Label>File</Label>
              <ResourceDropzone teacherId={profile.id} required />
            </div>
            <Button type="submit" className="w-full">
              Save Resource
            </Button>
          </form>
        </Card>

        {/* -------------------------------------------------- Resource list */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="My Files"
            subtitle={`${resources.length} resource${resources.length === 1 ? "" : "s"}`}
          />
          {resources.length === 0 ? (
            <EmptyState
              icon="📁"
              title="No resources yet"
              hint="Add your first file using the form."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {resources.map((r) => (
                <ResourceItem key={r.id} resource={r} campuses={campuses} />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
