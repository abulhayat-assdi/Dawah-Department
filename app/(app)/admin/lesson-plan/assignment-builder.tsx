"use client";

import { useActionState, useMemo, useState } from "react";
import { Label, Input, Select, Button } from "@/components/ui";
import { saveMonthlyAssignment, type AssignmentFormState } from "./actions";

export interface TeacherOpt {
  id: string;
  full_name: string;
}

export interface TeacherBatchOpt {
  teacher_id: string;
  batch_id: string;
  label: string;
}

export interface AssignmentOpt {
  teacher_id: string;
  batch_id: string;
  target_month: string;
}

export function AssignmentBuilder({
  teachers,
  teacherBatches,
  assignments,
  onSaved,
}: {
  teachers: TeacherOpt[];
  teacherBatches: TeacherBatchOpt[];
  assignments: AssignmentOpt[];
  onSaved?: () => void;
}) {
  const [state, formAction] = useActionState<AssignmentFormState, FormData>(
    saveMonthlyAssignment,
    null,
  );

  const [handled, setHandled] = useState<AssignmentFormState>(null);
  if (state && state !== handled) {
    setHandled(state);
    if (state.ok) onSaved?.();
  }

  const [teacherId, setTeacherId] = useState("");
  const [month, setMonth] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const batchesForTeacher = useMemo(
    () => teacherBatches.filter((b) => b.teacher_id === teacherId),
    [teacherBatches, teacherId],
  );

  function prefillChecked(tId: string, m: string) {
    setChecked(
      new Set(
        assignments
          .filter((a) => a.teacher_id === tId && a.target_month === m)
          .map((a) => a.batch_id),
      ),
    );
  }

  function handleTeacherChange(id: string) {
    setTeacherId(id);
    prefillChecked(id, month);
  }

  function handleMonthChange(m: string) {
    setMonth(m);
    prefillChecked(teacherId, m);
  }

  function toggleBatch(id: string) {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
  }

  return (
    <form action={formAction} className="grid gap-4 p-5 md:grid-cols-2">
      <div>
        <Label htmlFor="teacher_id">Teacher</Label>
        <Select
          id="teacher_id"
          name="teacher_id"
          required
          value={teacherId}
          onChange={(e) => handleTeacherChange(e.target.value)}
        >
          <option value="">— Select a teacher —</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="target_month">Month</Label>
        <Input
          id="target_month"
          name="target_month"
          type="month"
          required
          value={month}
          onChange={(e) => handleMonthChange(e.target.value)}
        />
      </div>

      <div className="md:col-span-2">
        <Label>Batches</Label>
        {!teacherId ? (
          <p className="text-sm text-slate-500">Select a teacher first.</p>
        ) : batchesForTeacher.length === 0 ? (
          <p className="text-sm text-slate-500">This teacher has no assigned batches.</p>
        ) : (
          <div className="grid gap-1.5 sm:grid-cols-2">
            {batchesForTeacher.map((b) => (
              <label
                key={b.batch_id}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={checked.has(b.batch_id)}
                  onChange={() => toggleBatch(b.batch_id)}
                  className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                {b.label}
              </label>
            ))}
          </div>
        )}
      </div>

      {[...checked].map((id) => (
        <input key={id} type="hidden" name="batch_id" value={id} />
      ))}

      {state?.error && <p className="text-sm text-red-600 md:col-span-2">{state.error}</p>}

      <div className="md:col-span-2">
        <Button type="submit" disabled={!teacherId || !month}>
          Save Assignment
        </Button>
      </div>
    </form>
  );
}
