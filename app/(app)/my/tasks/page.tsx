import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  PageHeader,
  EmptyState,
  TaskStatusBadge,
} from "@/components/ui";
import {
  TASK_STATUS,
  TASK_CLASS_TYPE,
  PRIORITY_LABEL,
} from "@/lib/constants";
import { formatDate, formatMonth } from "@/lib/utils";
import { updateTaskStatus } from "@/app/(app)/admin/tasks/actions";
import type { Task, TaskStatus, Campus, CourseTrackerRow } from "@/lib/types";

const NEXT: TaskStatus[] = ["todo", "doing", "done"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-slate-700">{children}</dd>
    </div>
  );
}

export default async function MyTasksPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("assigned_to", profile.id)
    .order("status")
    .order("due_date", { nullsFirst: false });
  const tasks = (data ?? []) as Task[];

  const batchIds = [...new Set(tasks.map((t) => t.batch_id).filter(Boolean))];
  const [{ data: campusData }, { data: batchData }] = await Promise.all([
    supabase.from("campuses").select("id, name"),
    batchIds.length
      ? supabase
          .from("course_tracker")
          .select("batch_id, course_info, batch_no")
          .in("batch_id", batchIds as string[])
      : Promise.resolve({ data: [] as Partial<CourseTrackerRow>[] }),
  ]);
  const campusName = (id: string | null) =>
    ((campusData ?? []) as Pick<Campus, "id" | "name">[]).find((c) => c.id === id)
      ?.name ?? null;
  const batchLabel = (id: string | null) => {
    const b = (
      (batchData ?? []) as Pick<CourseTrackerRow, "batch_id" | "course_info" | "batch_no">[]
    ).find((r) => r.batch_id === id);
    return b ? `${b.course_info} — Batch ${b.batch_no}` : null;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Tasks"
        subtitle="Class & task allocations assigned to you, and their status."
      />
      <Card>
        <CardHeader title="Task List" subtitle={`${tasks.length} total`} />
        {tasks.length === 0 ? (
          <EmptyState icon="🎉" title="No tasks assigned" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {tasks.map((t) => {
              const ct = t.class_type ? TASK_CLASS_TYPE[t.class_type] : null;
              // Monthly class allocation (quran/dawah/staff) vs. a plain task.
              const monthly = ct?.monthly ?? false;
              return (
                <li key={t.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-800">{t.title}</p>
                      {ct && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ct.bg} ${ct.text}`}
                        >
                          {ct.label}
                        </span>
                      )}
                      {/* Priority indicator only matters for plain tasks. */}
                      {!monthly && t.priority === 1 && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                          {PRIORITY_LABEL[1]}
                        </span>
                      )}
                    </div>
                    <TaskStatusBadge status={t.status} />
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                    {monthly ? (
                      <>
                        <Field label="Assigned Month">
                          {formatMonth(t.target_month)}
                        </Field>
                        {ct?.needsBatch && (
                          <Field label="Batch">{batchLabel(t.batch_id) ?? "—"}</Field>
                        )}
                        <Field label="Campus">{campusName(t.campus_id) ?? "—"}</Field>
                        <Field label="Monthly Target">
                          {t.target_count > 0
                            ? `${t.target_count} ${
                                t.class_type === "form_verification"
                                  ? "Forms"
                                  : "Classes"
                              }`
                            : "—"}
                        </Field>
                      </>
                    ) : (
                      <>
                        <Field label="Campus">{campusName(t.campus_id) ?? "—"}</Field>
                        <Field label="Due Date">
                          {t.due_date ? formatDate(t.due_date) : "—"}
                        </Field>
                        <Field label="Priority">
                          <span
                            className={
                              t.priority === 1
                                ? "font-semibold text-red-600"
                                : "text-slate-700"
                            }
                          >
                            {PRIORITY_LABEL[t.priority] ?? PRIORITY_LABEL[0]}
                          </span>
                        </Field>
                      </>
                    )}
                  </dl>

                  {t.description && (
                    <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      {t.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs font-medium text-slate-400">
                      Update status:
                    </span>
                    {NEXT.filter((c) => c !== t.status).map((c) => (
                      <form key={c} action={updateTaskStatus}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="status" value={c} />
                        <button className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200">
                          → {TASK_STATUS[c].label}
                        </button>
                      </form>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
