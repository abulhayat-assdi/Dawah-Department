import { requireCoordinatorOrAdmin, allRoles } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, PageHeader, Label, Select, Input, Button, EmptyState } from "@/components/ui";
import { LESSON_PLAN_WEEKS } from "@/lib/constants";
import { formatMonth, formatDateTime } from "@/lib/utils";
import type { Campus, LessonPlan } from "@/lib/types";
import { AdminLessonPlanClient } from "./admin-lesson-plan-client";
import type { AssignmentOpt, TeacherBatchOpt, TeacherOpt } from "./assignment-builder";

const ALL_CAMPUSES = "all";

export default async function AdminLessonPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const profile = await requireCoordinatorOrAdmin();
  const supabase = await createClient();

  const roles = allRoles(profile);
  const isAdmin = roles.includes("super_admin");
  const isCoordinator = roles.includes("coordinator");

  let scopedCampusIds: string[] | null = null;
  if (isCoordinator && !isAdmin) {
    const { data: links } = await supabase
      .from("teacher_campuses")
      .select("campus_id")
      .eq("teacher_id", profile.id);
    scopedCampusIds = [...new Set((links ?? []).map((r) => r.campus_id as string))];
  }

  const sp = await searchParams;
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const month = /^\d{4}-\d{2}$/.test(String(sp.month ?? "")) ? String(sp.month) : currentMonth;
  const monthLabel = formatMonth(month);
  const teacherFilter = String(sp.teacher ?? "");
  const campusFilter = String(sp.campus ?? ALL_CAMPUSES);

  // ---------------------------------------------------------------- campuses
  const { data: campusData } = scopedCampusIds
    ? scopedCampusIds.length
      ? await supabase.from("campuses").select("*").in("id", scopedCampusIds).order("name")
      : { data: [] as Campus[] }
    : await supabase.from("campuses").select("*").order("name");
  const campuses = (campusData ?? []) as Campus[];

  // ------------------------------------------------------------ teacher list
  let teacherIdScope: string[] | null = null;
  if (scopedCampusIds) {
    const { data: links } = scopedCampusIds.length
      ? await supabase.from("teacher_campuses").select("teacher_id").in("campus_id", scopedCampusIds)
      : { data: [] as { teacher_id: string }[] };
    teacherIdScope = [...new Set((links ?? []).map((r) => r.teacher_id as string))];
  }

  const { data: teacherProfileData } = teacherIdScope
    ? teacherIdScope.length
      ? await supabase.from("profiles").select("id, full_name").in("id", teacherIdScope).order("full_name")
      : { data: [] as { id: string; full_name: string }[] }
    : await supabase.from("profiles").select("id, full_name").order("full_name");
  const teachers: TeacherOpt[] = (teacherProfileData ?? []) as TeacherOpt[];

  // All profiles, for resolving teacher names in the audit table regardless of scope.
  const { data: allProfileData } = await supabase.from("profiles").select("id, full_name");
  const nameById = new Map(((allProfileData ?? []) as { id: string; full_name: string }[]).map((p) => [p.id, p.full_name]));

  // ------------------------------------------------- batch labels + teacher↔batch links
  const { data: trackerData } = await supabase
    .from("course_tracker")
    .select("batch_id, campus_id, course_info, batch_no")
    .order("batch_no");
  const trackerRows = (trackerData ?? []) as {
    batch_id: string;
    campus_id: string | null;
    course_info: string;
    batch_no: string;
  }[];
  const batchMeta = new Map(
    trackerRows.map((b) => [
      b.batch_id,
      { campus_id: b.campus_id, label: `${b.course_info} — Batch ${b.batch_no}` },
    ]),
  );

  const { data: btData } = await supabase.from("batch_teachers").select("batch_id, teacher_id");
  const teacherBatches: TeacherBatchOpt[] = ((btData ?? []) as { batch_id: string; teacher_id: string }[])
    .filter((bt) => {
      const meta = batchMeta.get(bt.batch_id);
      if (!meta) return false;
      return !scopedCampusIds || (meta.campus_id && scopedCampusIds.includes(meta.campus_id));
    })
    .map((bt) => ({
      teacher_id: bt.teacher_id,
      batch_id: bt.batch_id,
      label: batchMeta.get(bt.batch_id)?.label ?? "Batch",
    }));

  // ---------------------------------------------------------- monthly assignments
  const { data: assignData } = scopedCampusIds
    ? scopedCampusIds.length
      ? await supabase.from("lesson_plan_assignments").select("teacher_id, batch_id, target_month").in("campus_id", scopedCampusIds)
      : { data: [] as AssignmentOpt[] }
    : await supabase.from("lesson_plan_assignments").select("teacher_id, batch_id, target_month");
  const assignments = (assignData ?? []) as AssignmentOpt[];

  // -------------------------------------------------------------- monitoring table
  let plansQuery = supabase
    .from("lesson_plans")
    .select("*")
    .eq("target_month", month)
    .order("batch_id")
    .order("week_number");
  if (scopedCampusIds) plansQuery = plansQuery.in("campus_id", scopedCampusIds.length ? scopedCampusIds : ["00000000-0000-0000-0000-000000000000"]);
  if (teacherFilter) plansQuery = plansQuery.eq("teacher_id", teacherFilter);
  if (campusFilter !== ALL_CAMPUSES) plansQuery = plansQuery.eq("campus_id", campusFilter);
  const { data: planData } = await plansQuery;
  const plans = (planData ?? []) as LessonPlan[];

  // Batches the selected teacher is assigned to this month (so unfilled weeks still show in the grid).
  const teacherAssignedBatchIds = teacherFilter
    ? [...new Set(assignments.filter((a) => a.teacher_id === teacherFilter && a.target_month === month).map((a) => a.batch_id))]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Lesson Plan"
        subtitle="Monitoring hub — audit submitted weekly lesson plans across teachers and campuses."
      />

      <AdminLessonPlanClient teachers={teachers} teacherBatches={teacherBatches} assignments={assignments} />

      <Card>
        <CardHeader title="Filters" />
        <form method="get" className="grid gap-3 p-5 sm:grid-cols-4">
          <div>
            <Label htmlFor="teacher">Teacher</Label>
            <Select id="teacher" name="teacher" defaultValue={teacherFilter}>
              <option value="">All teachers</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="campus">Campus</Label>
            <Select id="campus" name="campus" defaultValue={campusFilter}>
              <option value={ALL_CAMPUSES}>All campuses</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="month">Month</Label>
            <Input id="month" name="month" type="month" defaultValue={month} />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Show
            </Button>
          </div>
        </form>
      </Card>

      {teacherFilter ? (
        <Card>
          <CardHeader
            title={`${nameById.get(teacherFilter) ?? "Teacher"}'s Weekly Grid`}
            subtitle={monthLabel}
          />
          {teacherAssignedBatchIds.length === 0 ? (
            <EmptyState icon="📅" title="No batches assigned to this teacher for this month" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Batch</th>
                    {LESSON_PLAN_WEEKS.map((w) => (
                      <th key={w} className="px-3 py-3">
                        Week {w}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teacherAssignedBatchIds.map((batchId) => (
                    <tr key={batchId}>
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {batchMeta.get(batchId)?.label ?? "Batch"}
                      </td>
                      {LESSON_PLAN_WEEKS.map((w) => {
                        const plan = plans.find((p) => p.batch_id === batchId && p.week_number === w);
                        return (
                          <td key={w} className="max-w-56 px-3 py-3 align-top text-slate-600">
                            {plan ? (
                              <p className="whitespace-pre-wrap">{plan.description}</p>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <CardHeader title="Submitted Plans" subtitle={`${monthLabel} · ${plans.length} shown`} />
          {plans.length === 0 ? (
            <EmptyState icon="📝" title="No lesson plans submitted for this filter yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Teacher</th>
                    <th className="px-3 py-3">Batch</th>
                    <th className="px-3 py-3">Week</th>
                    <th className="px-3 py-3">Description</th>
                    <th className="px-3 py-3">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {plans.map((p) => (
                    <tr key={p.id}>
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {nameById.get(p.teacher_id) ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {batchMeta.get(p.batch_id)?.label ?? "Batch"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">Week {p.week_number}</td>
                      <td className="max-w-80 px-3 py-3 text-slate-600">
                        <p className="whitespace-pre-wrap">{p.description}</p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-slate-400">
                        {formatDateTime(p.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
