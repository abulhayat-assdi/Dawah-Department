"use client";

import { useActionState, useMemo, useState } from "react";
import { Label, Input, Textarea, Select, Button } from "@/components/ui";
import { DAYS_OF_WEEK, ROUTINE_CLASS_TYPE } from "@/lib/constants";
import { toTimeInput } from "@/lib/utils";
import type { CampusRoutine, RoutineClassType } from "@/lib/types";
import { saveRoutine, deleteRoutine, type RoutineFormState } from "./actions";
import type { CampusOpt, RoutineBatch } from "./routine-viewer";

export function RoutineBuilder({
  campuses,
  batches,
  routines,
  onSaved,
}: {
  campuses: CampusOpt[];
  batches: RoutineBatch[];
  routines: CampusRoutine[];
  onSaved?: () => void;
}) {
  const [state, formAction] = useActionState<RoutineFormState, FormData>(
    saveRoutine,
    null,
  );

  // Collapse the builder back to the overview once a save succeeds. Guarded
  // so it only fires once per new action result (see amali-form-modal.tsx
  // for the same pattern).
  const [handled, setHandled] = useState<RoutineFormState>(null);
  if (state && state !== handled) {
    setHandled(state);
    if (state.ok) onSaved?.();
  }

  const [campusId, setCampusId] = useState("");
  const [batchId, setBatchId] = useState("");

  const [quranStart, setQuranStart] = useState("");
  const [quranEnd, setQuranEnd] = useState("");
  const [quranDays, setQuranDays] = useState<Set<number>>(new Set());
  const [dawahStart, setDawahStart] = useState("");
  const [dawahEnd, setDawahEnd] = useState("");
  const [dawahDays, setDawahDays] = useState<Set<number>>(new Set());
  const [note, setNote] = useState("");

  const filteredBatches = useMemo(
    () => (campusId ? batches.filter((b) => b.campus_id === campusId) : []),
    [batches, campusId],
  );

  const existing = routines.find((r) => r.batch_id === batchId);
  const isUpdate = Boolean(existing);

  function handleCampusChange(id: string) {
    setCampusId(id);
    setBatchId("");
    resetFields();
  }

  function resetFields() {
    setQuranStart("");
    setQuranEnd("");
    setQuranDays(new Set());
    setDawahStart("");
    setDawahEnd("");
    setDawahDays(new Set());
    setNote("");
  }

  // Prefill from the batch's saved routine so the form doubles as an editor.
  function handleBatchChange(id: string) {
    setBatchId(id);
    const r = routines.find((x) => x.batch_id === id);
    if (!r) {
      resetFields();
      return;
    }
    setQuranStart(toTimeInput(r.quran_start));
    setQuranEnd(toTimeInput(r.quran_end));
    setQuranDays(new Set(r.quran_days ?? []));
    setDawahStart(toTimeInput(r.dawah_start));
    setDawahEnd(toTimeInput(r.dawah_end));
    setDawahDays(new Set(r.dawah_days ?? []));
    setNote(r.note ?? "");
  }

  function toggleDay(set: Set<number>, setter: (s: Set<number>) => void, day: number) {
    const next = new Set(set);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    setter(next);
  }

  return (
    <form action={formAction} className="grid gap-4 p-5 md:grid-cols-2">
      {/* --------------------------------------------- Campus & Batch */}
      <div>
        <Label htmlFor="campus_id">Campus</Label>
        <Select
          id="campus_id"
          name="campus_id"
          required
          value={campusId}
          onChange={(e) => handleCampusChange(e.target.value)}
        >
          <option value="">— Select a campus —</option>
          {campuses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="batch_id">Batch</Label>
        <Select
          id="batch_id"
          name="batch_id"
          required
          value={batchId}
          onChange={(e) => handleBatchChange(e.target.value)}
          disabled={!campusId}
        >
          <option value="">
            {!campusId
              ? "Select a campus first"
              : filteredBatches.length
                ? "— Select a batch —"
                : "No batches on this campus"}
          </option>
          {filteredBatches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.abbr} — Batch {b.batch_no}
              {routines.some((r) => r.batch_id === b.id) ? " ✓" : ""}
            </option>
          ))}
        </Select>
      </div>

      {/* --------------------------------------------------- Class blocks */}
      <ClassBlock
        type="quran"
        start={quranStart}
        end={quranEnd}
        days={quranDays}
        onStart={setQuranStart}
        onEnd={setQuranEnd}
        onToggleDay={(d) => toggleDay(quranDays, setQuranDays, d)}
      />
      <ClassBlock
        type="dawah"
        start={dawahStart}
        end={dawahEnd}
        days={dawahDays}
        onStart={setDawahStart}
        onEnd={setDawahEnd}
        onToggleDay={(d) => toggleDay(dawahDays, setDawahDays, d)}
      />

      {/* Serialise the selected days as repeated hidden fields for FormData. */}
      {[...quranDays].map((d) => (
        <input key={`q${d}`} type="hidden" name="quran_days" value={d} />
      ))}
      {[...dawahDays].map((d) => (
        <input key={`d${d}`} type="hidden" name="dawah_days" value={d} />
      ))}

      <div className="md:col-span-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          name="note"
          className="min-h-16"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Room, instructor, or any special instruction"
        />
      </div>

      {/* Carries the routine id so the Delete button (formAction) can target it. */}
      {existing && <input type="hidden" name="id" value={existing.id} />}

      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <Button type="submit" disabled={!batchId}>
          {isUpdate ? "Update Routine" : "Save Routine"}
        </Button>
        {isUpdate && (
          <Button
            type="submit"
            variant="danger"
            formAction={deleteRoutine}
            formNoValidate
          >
            Delete Routine
          </Button>
        )}
      </div>
    </form>
  );
}

function ClassBlock({
  type,
  start,
  end,
  days,
  onStart,
  onEnd,
  onToggleDay,
}: {
  type: RoutineClassType;
  start: string;
  end: string;
  days: Set<number>;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
  onToggleDay: (day: number) => void;
}) {
  const meta = ROUTINE_CLASS_TYPE[type];
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={`size-2.5 rounded-full ${meta.dot}`} />
        <h4 className={`text-sm font-semibold ${meta.text}`}>{meta.label}</h4>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${type}_start`}>Start Time</Label>
          <Input
            id={`${type}_start`}
            name={`${type}_start`}
            type="time"
            value={start}
            onChange={(e) => onStart(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`${type}_end`}>End Time</Label>
          <Input
            id={`${type}_end`}
            name={`${type}_end`}
            type="time"
            value={end}
            onChange={(e) => onEnd(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3">
        <Label>Days</Label>
        <div className="flex flex-wrap gap-1.5">
          {DAYS_OF_WEEK.map((d) => {
            const active = days.has(d.index);
            return (
              <button
                type="button"
                key={d.index}
                onClick={() => onToggleDay(d.index)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                  active
                    ? `border-transparent ${meta.bg} ${meta.text} ring-2 ${meta.ring}`
                    : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                {d.short}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
