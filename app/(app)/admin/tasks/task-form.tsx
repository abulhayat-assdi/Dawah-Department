"use client";

import { useMemo, useState } from "react";
import { Label, Input, Textarea, Select, Button } from "@/components/ui";
import { PRIORITY_LABEL, TASK_CLASS_TYPE } from "@/lib/constants";
import type { Profile, TaskClassType } from "@/lib/types";
import { createTask } from "./actions";

export interface BatchOption {
  id: string;
  campus_id: string | null;
  campus_name: string | null;
  course_id: string | null;
  label: string;
}

export interface CourseOption {
  id: string;
  campus_id: string | null;
  label: string;
}

export interface MonthOption {
  value: string; // "YYYY-MM"
  label: string; // "August 2026"
}

const CLASS_TYPES = Object.keys(TASK_CLASS_TYPE) as TaskClassType[];

export function TaskForm({
  assignees,
  batches,
  courses,
  months,
  currentUserId,
}: {
  assignees: Profile[];
  batches: BatchOption[];
  courses: CourseOption[];
  months: MonthOption[];
  currentUserId: string;
}) {
  const [classType, setClassType] = useState<TaskClassType>("quran");
  const [courseId, setCourseId] = useState("");

  const meta = TASK_CLASS_TYPE[classType];

  // Every batch-bearing class type also needs a Course first — a course can
  // have several batches, so narrowing by course keeps the Batch dropdown
  // short. A batch's campus is carried on the batch itself, so no separate
  // campus picker is needed (and no batches get hidden behind a mismatched
  // campus choice).
  const filteredBatches = useMemo(
    () => batches.filter((b) => b.course_id === courseId),
    [batches, courseId],
  );

  return (
    <form action={createTask} className="grid gap-3 p-5 md:grid-cols-2">
      {/* -------------------------------------------------- Core fields */}
      <div>
        <Label htmlFor="title">Title</Label>
        {classType === "other" ? (
          <Input id="title" name="title" required />
        ) : (
          <>
            <input type="hidden" name="title" value={meta.label} />
            <div
              className={`flex h-[42px] items-center rounded-xl border border-transparent px-3.5 text-sm font-semibold ${meta.bg} ${meta.text}`}
            >
              {meta.label}
            </div>
          </>
        )}
      </div>
      <div>
        <Label htmlFor="assigned_to">Assign to</Label>
        <Select id="assigned_to" name="assigned_to" required defaultValue="">
          <option value="">— Select —</option>
          {assignees.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name}
              {t.id === currentUserId ? " (Myself)" : ""}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Class / Task Type</Label>
        <div className="flex flex-wrap gap-2">
          {CLASS_TYPES.map((ct) => {
            const active = classType === ct;
            return (
              <label
                key={ct}
                className={`cursor-pointer rounded-xl border px-3.5 py-2.5 text-sm font-medium transition ${
                  active
                    ? "border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-100"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="class_type"
                  value={ct}
                  checked={active}
                  onChange={() => setClassType(ct)}
                  className="sr-only"
                />
                {TASK_CLASS_TYPE[ct].label}
              </label>
            );
          })}
        </div>
      </div>

      {/* ---------------- Course (Quran / Dawah / Form Verification) — picked
           before Batch, since a course can have several batches. */}
      {meta.needsCourse && (
        <div className="md:col-span-2">
          <Label htmlFor="course_id">Course</Label>
          <Select
            id="course_id"
            name="course_id"
            required
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">— Select a course —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* --------------------------------- Batch (always by selected course) */}
      {meta.needsBatch && (
        <div className="md:col-span-2">
          <Label htmlFor="batch_id">Batch</Label>
          <Select
            id="batch_id"
            name="batch_id"
            required
            defaultValue=""
            disabled={!courseId}
          >
            <option value="">
              {!courseId
                ? "Select a course first"
                : filteredBatches.length
                  ? "— Select a batch —"
                  : "No batches for this course"}
            </option>
            {filteredBatches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
                {b.campus_name ? ` — ${b.campus_name}` : ""}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* -------------------- Monthly quota (Quran / Dawah / Staff / Form Verif) */}
      {meta.monthly && (
        <>
          <div>
            <Label htmlFor="target_month">Target Month</Label>
            <Select
              id="target_month"
              name="target_month"
              required
              defaultValue={months[0]?.value ?? ""}
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="target_count">{meta.countLabel}</Label>
            <Input
              id="target_count"
              name="target_count"
              type="number"
              min={0}
              required
              defaultValue={0}
            />
          </div>
        </>
      )}

      {/* ------------------------------- Due date & Priority (Other task) */}
      {!meta.monthly && (
        <>
          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Input id="due_date" name="due_date" type="date" required />
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select id="priority" name="priority" defaultValue="0">
              <option value="0">{PRIORITY_LABEL[0]}</option>
              <option value="1">{PRIORITY_LABEL[1]}</option>
            </Select>
          </div>
        </>
      )}

      {/* -------------------------------------------- Description (always) */}
      <div className="md:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          className="min-h-16"
          placeholder="Comments / special instructions"
        />
      </div>

      <div className="md:col-span-2">
        <Button type="submit">Add Task</Button>
      </div>
    </form>
  );
}
