import Link from "next/link";
import type { CourseTrackerRow } from "@/lib/types";
import { ExamBadge, BatchStatusBadge, ProgressBar, EmptyState } from "./ui";
import { formatDate, toBn } from "@/lib/utils";
import { deleteBatch } from "@/app/(app)/admin/batches/actions";
import { DeleteButton } from "@/components/delete-button";

/**
 * The course-progress tracking table from Information.docx:
 * Sl | Course | Batch | Duration | Start | Total | Done | Left |
 * Midterm | Final | Status | Days Left | Farewell.
 */
export function TrackerTable({
  rows,
  hrefBase = "/admin/batches",
  canDelete = false,
}: {
  rows: CourseTrackerRow[];
  hrefBase?: string;
  canDelete?: boolean;
}) {
  if (!rows.length) {
    return (
      <EmptyState
        icon="📊"
        title="No batches found"
        hint="Add a batch and its progress will appear here."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1020px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-3 py-3">#</th>
            <th className="px-3 py-3">Course</th>
            <th className="px-3 py-3">Batch</th>
            <th className="px-3 py-3">Start</th>
            <th className="px-3 py-3 min-w-44">Progress</th>
            <th className="px-3 py-3 text-center">Classes</th>
            <th className="px-3 py-3 text-center">Midterm</th>
            <th className="px-3 py-3 text-center">Final</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3 text-center">Days Left</th>
            <th className="px-3 py-3 text-center">Est. (pace)</th>
            <th className="px-3 py-3">Farewell</th>
            {canDelete && <th className="px-3 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.batch_id}
              className="animate-row-in border-b border-slate-50 transition-colors hover:bg-slate-50/70"
              style={{ animationDelay: `${Math.min(i, 12) * 45}ms` }}
            >
              <td className="px-3 py-3 text-slate-400">{toBn(i + 1)}</td>
              <td className="px-3 py-3">
                <Link
                  href={`${hrefBase}/${r.batch_id}`}
                  className="font-semibold text-slate-900 transition-colors hover:text-brand-600"
                >
                  {r.course_info}
                </Link>
                <p className="text-xs text-slate-400">{r.campus_name ?? "—"}</p>
              </td>
              <td className="px-3 py-3 text-slate-600">{toBn(r.batch_no)}</td>
              <td className="px-3 py-3 text-slate-600">
                {formatDate(r.start_date)}
              </td>
              <td className="px-3 py-3">
                <ProgressBar value={r.progress_pct} />
              </td>
              <td className="px-3 py-3 text-center text-slate-600">
                {toBn(r.completed_classes)}/{toBn(r.total_classes)}
              </td>
              <td className="px-3 py-3 text-center">
                <ExamBadge status={r.midterm_status} />
              </td>
              <td className="px-3 py-3 text-center">
                <ExamBadge status={r.final_status} />
              </td>
              <td className="px-3 py-3">
                <BatchStatusBadge status={r.status} />
              </td>
              <td className="px-3 py-3 text-center font-medium text-slate-700">
                {r.days_left == null ? "—" : `${toBn(r.days_left)} days`}
              </td>
              <td className="px-3 py-3 text-center text-slate-500">
                {r.projected_days_left == null
                  ? "—"
                  : `~${toBn(r.projected_days_left)} days`}
              </td>
              <td className="px-3 py-3 text-slate-600">
                {formatDate(r.farewell_date)}
              </td>
              {canDelete && (
                <td className="px-3 py-3 text-right">
                  <DeleteButton
                    action={deleteBatch}
                    id={r.batch_id}
                    label="Delete"
                    confirmText="এই ব্যাচটি Trash-এ পাঠাবেন? সুপার এডমিন ৩০ দিনের মধ্যে এটি Restore করতে পারবেন।"
                    className="text-xs"
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
