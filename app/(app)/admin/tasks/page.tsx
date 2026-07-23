import { requireCoordinatorOrAdmin, allRoles } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, PageHeader, EmptyState } from "@/components/ui";
import { PRIORITY_LABEL, TASK_CLASS_TYPE } from "@/lib/constants";
import { formatDate, formatMonth, monthOptions } from "@/lib/utils";
import { deleteTask } from "./actions";
import { ConfirmButton } from "@/components/confirm-button";
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
  CourseTrackerRow,
} from "@/lib/types";

export default async function TasksPage() {
  const profile = await requireCoordinatorOrAdmin();
  const isSuperAdmin = allRoles(profile).includes("super_admin");
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
    isSuperAdmin
      ? supabase.from("tasks").select("*").order("created_at", { ascending: false })
      : supabase
          .from("tasks")
          .select("*")
          .eq("assigned_by", profile.id)
          .order("created_at", { ascending: false }),
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
            .select("batch_id, course_id, campus_id, campus_name, course_info, batch_no")
            .in("campus_id", campusIds)
            .order("batch_no")
        : Promise.resolve({ data: [] as Partial<CourseTrackerRow>[] })
      : supabase
          .from("course_tracker")
          .select("batch_id, course_id, campus_id, campus_name, course_info, batch_no")
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
      "batch_id" | "course_id" | "campus_id" | "campus_name" | "course_info" | "batch_no"
    >[]
  ).map((b) => ({
    id: b.batch_id,
    campus_id: b.campus_id ?? null,
    campus_name: b.campus_name ?? null,
    course_id: b.course_id ?? null,
    label: `${b.course_info} — Batch ${b.batch_no}`,
  }));

  const courses: CourseOption[] = ((courseData ?? []) as Course[]).map((c) => ({
    id: c.id,
    campus_id: c.campus_id ?? null,
    label: `${c.abbreviation} — ${c.name}`,
  }));

  // Month/year options: previous months that already hold task data, the
  // current (running) month, and the next 2 months for assigning ahead —
  // generated on the server so views stay in sync (no hydration drift).
  const { data: firstTask } = await supabase
    .from("tasks")
    .select("target_month")
    .not("target_month", "is", null)
    .order("target_month", { ascending: true })
    .limit(1)
    .maybeSingle();
  const months: MonthOption[] = monthOptions(
    firstTask?.target_month as string | undefined,
    2,
  );

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
          batches={batches}
          courses={courses}
          months={months}
          currentUserId={profile.id}
        />
      </Card>

      <Card>
        <CardHeader
          title="Assigned Tasks"
          subtitle={
            isSuperAdmin
              ? `${tasks.length} total`
              : `${tasks.length} created by you`
          }
        />
        {tasks.length === 0 ? (
          <EmptyState icon="🗂️" title="No tasks assigned yet" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {tasks.map((t) => {
              const ct = t.class_type ? TASK_CLASS_TYPE[t.class_type] : null;
              return (
                <li key={t.id} className="px-5 py-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-800">{t.title}</p>
                      {ct && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ct.bg} ${ct.text}`}
                        >
                          {ct.label}
                        </span>
                      )}
                      {t.priority === 1 && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                          {PRIORITY_LABEL[1]}
                        </span>
                      )}
                      {t.target_count > 0 && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          Target: {t.target_count}
                        </span>
                      )}
                    </div>
                    <ConfirmButton
                      action={deleteTask}
                      fields={{ id: t.id }}
                      triggerClassName="rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                      title="টাস্কটি ডিলিট করবেন?"
                      message={`"${t.title}" টাস্কটি মুছে ফেলা হবে। এটি আর ফিরিয়ে আনা যাবে না।`}
                      confirmLabel="ডিলিট করুন"
                    >
                      Delete
                    </ConfirmButton>
                  </div>
                  {t.description && (
                    <p className="mt-1 text-sm text-slate-500">{t.description}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span>👤 {name(t.assigned_to)}</span>
                    {batchLabel(t.batch_id) && <span>{batchLabel(t.batch_id)}</span>}
                    {campusName(t.campus_id) && <span>{campusName(t.campus_id)}</span>}
                    {t.target_month && <span>{formatMonth(t.target_month)}</span>}
                    {t.due_date && <span>📅 {formatDate(t.due_date)}</span>}
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
