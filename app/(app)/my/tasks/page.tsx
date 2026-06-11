import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  PageHeader,
  EmptyState,
  TaskStatusBadge,
} from "@/components/ui";
import { TASK_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { updateTaskStatus } from "@/app/(app)/admin/tasks/actions";
import type { Task, TaskStatus } from "@/lib/types";

const NEXT: TaskStatus[] = ["todo", "doing", "done"];

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Tasks"
        subtitle="Work assigned by the Coordinator and its status."
      />
      <Card>
        <CardHeader title="Task List" subtitle={`${tasks.length} total`} />
        {tasks.length === 0 ? (
          <EmptyState icon="🎉" title="No tasks assigned" />
        ) : (
          <ul className="divide-y divide-slate-50">
            {tasks.map((t) => (
              <li key={t.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-800">{t.title}</p>
                    {t.description && (
                      <p className="text-sm text-slate-500">{t.description}</p>
                    )}
                    {t.due_date && (
                      <p className="mt-1 text-xs text-slate-400">
                        Due: {formatDate(t.due_date)}
                      </p>
                    )}
                  </div>
                  <TaskStatusBadge status={t.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
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
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
