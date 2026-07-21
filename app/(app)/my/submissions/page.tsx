import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, PageHeader, EmptyState } from "@/components/ui";
import { TASK_CLASS_TYPE } from "@/lib/constants";
import { formatDate, formatMonth } from "@/lib/utils";
import {
  SubmissionForm,
  type AllocatedBatch,
  type SubBatchOption,
  type SubCourseOption,
} from "./submission-form";
import { deleteSubmission } from "./actions";
import type {
  Task,
  TaskSubmission,
  Course,
  CourseTrackerRow,
} from "@/lib/types";

export default async function MySubmissionsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = formatMonth(currentMonth);

  const [
    { data: allocData },
    { data: batchData },
    { data: courseData },
    { data: subData },
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, class_type, batch_id, campus_id, target_month")
      .eq("assigned_to", profile.id)
      .eq("target_month", currentMonth),
    supabase
      .from("course_tracker")
      .select("batch_id, course_id, campus_id, course_info, batch_no")
      .order("batch_no"),
    supabase.from("courses").select("*").order("abbreviation"),
    supabase
      .from("task_submissions")
      .select("*")
      .eq("teacher_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const trackerRows = (batchData ?? []) as Pick<
    CourseTrackerRow,
    "batch_id" | "course_id" | "campus_id" | "course_info" | "batch_no"
  >[];
  const batchLabelOf = (id: string | null) => {
    const b = trackerRows.find((r) => r.batch_id === id);
    return b ? `${b.course_info} — Batch ${b.batch_no}` : null;
  };

  const allBatches: SubBatchOption[] = trackerRows.map((b) => ({
    id: b.batch_id,
    campus_id: b.campus_id ?? null,
    course_id: b.course_id ?? null,
    label: `${b.course_info} — Batch ${b.batch_no}`,
  }));

  const courses: SubCourseOption[] = ((courseData ?? []) as Course[]).map(
    (c) => ({
      id: c.id,
      campus_id: c.campus_id ?? null,
      label: `${c.abbreviation} — ${c.name}`,
    }),
  );

  // Quran/Dawah batches allocated to this teacher for the current month.
  const allocations = (allocData ?? []) as Pick<
    Task,
    "id" | "class_type" | "batch_id" | "campus_id" | "target_month"
  >[];
  const allocatedBatches: AllocatedBatch[] = allocations
    .filter(
      (a) =>
        (a.class_type === "quran" || a.class_type === "dawah") && a.batch_id,
    )
    .map((a) => ({
      batch_id: a.batch_id as string,
      class_type: a.class_type as AllocatedBatch["class_type"],
      campus_id: a.campus_id ?? null,
      label: batchLabelOf(a.batch_id) ?? "Batch",
    }));

  const submissions = (subData ?? []) as TaskSubmission[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submit Class / Task"
        subtitle="Log your daily class updates, completed tasks and form verifications."
      />

      <Card>
        <CardHeader
          title="New Submission"
          subtitle={`Your allocations shown are for ${monthLabel}.`}
        />
        <SubmissionForm
          allocatedBatches={allocatedBatches}
          allBatches={allBatches}
          courses={courses}
          monthLabel={monthLabel}
        />
      </Card>

      <Card>
        <CardHeader
          title="My Recent Submissions"
          subtitle={`${submissions.length} shown`}
        />
        {submissions.length === 0 ? (
          <EmptyState icon="📤" title="No submissions yet" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {submissions.map((s) => {
              const ct = TASK_CLASS_TYPE[s.class_type];
              return (
                <li key={s.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ct.bg} ${ct.text}`}
                      >
                        {ct.label}
                      </span>
                      {s.is_additional && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Additional
                        </span>
                      )}
                      <span className="text-sm font-medium text-slate-800">
                        {batchLabelOf(s.batch_id) ??
                          (s.class_type === "staff" ? "Staff Class" : "—")}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {formatDate(s.submission_date)}
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                    {s.topic && <span>📖 {s.topic}</span>}
                    {s.class_type === "form_verification" && (
                      <span>✅ {s.verified_count} forms verified</span>
                    )}
                    {s.file_url && (
                      <a
                        href={s.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-brand-600 hover:underline"
                      >
                        📎 {s.file_name || "Attachment"}
                      </a>
                    )}
                  </div>
                  {s.comments && (
                    <p className="mt-1.5 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      {s.comments}
                    </p>
                  )}

                  <form action={deleteSubmission} className="mt-2">
                    <input type="hidden" name="id" value={s.id} />
                    <button className="rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50">
                      Delete
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
