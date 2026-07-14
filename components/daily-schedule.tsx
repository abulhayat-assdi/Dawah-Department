import { Button, Card, CardHeader, EmptyState, Label, Textarea } from "@/components/ui";
import { formatDate, toBn } from "@/lib/utils";
import { importSchedule, setScheduleStatus } from "@/app/(app)/_actions/batch";
import type { ClassScheduleEntry } from "@/lib/types";

const STATUS_LABEL: Record<ClassScheduleEntry["status"], string> = {
  pending: "🟡 Pending",
  done: "🟢 Done",
  schedule_changed: "🔁 Schedule Changed",
};

export function DailySchedule({
  batchId,
  entries,
  canEdit,
}: {
  batchId: string;
  entries: ClassScheduleEntry[];
  canEdit: boolean;
}) {
  const pending = entries.filter((e) => e.status === "pending");
  const decided = entries.filter((e) => e.status !== "pending");

  return (
    <Card>
      <CardHeader
        title="Daily Class Verification"
        subtitle="Import the schedule, then mark each class Done, Pending, or Schedule Changed"
      />

      {canEdit && (
        <form action={importSchedule} className="space-y-3 border-b border-slate-100 p-5">
          <input type="hidden" name="batch_id" value={batchId} />
          <div>
            <Label htmlFor="csv_file">Upload schedule (.csv)</Label>
            <input
              id="csv_file"
              name="csv_file"
              type="file"
              accept=".csv,text/csv"
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700"
            />
          </div>
          <div>
            <Label htmlFor="csv_text">…or paste rows (one per line: date, topic)</Label>
            <Textarea
              id="csv_text"
              name="csv_text"
              placeholder={"2026-07-14, Intro to Tafsir\n2026-07-15, Seerah part 2"}
              className="min-h-24 font-mono text-xs"
            />
          </div>
          <Button type="submit" className="w-full">
            Import Schedule
          </Button>
        </form>
      )}

      {entries.length === 0 ? (
        <EmptyState icon="🗓️" title="No schedule imported yet" />
      ) : (
        <div className="divide-y divide-slate-50">
          {pending.length > 0 && (
            <div className="p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Pending ({toBn(pending.length)})
              </p>
              <ul className="space-y-2">
                {pending.map((e) => (
                  <ScheduleRow key={e.id} entry={e} batchId={batchId} canEdit={canEdit} />
                ))}
              </ul>
            </div>
          )}
          {decided.length > 0 && (
            <div className="p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Verified
              </p>
              <ul className="space-y-2">
                {decided.map((e) => (
                  <ScheduleRow key={e.id} entry={e} batchId={batchId} canEdit={canEdit} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function ScheduleRow({
  entry,
  batchId,
  canEdit,
}: {
  entry: ClassScheduleEntry;
  batchId: string;
  canEdit: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2.5">
      <div>
        <p className="text-sm font-medium text-slate-800">
          {formatDate(entry.class_date)}
        </p>
        {entry.topic_label && (
          <p className="text-xs text-slate-500">{entry.topic_label}</p>
        )}
      </div>
      {canEdit ? (
        <div className="flex gap-1.5">
          {(["done", "pending", "schedule_changed"] as const).map((s) => (
            <form key={s} action={setScheduleStatus}>
              <input type="hidden" name="id" value={entry.id} />
              <input type="hidden" name="batch_id" value={batchId} />
              <input type="hidden" name="status" value={s} />
              <Button
                variant={entry.status === s ? "primary" : "ghost"}
                className="text-xs"
              >
                {STATUS_LABEL[s]}
              </Button>
            </form>
          ))}
        </div>
      ) : (
        <span className="text-xs font-medium text-slate-500">
          {STATUS_LABEL[entry.status]}
        </span>
      )}
    </li>
  );
}
