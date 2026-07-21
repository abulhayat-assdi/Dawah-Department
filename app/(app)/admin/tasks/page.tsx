import { requireCoordinatorOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import {
  PRIORITY_LABEL,
  TASK_STATUS,
  TASK_CLASS_TYPE,
} from "@/lib/constants";
import { formatDate, formatMonth } from "@/lib/utils";
import { updateTaskStatus, deleteTask } from "./actions";
import {
  TaskForm,
  type BatchOption,
  type CourseOption,
  type MonthOption,
} from "./task-form";
import type {
  Campus,
  Course,
  Profile,
  Task,
  TaskStatus,
  CourseTrackerRow,
} from "@/lib/types";

const COLUMNS: TaskStatus[] = ["todo", "doing", "done"];

export default async function TasksPage() {
  const profile = await requireCoordinatorOrAdmin();
  const supabase = await createClient();

  // A coordinator may only assign tasks to teachers/campuses within their
  // own campus(es); super_admin sees and assigns everyone/everywhere.
  let campusIds: string[] | null = null;
  if (profile.role === "coordinator") {
    const { data: campusLinks } = await supabase
      .from("teacher_campuses")
      .select("campus_id")
      .eq("teacher_id", profile.id);
    campusIds = [...new Set((campusLinks ?? []).map((r) => r.campus_id as string))];
  }

  const [
    { data: taskData },
    { data: campusData },
    { data: teacherLinks },
    { data: teacherData },
    { data: batchData },
    { data: courseData },
  ] = await Promise.all([
    supabase.from("tasks").select("*").order("created_at", { ascending: false }),
    campusIds
      ? campusIds.length
        ? supabase.from("campuses").select("*").in("id", campusIds).order("name")
        : Promise.resolve({ data: [] as Campus[] })
      : supabase.from("campuses").select("*").order("name"),
    campusIds && campusIds.length
      ? supabase.from("teacher_campuses").select("teacher_id").in("campus_id", campusIds)
      : Promise.resolve({ data: [] as { teacher_id: string }[] }),
    supabase.from("profiles").select("*").eq("role", "teacher").order("full_name"),
    campusIds
      ? campusIds.length
        ? supabase
            .from("course_tracker")
            .select("batch_id, course_id, campus_id, course_info, batch_no")
            .in("campus_id", campusIds)
            .order("batch_no")
        : Promise.resolve({ data: [] as Partial<CourseTrackerRow>[] })
      : supabase
          .from("course_tracker")
          .select("batch_id, course_id, campus_id, course_info, batch_no")
          .order("batch_no"),
    campusIds
      ? campusIds.length
        ? supabase.from("courses").select("*").in("campus_id", campusIds).order("abbreviation")
        : Promise.resolve({ data: [] as Course[] })
      : supabase.from("courses").select("*").order("abbreviation"),
  ]);
  const tasks = (taskData ?? []) as Task[];
  const campuses = (campusData ?? []) as Campus[];
  const scopedTeacherIds = campusIds
    ? new Set((teacherLinks ?? []).map((r) => r.teacher_id as string))
    : null;
  const allTeachers = (teacherData ?? []) as Profile[];
  const teachers = scopedTeacherIds
    ? allTeachers.filter((t) => scopedTeacherIds.has(t.id))
    : allTeachers;
  // Super admin / campus coordinator can also assign a task to themselves.
  const assignees = teachers.some((t) => t.id === profile.id)
    ? teachers
    : [profile, ...teachers];

  const batches: BatchOption[] = (
    (batchData ?? []) as Pick<
      CourseTrackerRow,
      "batch_id" | "course_id" | "campus_id" | "course_info" | "batch_no"
    >[]
  ).map((b) => ({
    id: b.batch_id,
    campus_id: b.campus_id ?? null,
    course_id: b.course_id ?? null,
    label: `${b.course_info} — Batch ${b.batch_no}`,
  }));

  const courses: CourseOption[] = ((courseData ?? []) as Course[]).map((c) => ({
    id: c.id,
    campus_id: c.campus_id ?? null,
    label: `${c.abbreviation} — ${c.name}`,
  }));

  // Month/year options: the current month plus the next 11, generated on the
  // server so admin and teacher views stay in sync (no hydration drift).
  const now = new Date();
  const months: MonthOption[] = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { value, label: formatMonth(value) };
  });

  const name = (id: string | null) =>
    assignees.find((t) => t.id === id)?.full_name ?? "Unassigned";
  const campusName = (id: string | null) =>
    campuses.find((c) => c.id === id)?.name ?? null;
  const batchLabel = (id: string | null) =>
    batches.find((b) => b.id === id)?.label ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Management"
        subtitle="Assign monthly classes & tasks to members and monitor progress."
      />

      <Card>
        <CardHeader title="Assign a New Task" />
        <TaskForm
          assignees={assignees}
          campuses={campuses}
          batches={batches}
          courses={courses}
          months={months}
          currentUserId={profile.id}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col);
          return (
            <Card key={col}>
              <CardHeader
                title={TASK_STATUS[col].label}
                subtitle={`${items.length} item(s)`}
              />
              <div className="space-y-3 p-4">
                {items.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-400">
                    Nothing here
                  </p>
                )}
                {items.map((t) => {
                  const ct = t.class_type ? TASK_CLASS_TYPE[t.class_type] : null;
                  return (
                    <div
                      key={t.id}
                      className="rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-slate-800">{t.title}</p>
                        {t.priority === 1 && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                            {PRIORITY_LABEL[1]}
                          </span>
                        )}
                      </div>
                      {(ct || t.target_count > 0) && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {ct && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ct.bg} ${ct.text}`}
                            >
                              {ct.label}
                            </span>
                          )}
                          {t.target_count > 0 && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              Target: {t.target_count}
                            </span>
                          )}
                        </div>
                      )}
                      {t.description && (
                        <p className="mt-1 text-sm text-slate-500">{t.description}</p>
                      )}
                      {(batchLabel(t.batch_id) ||
                        campusName(t.campus_id) ||
                        t.target_month) && (
                        <p className="mt-1.5 text-xs text-slate-400">
                          {[
                            batchLabel(t.batch_id),
                            campusName(t.campus_id),
                            t.target_month ? formatMonth(t.target_month) : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <span>👤 {name(t.assigned_to)}</span>
                        {t.due_date && <span>📅 {formatDate(t.due_date)}</span>}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {COLUMNS.filter((c) => c !== col).map((c) => (
                          <form key={c} action={updateTaskStatus}>
                            <input type="hidden" name="id" value={t.id} />
                            <input type="hidden" name="status" value={c} />
                            <button className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200">
                              → {TASK_STATUS[c].label}
                            </button>
                          </form>
                        ))}
                        <form action={deleteTask}>
                          <input type="hidden" name="id" value={t.id} />
                          <button className="rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50">
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
