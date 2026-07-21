import Link from "next/link";
import {
  Card,
  CardHeader,
  StatCard,
  EmptyState,
  TaskStatusBadge,
  Button,
  ProgressBar,
} from "@/components/ui";
import { TrackerTable } from "@/components/tracker-table";
import { DashboardHero } from "@/components/dashboard-hero";
import { NoticeBoard } from "@/components/notice-board";
import { toBn, formatDate } from "@/lib/utils";
import { toggleAmaliLog } from "./actions";
import type { CourseTrackerRow, Task, Notice, AmaliItem } from "@/lib/types";

export function TeacherDashboard({
  name,
  photoUrl,
  tracker,
  tasks,
  reportedToday,
  notices,
  amaliItems,
  amaliDoneIds,
}: {
  name: string;
  photoUrl?: string | null;
  tracker: CourseTrackerRow[];
  tasks: Task[];
  reportedToday: boolean;
  notices: Notice[];
  amaliItems: AmaliItem[];
  amaliDoneIds: string[];
}) {
  const doneSet = new Set(amaliDoneIds);
  const amaliPct =
    amaliItems.length > 0
      ? Math.round((doneSet.size / amaliItems.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <DashboardHero
        name={name}
        photoUrl={photoUrl}
        fallback="Member"
        subtitle="The batches and activities under your responsibility."
      />

      {!reportedToday && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4">
          <p className="text-sm font-medium text-yellow-800">
            ⚠️ Today&apos;s daily report has not been submitted yet.
          </p>
          <Link href="/my/report">
            <Button variant="primary">Submit report</Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="My Batches" value={toBn(tracker.length)} icon="🗂️" accent="brand" />
        <StatCard
          label="Ongoing Batches"
          value={toBn(tracker.filter((t) => t.status === "ongoing").length)}
          icon="📊"
          accent="yellow"
        />
        <StatCard label="Pending Tasks" value={toBn(tasks.length)} icon="✅" accent="blue" />
        <StatCard
          label="Today's Report"
          value={reportedToday ? "✓" : "—"}
          icon="📝"
          accent={reportedToday ? "green" : "red"}
        />
      </div>

      <NoticeBoard notices={notices} isAdmin={false} />

      <Card>
        <CardHeader
          title="আজকের আমল"
          subtitle={`${doneSet.size} / ${amaliItems.length} সম্পন্ন`}
          action={
            <div className="w-40">
              <ProgressBar value={amaliPct} />
            </div>
          }
        />
        {amaliItems.length === 0 ? (
          <EmptyState
            icon="📿"
            title="কোনো আমলি আইটেম নেই"
            hint="কোঅর্ডিনেটর আইটেম যুক্ত করলে এখানে দেখা যাবে।"
          />
        ) : (
          <ul className="divide-y divide-slate-50">
            {amaliItems.map((it) => {
              const done = doneSet.has(it.id);
              return (
                <li key={it.id} className="px-5 py-1">
                  <form action={toggleAmaliLog}>
                    <input type="hidden" name="item_id" value={it.id} />
                    <input type="hidden" name="done" value={(!done).toString()} />
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 py-2.5 text-left"
                    >
                      <span
                        className={
                          done
                            ? "grid size-6 shrink-0 place-items-center rounded-md bg-green-500 text-sm text-white"
                            : "grid size-6 shrink-0 place-items-center rounded-md border border-slate-300 text-transparent"
                        }
                      >
                        ✓
                      </span>
                      <span
                        className={
                          done ? "text-slate-400 line-through" : "text-slate-800"
                        }
                      >
                        {it.title}
                      </span>
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader
          title="My Batch Progress"
          subtitle="Click a course to update classes and syllabus"
        />
        <TrackerTable rows={tracker} hrefBase="/my/batches" />
      </Card>

      <Card>
        <CardHeader title="My Pending Tasks" />
        {tasks.length === 0 ? (
          <EmptyState icon="🎉" title="No pending tasks" />
        ) : (
          <ul className="divide-y divide-slate-50">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <div>
                  <p className="font-medium text-slate-800">{t.title}</p>
                  {t.due_date && (
                    <p className="text-xs text-slate-400">
                      Due: {formatDate(t.due_date)}
                    </p>
                  )}
                </div>
                <TaskStatusBadge status={t.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
