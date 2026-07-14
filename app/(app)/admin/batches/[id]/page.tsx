import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadBatchDetail } from "@/lib/batch-data";
import { BatchDetail } from "@/components/batch-detail";
import { Card, CardHeader, Label, Select, Input, Button, EmptyState } from "@/components/ui";
import { assignTeacher, unassignTeacher } from "../actions";
import type { Profile } from "@/lib/types";

export default async function AdminBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const data = await loadBatchDetail(id);
  if (!data) notFound();

  const supabase = await createClient();
  const [{ data: teacherData }, { data: assigned }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "teacher").order("full_name"),
    supabase
      .from("batch_teachers")
      .select("teacher_id, role_label")
      .eq("batch_id", id),
  ]);
  const teachers = (teacherData ?? []) as Profile[];
  const assignedIds = new Set((assigned ?? []).map((a) => a.teacher_id));
  const teacherName = (tid: string) =>
    teachers.find((t) => t.id === tid)?.full_name ?? "Unknown";

  return (
    <div className="space-y-6">
      <Link href="/admin/batches" className="text-sm text-slate-500 hover:text-brand-600">
        ← Back to batch list
      </Link>

      <BatchDetail
        batch={data.batch}
        courseName={data.course.name}
        abbreviation={data.course.abbreviation}
        topics={data.topics}
        topicProgress={data.topicProgress}
        assessments={data.assessments}
        recentLogs={data.recentLogs}
        schedule={data.schedule}
        canEdit
        canDelete
      />

      <Card>
        <CardHeader title="Teacher Assignment" subtitle="Which teachers can update this batch" />
        <div className="p-5">
          {(assigned ?? []).length === 0 ? (
            <EmptyState icon="👥" title="No teachers assigned yet" />
          ) : (
            <ul className="mb-4 divide-y divide-slate-50">
              {(assigned ?? []).map((a) => (
                <li
                  key={a.teacher_id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {teacherName(a.teacher_id)}
                    </p>
                    {a.role_label && (
                      <p className="text-xs text-slate-400">{a.role_label}</p>
                    )}
                  </div>
                  <form action={unassignTeacher}>
                    <input type="hidden" name="batch_id" value={id} />
                    <input type="hidden" name="teacher_id" value={a.teacher_id} />
                    <Button variant="ghost" className="text-xs text-red-600">
                      Remove
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <form action={assignTeacher} className="grid gap-3 md:grid-cols-3">
            <div>
              <Label htmlFor="teacher_id">Teacher</Label>
              <Select id="teacher_id" name="teacher_id" required defaultValue="">
                <option value="">— Select —</option>
                {teachers
                  .filter((t) => !assignedIds.has(t.id))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="role_label">Responsibility (optional)</Label>
              <Input id="role_label" name="role_label" placeholder="Quran class / Dawah class" />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Assign
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
