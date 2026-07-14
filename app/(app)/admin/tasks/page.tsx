import { requireCoordinatorOrAdmin } from "@/lib/auth";
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
} from "@/components/ui";
import { PRIORITY_LABEL, TASK_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { createTask, updateTaskStatus, deleteTask } from "./actions";
import type { Campus, Profile, Task, TaskStatus } from "@/lib/types";

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

  const [{ data: taskData }, { data: campusData }, { data: teacherLinks }, { data: teacherData }] =
    await Promise.all([
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
  const name = (id: string | null) =>
    allTeachers.find((t) => t.id === id)?.full_name ?? "Unassigned";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Management"
        subtitle="Assign work to members and monitor progress."
      />

      <Card>
        <CardHeader title="Assign a New Task" />
        <form action={createTask} className="grid gap-3 p-5 md:grid-cols-2">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div>
            <Label htmlFor="assigned_to">Assign to</Label>
            <Select id="assigned_to" name="assigned_to" defaultValue="">
              <option value="">— Select —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
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
          <div className="md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" className="min-h-16" />
          </div>
          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Input id="due_date" name="due_date" type="date" />
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select id="priority" name="priority" defaultValue="0">
              <option value="0">{PRIORITY_LABEL[0]}</option>
              <option value="1">{PRIORITY_LABEL[1]}</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Add Task</Button>
          </div>
        </form>
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
                {items.map((t) => (
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
                    {t.description && (
                      <p className="mt-1 text-sm text-slate-500">{t.description}</p>
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
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
