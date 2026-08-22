import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader, EmptyState, Button } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";
import { formatDate } from "@/lib/utils";
import { restoreBatch, purgeBatch } from "../actions";
import type { Batch, Campus, Course } from "@/lib/types";

const TRASH_RETENTION_DAYS = 30;

export default async function BatchTrashPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: batchData }, { data: courseData }, { data: campusData }] =
    await Promise.all([
      supabase
        .from("batches")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false }),
      supabase.from("courses").select("*"),
      supabase.from("campuses").select("*"),
    ]);

  const batches = (batchData ?? []) as (Batch & { deleted_at: string })[];
  const courses = new Map(
    ((courseData ?? []) as Course[]).map((c) => [c.id, c]),
  );
  const campuses = new Map(
    ((campusData ?? []) as Campus[]).map((c) => [c.id, c]),
  );

  const now = Date.now();

  function daysLeft(deletedAt: string): number {
    const deletedMs = new Date(deletedAt).getTime();
    const elapsedDays = (now - deletedMs) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(TRASH_RETENTION_DAYS - elapsedDays));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          title="Batch Trash"
          subtitle="Deleted batches are kept here for 30 days before being permanently removed."
        />
        <Link
          href="/admin/batches"
          className="text-sm text-slate-500 hover:text-brand-600"
        >
          ← Back to Batch Management
        </Link>
      </div>

      <Card className="p-1">
        {batches.length === 0 ? (
          <EmptyState icon="🗑️" title="Trash is empty" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Course</th>
                  <th className="px-3 py-3">Batch</th>
                  <th className="px-3 py-3">Campus</th>
                  <th className="px-3 py-3">Deleted</th>
                  <th className="px-3 py-3 text-center">Auto-purges in</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => {
                  const course = courses.get(b.course_id);
                  const campus = b.campus_id ? campuses.get(b.campus_id) : null;
                  const left = daysLeft(b.deleted_at);
                  return (
                    <tr
                      key={b.id}
                      className="border-b border-slate-50 hover:bg-slate-50/60"
                    >
                      <td className="px-3 py-3 font-semibold text-slate-900">
                        {course?.abbreviation ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{b.batch_no}</td>
                      <td className="px-3 py-3 text-slate-600">
                        {campus?.name ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {formatDate(b.deleted_at)}
                      </td>
                      <td className="px-3 py-3 text-center font-medium text-slate-700">
                        {left} day{left === 1 ? "" : "s"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <form action={restoreBatch}>
                            <input type="hidden" name="id" value={b.id} />
                            <Button variant="secondary" className="text-xs">
                              Restore
                            </Button>
                          </form>
                          <DeleteButton
                            action={purgeBatch}
                            id={b.id}
                            label="Delete Permanently"
                            confirmText="এই ব্যাচটি স্থায়ীভাবে মুছে ফেলবেন? এটি আর ফিরিয়ে আনা যাবে না।"
                            className="text-xs"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
