import { requireCoordinatorOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  PageHeader,
  Input,
  Select,
  Button,
  EmptyState,
} from "@/components/ui";
import { resourceIcon, formatFileSize } from "@/lib/resources";
import { formatDate } from "@/lib/utils";
import type { TeacherResource } from "@/lib/types";

type ResourceRow = TeacherResource & {
  teacher: { full_name: string } | null;
  campus: { name: string } | null;
};

export default async function TeacherResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireCoordinatorOrAdmin();
  const supabase = await createClient();
  const sp = await searchParams;

  const teacherId = String(sp.teacher ?? "");
  const campusId = String(sp.campus ?? "");
  const search = String(sp.q ?? "").trim().toLowerCase();

  // RLS scopes rows automatically: super_admin sees all; a coordinator sees
  // only their campus(es). Teacher/campus filter option lists are built from
  // this full accessible set, then the display list is filtered in memory.
  const { data } = await supabase
    .from("teacher_resources")
    .select("*, teacher:profiles(full_name), campus:campuses(name)")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as ResourceRow[];

  const teachers = Array.from(
    new Map(
      rows
        .filter((r) => r.teacher)
        .map((r) => [r.teacher_id, r.teacher!.full_name]),
    ),
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const campuses = Array.from(
    new Map(
      rows
        .filter((r) => r.campus_id && r.campus)
        .map((r) => [r.campus_id as string, r.campus!.name]),
    ),
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const filtered = rows.filter((r) => {
    if (teacherId && r.teacher_id !== teacherId) return false;
    if (campusId && r.campus_id !== campusId) return false;
    if (search) {
      const haystack = [r.name, r.comments, r.file_name, r.teacher?.full_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Resources"
        subtitle="Browse, search and download resources uploaded by teachers across the institution."
      />

      <Card>
        <form method="get" className="grid gap-3 p-5 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Search
            </label>
            <Input
              name="q"
              defaultValue={String(sp.q ?? "")}
              placeholder="Name, comment, file or teacher…"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Teacher
            </label>
            <Select name="teacher" defaultValue={teacherId}>
              <option value="">All teachers</option>
              {teachers.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Campus
            </label>
            <Select name="campus" defaultValue={campusId}>
              <option value="">All campuses</option>
              {campuses.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-4">
            <Button type="submit">Apply filters</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader
          title="Resources"
          subtitle={`${filtered.length} of ${rows.length} shown`}
        />
        {filtered.length === 0 ? (
          <EmptyState
            icon="🗄️"
            title="No resources found"
            hint="Try clearing the filters or search."
          />
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="flex flex-col rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {resourceIcon(r.file_name, r.file_type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">
                      {r.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {r.teacher?.full_name ?? "Unknown teacher"}
                      {r.campus?.name ? ` · ${r.campus.name}` : ""}
                    </p>
                  </div>
                </div>

                {r.comments && (
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                    {r.comments}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-400">
                    {formatFileSize(r.file_size)} · {formatDate(r.created_at)}
                  </span>
                  <a
                    href={r.file_url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-slate-50"
                  >
                    ⬇ Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
