import {
  Card,
  CardHeader,
  Label,
  Input,
  Select,
  Textarea,
  Button,
  ProgressBar,
  ExamBadge,
  BatchStatusBadge,
  StatCard,
  EmptyState,
} from "@/components/ui";
import { toBn, formatDate } from "@/lib/utils";
import {
  updateBatchFields,
  logClass,
  toggleTopic,
  setAssessment,
} from "@/app/(app)/_actions/batch";
import { deleteBatch } from "@/app/(app)/admin/batches/actions";
import { DeleteButton } from "@/components/delete-button";
import { DailySchedule } from "@/components/daily-schedule";
import type { Batch, ClassScheduleEntry } from "@/lib/types";

interface Topic {
  id: string;
  sequence: number;
  title: string;
}
interface TopicProgress {
  topic_id: string;
  status: "pending" | "done";
}
interface Assessment {
  type: "entry" | "peer" | "exit";
  is_done: boolean;
}
interface ClassLog {
  id: string;
  class_date: string;
  counseling_count: number | null;
  note: string | null;
}

const ASSESSMENT_LABELS: Record<string, string> = {
  entry: "Entry Assessment",
  peer: "Peer Assessment",
  exit: "Exit Assessment",
};

export function BatchDetail({
  batch,
  courseName,
  abbreviation,
  topics,
  topicProgress,
  assessments,
  recentLogs,
  schedule = [],
  canEdit,
  canDelete = false,
}: {
  batch: Batch;
  courseName: string;
  abbreviation: string;
  topics: Topic[];
  topicProgress: TopicProgress[];
  assessments: Assessment[];
  recentLogs: ClassLog[];
  schedule?: ClassScheduleEntry[];
  canEdit: boolean;
  canDelete?: boolean;
}) {
  const pct =
    batch.total_classes > 0
      ? Math.round((100 * batch.completed_classes) / batch.total_classes)
      : 0;
  const remaining = Math.max(batch.total_classes - batch.completed_classes, 0);
  const progressMap = new Map(topicProgress.map((t) => [t.topic_id, t.status]));
  const doneTopics = topicProgress.filter((t) => t.status === "done").length;
  const assessmentMap = new Map(assessments.map((a) => [a.type, a.is_done]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">
              {abbreviation} — Batch {toBn(batch.batch_no)}
            </h1>
            <BatchStatusBadge status={batch.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{courseName}</p>
        </div>
        <div className="flex gap-2">
          <ExamBadge status={batch.midterm_status} />
          <ExamBadge status={batch.final_status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Classes" value={toBn(batch.total_classes)} icon="📚" accent="blue" />
        <StatCard label="Completed Classes" value={toBn(batch.completed_classes)} icon="✅" accent="green" />
        <StatCard label="Remaining Classes" value={toBn(remaining)} icon="🕒" accent="yellow" />
        <StatCard
          label="Syllabus Topics"
          value={`${toBn(doneTopics)}/${toBn(topics.length)}`}
          icon="📖"
          accent="brand"
        />
      </div>

      <Card className="p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600">Overall Progress</span>
          <span className="text-slate-400">
            Start {formatDate(batch.start_date)} · Expected end{" "}
            {formatDate(batch.expected_end_date)} · Last dawah class{" "}
            {formatDate(batch.dawah_end_date)} · Farewell{" "}
            {formatDate(batch.farewell_date)}
          </span>
        </div>
        <ProgressBar value={pct} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Class logging + status editing */}
        <div className="space-y-6">
          {canEdit && (
            <Card>
              <CardHeader title="Log a Class" subtitle="Logging a class updates progress automatically" />
              <form action={logClass} className="space-y-3 p-5">
                <input type="hidden" name="batch_id" value={batch.id} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="class_date">Date</Label>
                    <Input id="class_date" name="class_date" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="counseling_count">Counseling Count</Label>
                    <Input
                      id="counseling_count"
                      name="counseling_count"
                      type="number"
                      defaultValue={0}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="topic_id">Topic (optional)</Label>
                  <Select id="topic_id" name="topic_id" defaultValue="">
                    <option value="">— Select —</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {toBn(t.sequence)}. {t.title}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="note">Note</Label>
                  <Textarea id="note" name="note" className="min-h-16" />
                </div>
                <Button type="submit" className="w-full">
                  Add as Completed Class
                </Button>
              </form>
            </Card>
          )}

          <Card>
            <CardHeader title="Recent Class Logs" />
            {recentLogs.length === 0 ? (
              <EmptyState icon="🗓️" title="No class logs yet" />
            ) : (
              <ul className="divide-y divide-slate-50">
                {recentLogs.map((l) => (
                  <li key={l.id} className="px-5 py-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        {formatDate(l.class_date)}
                      </span>
                      <span className="text-xs text-slate-400">
                        Counseling: {toBn(l.counseling_count ?? 0)}
                      </span>
                    </div>
                    {l.note && <p className="text-sm text-slate-500">{l.note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Status form + assessments */}
        <div className="space-y-6">
          {canEdit && (
            <Card>
              <CardHeader title="Edit Batch" subtitle="Update batch details and progress" />
              <form action={updateBatchFields} className="space-y-3 p-5">
                <input type="hidden" name="id" value={batch.id} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="batch_no">Batch No.</Label>
                    <Input id="batch_no" name="batch_no" defaultValue={batch.batch_no} />
                  </div>
                  <div>
                    <Label htmlFor="total_classes">Total Classes</Label>
                    <Input
                      id="total_classes"
                      name="total_classes"
                      type="number"
                      defaultValue={batch.total_classes}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="date"
                      defaultValue={batch.start_date ?? ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select id="status" name="status" defaultValue={batch.status}>
                      <option value="will_start">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="midterm_status">Midterm</Label>
                    <Select
                      id="midterm_status"
                      name="midterm_status"
                      defaultValue={batch.midterm_status}
                    >
                      <option value="none">🔴 Not held</option>
                      <option value="pending">🟡 Ongoing</option>
                      <option value="done">🟢 Completed</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="final_status">Final</Label>
                    <Select
                      id="final_status"
                      name="final_status"
                      defaultValue={batch.final_status}
                    >
                      <option value="none">🔴 Not held</option>
                      <option value="pending">🟡 Ongoing</option>
                      <option value="done">🟢 Completed</option>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="expected_end_date">Expected End Date</Label>
                    <Input
                      id="expected_end_date"
                      name="expected_end_date"
                      type="date"
                      defaultValue={batch.expected_end_date ?? ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dawah_end_date">Last Dawah Class</Label>
                    <Input
                      id="dawah_end_date"
                      name="dawah_end_date"
                      type="date"
                      defaultValue={batch.dawah_end_date ?? ""}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="farewell_date">Farewell Date</Label>
                    <Input
                      id="farewell_date"
                      name="farewell_date"
                      type="date"
                      defaultValue={batch.farewell_date ?? ""}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="note">Note</Label>
                  <Textarea
                    id="note"
                    name="note"
                    defaultValue={batch.note ?? ""}
                    className="min-h-16"
                  />
                </div>
                <Button type="submit" variant="secondary" className="w-full">
                  Save Update
                </Button>
              </form>
              {canDelete && (
                <div className="border-t border-slate-100 p-5">
                  <DeleteButton
                    action={deleteBatch}
                    id={batch.id}
                    label="Delete this batch"
                    confirmText="এই ব্যাচটি স্থায়ীভাবে মুছে ফেলবেন?"
                    className="w-full"
                  />
                </div>
              )}
            </Card>
          )}

          <Card>
            <CardHeader title="Assessments" subtitle="Entry · Peer · Exit" />
            <ul className="divide-y divide-slate-50">
              {(["entry", "peer", "exit"] as const).map((type) => {
                const done = assessmentMap.get(type) ?? false;
                return (
                  <li
                    key={type}
                    className="flex items-center justify-between px-5 py-3.5"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {ASSESSMENT_LABELS[type]}
                    </span>
                    {canEdit ? (
                      <form action={setAssessment}>
                        <input type="hidden" name="batch_id" value={batch.id} />
                        <input type="hidden" name="type" value={type} />
                        <input
                          type="hidden"
                          name="is_done"
                          value={String(done)}
                        />
                        <Button
                          variant="ghost"
                          className={
                            done
                              ? "text-xs text-green-700"
                              : "text-xs text-slate-500"
                          }
                        >
                          {done ? "🟢 Completed" : "🔴 Not held"}
                        </Button>
                      </form>
                    ) : (
                      <span className="text-sm">{done ? "🟢" : "🔴"}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>

      <DailySchedule batchId={batch.id} entries={schedule} canEdit={canEdit} />

      {/* Syllabus topic checklist */}
      <Card>
        <CardHeader
          title="Syllabus Progress"
          subtitle={`${toBn(doneTopics)} / ${toBn(topics.length)} topics completed`}
        />
        {topics.length === 0 ? (
          <EmptyState icon="📖" title="This course has no syllabus topics" />
        ) : (
          <ul className="divide-y divide-slate-50">
            {topics.map((t) => {
              const status = progressMap.get(t.id) ?? "pending";
              const done = status === "done";
              return (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid size-6 place-items-center rounded-md text-xs ${
                        done
                          ? "bg-green-500 text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {done ? "✓" : toBn(t.sequence)}
                    </span>
                    <span
                      className={
                        done
                          ? "text-sm text-slate-400 line-through"
                          : "text-sm text-slate-700"
                      }
                    >
                      {t.title}
                    </span>
                  </div>
                  {canEdit && (
                    <form action={toggleTopic}>
                      <input type="hidden" name="batch_id" value={batch.id} />
                      <input type="hidden" name="topic_id" value={t.id} />
                      <input type="hidden" name="done" value={String(done)} />
                      <Button variant="ghost" className="text-xs">
                        {done ? "Mark incomplete" : "Mark complete"}
                      </Button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
