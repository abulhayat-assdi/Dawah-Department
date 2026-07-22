"use client";

import { useActionState, useState } from "react";
import { Card, CardHeader, Label, Select, Textarea, Button, EmptyState } from "@/components/ui";
import { LESSON_PLAN_WEEKS } from "@/lib/constants";
import type { LessonPlan } from "@/lib/types";
import { saveLessonPlan, deleteLessonPlan, type LessonPlanFormState } from "./actions";

export interface AssignedBatch {
  id: string;
  campus_id: string | null;
  label: string;
}

export function LessonPlanClient({
  assignedBatches,
  plans,
  month,
  monthLabel,
}: {
  assignedBatches: AssignedBatch[];
  plans: LessonPlan[];
  month: string;
  monthLabel: string;
}) {
  const [state, formAction] = useActionState<LessonPlanFormState, FormData>(
    saveLessonPlan,
    null,
  );

  const [batchId, setBatchId] = useState("");
  const [weekNumber, setWeekNumber] = useState("");
  const [description, setDescription] = useState("");

  // Reset the form back to a blank slate once a save succeeds — guarded so it
  // only fires once per new action result (see routine-builder.tsx for the
  // same pattern).
  const [handled, setHandled] = useState<LessonPlanFormState>(null);
  if (state && state !== handled) {
    setHandled(state);
    if (state.ok) {
      setBatchId("");
      setWeekNumber("");
      setDescription("");
    }
  }

  const existing = plans.find(
    (p) => p.batch_id === batchId && String(p.week_number) === weekNumber,
  );
  const isUpdate = Boolean(existing);
  const campusId = assignedBatches.find((b) => b.id === batchId)?.campus_id ?? "";

  function handleBatchChange(id: string) {
    setBatchId(id);
    const p = plans.find((x) => x.batch_id === id && String(x.week_number) === weekNumber);
    setDescription(p?.description ?? "");
  }

  function handleWeekChange(w: string) {
    setWeekNumber(w);
    const p = plans.find((x) => x.batch_id === batchId && String(x.week_number) === w);
    setDescription(p?.description ?? "");
  }

  function editPlan(p: LessonPlan) {
    setBatchId(p.batch_id);
    setWeekNumber(String(p.week_number));
    setDescription(p.description);
  }

  const batchLabel = (id: string) =>
    assignedBatches.find((b) => b.id === id)?.label ?? "Batch";

  const sortedPlans = [...plans].sort((a, b) =>
    a.batch_id === b.batch_id ? a.week_number - b.week_number : batchLabel(a.batch_id).localeCompare(batchLabel(b.batch_id)),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={isUpdate ? "Edit Plan" : "Save Plan"}
          subtitle={`Weekly teaching agenda for ${monthLabel}. Saving an existing batch + week updates it.`}
        />
        <form action={formAction} className="grid gap-4 p-5 md:grid-cols-2">
          <input type="hidden" name="target_month" value={month} />
          <input type="hidden" name="campus_id" value={campusId} />

          <div>
            <Label htmlFor="batch_id">Batch</Label>
            <Select
              id="batch_id"
              name="batch_id"
              required
              value={batchId}
              onChange={(e) => handleBatchChange(e.target.value)}
            >
              <option value="">— Select a batch —</option>
              {assignedBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="week_number">Week</Label>
            <Select
              id="week_number"
              name="week_number"
              required
              value={weekNumber}
              onChange={(e) => handleWeekChange(e.target.value)}
            >
              <option value="">— Select a week —</option>
              {LESSON_PLAN_WEEKS.map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description">Lesson Description</Label>
            <Textarea
              id="description"
              name="description"
              required
              className="min-h-32"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Topics, learning objectives, and materials to cover this week"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-600 md:col-span-2">{state.error}</p>
          )}

          <div className="md:col-span-2">
            <Button type="submit" disabled={!batchId || !weekNumber}>
              {isUpdate ? "Update Plan" : "Save Plan"}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Your Plans" subtitle={`${monthLabel} · ${plans.length} saved`} />
        {sortedPlans.length === 0 ? (
          <EmptyState icon="📝" title="No plans saved for this month yet" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {sortedPlans.map((p) => (
              <li key={p.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                      Week {p.week_number}
                    </span>
                    <span className="ml-2 text-sm font-medium text-slate-800">
                      {batchLabel(p.batch_id)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => editPlan(p)}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                    >
                      Edit
                    </button>
                    <form action={deleteLessonPlan}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {p.description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
