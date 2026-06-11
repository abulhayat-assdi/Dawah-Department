import { requireAdmin } from "@/lib/auth";
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
import { TASK_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { createTask, updateTaskStatus, deleteTask } from "./actions";
import type { Profile, Task, TaskStatus } from "@/lib/types";

const COLUMNS: TaskStatus[] = ["todo", "doing", "done"];

export default async function TasksPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: taskData }, { data: teacherData }] = await Promise.all([
    supabase.from("tasks").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").order("full_name"),
  ]);
  const tasks = (taskData ?? []) as Task[];
  const teachers = (teacherData ?? []) as Profile[];
  const name = (id: string | null) =>
    teachers.find((t) => t.id === id)?.full_name ?? "Unassigned";

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
              <option value="0">Normal</option>
              <option value="1">Important</option>
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
                          Urgent
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
