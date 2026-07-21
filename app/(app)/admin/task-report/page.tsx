import { requireCoordinatorOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  PageHeader,
  ProgressBar,
  EmptyState,
  Select,
  Button,
  TaskStatusBadge,
} from "@/components/ui";
import { TASK_CLASS_TYPE } from "@/lib/constants";
import { formatDate, formatMonth } from "@/lib/utils";
import type {
  Profile,
  Task,
  TaskSubmission,
  TaskClassType,
  CourseTrackerRow,
} from "@/lib/types";

// Class types that carry a monthly target vs. taken comparison.
const METRIC_TYPES: TaskClassType[] = [
  "quran",
  "dawah",
  "staff",
  "form_verification",
];

export default async function TaskReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const profile = await requireCoordinatorOrAdmin();
  const supabase = await createClient();
  const sp = await searchParams;
  const teacherId = String(sp.teacher ?? "");

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const month = String(sp.month ?? currentMonth);

  // Month options: current month and the previous 11.
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { value, label: formatMonth(value) };
  });

  // Coordinators may only report on teachers within their own campus(es).
  let campusIds: string[] | null = null;
  if (profile.role === "coordinator") {
    const { data: links } = await supabase
      .from("teacher_campuses")
      .select("campus_id")
      .eq("teacher_id", profile.id);
    campusIds = [...new Set((links ?? []).map((r) => r.campus_id as string))];
  }

  const { data: teacherLinks } =
    campusIds && campusIds.length
      ? await supabase
          .from("teacher_campuses")
          .select("teacher_id")
          .in("campus_id", campusIds)
      : { data: null as { teacher_id: string }[] | null };
  const scopedTeacherIds = campusIds
    ? new Set((teacherLinks ?? []).map((r) => r.teacher_id as string))
    : null;

  const { data: teacherData } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "teacher")
    .order("full_name");
  const allTeachers = (teacherData ?? []) as Pick<Profile, "id" | "full_name">[];
  const teachers = scopedTeacherIds
    ? allTeachers.filter((t) => scopedTeacherIds.has(t.id))
    : allTeachers;

  const selected = teachers.find((t) => t.id === teacherId) ?? null;

  // ---- Load the selected teacher's allocations & submissions ---------------
  let allocations: Task[] = [];
  let submissions: TaskSubmission[] = [];
  let otherTasks: Task[] = [];
  let batchLabel: (id: string | null) => string | null = () => null;

  if (selected) {
    const [{ data: allocData }, { data: subData }, { data: otherData }] =
      await Promise.all([
        supabase
          .from("tasks")
          .select("*")
          .eq("assigned_to", selected.id)
          .eq("target_month", month),
        supabase
          .from("task_submissions")
          .select("*")
          .eq("teacher_id", selected.id)
          .eq("target_month", month)
          .order("submission_date", { ascending: false }),
        supabase
          .from("tasks")
          .select("*")
          .eq("assigned_to", selected.id)
          .eq("class_type", "other")
          .order("due_date", { nullsFirst: false }),
      ]);
    allocations = (allocData ?? []) as Task[];
    submissions = (subData ?? []) as TaskSubmission[];
    otherTasks = (otherData ?? []) as Task[];

    const batchIds = [
      ...new Set(
        submissions
          .map((s) => s.batch_id)
          .concat(allocations.map((a) => a.batch_id))
          .filter(Boolean) as string[],
      ),
    ];
    if (batchIds.length) {
      const { data: trackerRows } = await supabase
        .from("course_tracker")
        .select("batch_id, course_info, batch_no")
        .in("batch_id", batchIds);
      const rows = (trackerRows ?? []) as Pick<
        CourseTrackerRow,
        "batch_id" | "course_info" | "batch_no"
      >[];
      batchLabel = (id) => {
        const b = rows.find((r) => r.batch_id === id);
        return b ? `${b.course_info} — Batch ${b.batch_no}` : null;
      };
    }
  }

  // ---- Aggregate target vs. taken per metric type --------------------------
  const metrics = METRIC_TYPES.map((type) => {
    const target = allocations
      .filter((a) => a.class_type === type)
      .reduce((sum, a) => sum + (a.target_count ?? 0), 0);
    const typeSubs = submissions.filter((s) => s.class_type === type);
    const additional = typeSubs.filter((s) => s.is_additional).length;
    const done =
      type === "form_verification"
        ? typeSubs.reduce((sum, s) => sum + (s.verified_count ?? 0), 0)
        : typeSubs.length;
    const pct = target > 0 ? Math.round((done / target) * 100) : done > 0 ? 100 : 0;
    return { type, target, done, additional, pct };
  });

  const filesSubs = submissions.filter((s) => s.file_url);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Report"
        subtitle="Track each member's target vs. actually-completed classes & tasks."
      />

      <Card>
        <form method="get" className="grid gap-3 p-5 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Teacher / Member
            </label>
            <Select name="teacher" defaultValue={teacherId}>
              <option value="">— Select a teacher —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Month
            </label>
            <Select name="month" defaultValue={month}>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              View Report
            </Button>
          </div>
        </form>
      </Card>

      {!selected ? (
        <Card>
          <EmptyState
            icon="📈"
            title="Select a teacher to view their report"
            hint="Choose a member and month above."
          />
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader
              title={`${selected.full_name} — ${formatMonth(month)}`}
              subtitle="Monthly target vs. actually taken"
            />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {metrics.map((m) => {
                const ct = TASK_CLASS_TYPE[m.type];
                const isForm = m.type === "form_verification";
                return (
                  <div
                    key={m.type}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ct.bg} ${ct.text}`}
                      >
                        {ct.label}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {m.done}
                        <span className="text-slate-400"> / {m.target}</span>
                        <span className="ml-1 text-xs font-normal text-slate-400">
                          {isForm ? "forms" : "classes"}
                        </span>
                      </span>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={m.pct} />
                    </div>
                    {!isForm && m.additional > 0 && (
                      <p className="mt-2 text-xs font-medium text-amber-600">
                        + {m.additional} additional class
                        {m.additional > 1 ? "es" : ""} taken
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Other Tasks"
              subtitle={`${otherTasks.length} total`}
            />
            {otherTasks.length === 0 ? (
              <EmptyState icon="🗂️" title="No other tasks assigned" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {otherTasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{t.title}</p>
                      {t.due_date && (
                        <p className="text-xs text-slate-400">
                          Due {formatDate(t.due_date)}
                        </p>
                      )}
                    </div>
                    <TaskStatusBadge status={t.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Submitted Files"
              subtitle={`${filesSubs.length} attachment(s)`}
            />
            {filesSubs.length === 0 ? (
              <EmptyState icon="📎" title="No files submitted this month" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {filesSubs.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TASK_CLASS_TYPE[s.class_type].bg} ${TASK_CLASS_TYPE[s.class_type].text}`}
                      >
                        {TASK_CLASS_TYPE[s.class_type].label}
                      </span>
                      <span className="text-sm text-slate-600">
                        {batchLabel(s.batch_id) ?? formatDate(s.submission_date)}
                      </span>
                    </div>
                    <a
                      href={s.file_url as string}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      ⬇ {s.file_name || "Download"}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
