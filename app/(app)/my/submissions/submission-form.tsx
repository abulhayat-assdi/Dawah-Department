"use client";

import { useMemo, useState } from "react";
import { Label, Input, Textarea, Select, Button } from "@/components/ui";
import { FileUpload } from "@/components/file-upload";
import { MultiFileUpload } from "@/components/multi-file-upload";
import { TASK_CLASS_TYPE } from "@/lib/constants";
import type { TaskClassType } from "@/lib/types";
import { createSubmission } from "./actions";

export interface SubBatchOption {
  id: string;
  campus_id: string | null;
  course_id: string | null;
  label: string;
}

export interface SubCourseOption {
  id: string;
  campus_id: string | null;
  label: string;
}

/** A batch the teacher was allocated for the current month. */
export interface AllocatedBatch {
  batch_id: string;
  class_type: TaskClassType;
  campus_id: string | null;
  label: string;
}

// Teachers submit against these categories (allocation-only types are excluded
// where they make no sense — but all five are valid submission kinds).
const SUBMIT_TYPES: TaskClassType[] = [
  "quran",
  "dawah",
  "staff",
  "other",
  "form_verification",
];

// Other Task can, in addition to a plain task, log a class covering someone
// else's batch ("makeup") or an extra staff class ("staff_makeup"). Both
// submit as a real quran/dawah/staff class with is_additional = true — the
// same mechanism the Quran/Dawah tabs already use — so they show up
// correctly ("+1 additional class") on the Task Report.
type OtherSubmode = "plain" | "makeup" | "staff_makeup";

export function SubmissionForm({
  allocatedBatches,
  allBatches,
  myCampusBatches,
  myCampusId,
  courses,
  monthLabel,
}: {
  allocatedBatches: AllocatedBatch[];
  allBatches: SubBatchOption[];
  myCampusBatches: SubBatchOption[];
  myCampusId: string | null;
  courses: SubCourseOption[];
  monthLabel: string;
}) {
  const [classType, setClassType] = useState<TaskClassType>("quran");
  const [additional, setAdditional] = useState(false);
  const [batchId, setBatchId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [otherSubmode, setOtherSubmode] = useState<OtherSubmode>("plain");
  const [makeupType, setMakeupType] = useState<"quran" | "dawah">("quran");
  const [makeupBatchId, setMakeupBatchId] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const meta = TASK_CLASS_TYPE[classType];

  // The class_type actually submitted: Other Task's makeup checkboxes
  // override it to quran/dawah/staff so the report credits the right quota.
  const effectiveClassType: TaskClassType =
    classType === "other"
      ? otherSubmode === "makeup"
        ? makeupType
        : otherSubmode === "staff_makeup"
          ? "staff"
          : "other"
      : classType;

  // For Quran/Dawah the default batch list is only the teacher's allocations for
  // this month; the "additional class" toggle widens it to every system batch.
  const quranDawahBatches = useMemo(() => {
    if (additional) return allBatches;
    return allocatedBatches
      .filter((b) => b.class_type === classType)
      .map((b) => ({
        id: b.batch_id,
        campus_id: b.campus_id,
        course_id: null,
        label: b.label,
      }));
  }, [additional, allBatches, allocatedBatches, classType]);

  // Form Verification batches are filtered by the selected course.
  const courseBatches = useMemo(
    () => allBatches.filter((b) => b.course_id === courseId),
    [allBatches, courseId],
  );

  // Derive campus of the current selection so the server can scope it.
  const campusId = useMemo(() => {
    if (classType === "other" && otherSubmode === "makeup") {
      return myCampusBatches.find((b) => b.id === makeupBatchId)?.campus_id ?? "";
    }
    if (classType === "other" && otherSubmode === "staff_makeup") {
      return myCampusId ?? "";
    }
    if (meta.needsCourse) {
      return courses.find((c) => c.id === courseId)?.campus_id ?? "";
    }
    if (meta.needsBatch) {
      return allBatches.find((b) => b.id === batchId)?.campus_id ?? "";
    }
    return "";
  }, [
    classType,
    otherSubmode,
    myCampusBatches,
    makeupBatchId,
    myCampusId,
    meta,
    courses,
    courseId,
    allBatches,
    batchId,
  ]);

  // Reset dependent selections when the type changes.
  function pickType(ct: TaskClassType) {
    setClassType(ct);
    setBatchId("");
    setCourseId("");
    setAdditional(false);
    setOtherSubmode("plain");
    setMakeupType("quran");
    setMakeupBatchId("");
  }

  return (
    <form
      action={createSubmission}
      className="grid gap-3 p-5 md:grid-cols-2"
      key={classType}
    >
      <input type="hidden" name="campus_id" value={campusId} />
      <input type="hidden" name="class_type" value={effectiveClassType} />
      {classType === "other" && otherSubmode !== "plain" && (
        <input type="hidden" name="is_additional" value="on" />
      )}

      {/* -------------------------------------------------- Type selector */}
      <div className="md:col-span-2">
        <Label>What are you submitting?</Label>
        <div className="flex flex-wrap gap-2">
          {SUBMIT_TYPES.map((ct) => {
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
                  name="submission_tab"
                  value={ct}
                  checked={active}
                  onChange={() => pickType(ct)}
                  className="sr-only"
                />
                {TASK_CLASS_TYPE[ct].label}
              </label>
            );
          })}
        </div>
      </div>

      {/* ============================== A. Quran / Dawah class ============= */}
      {(classType === "quran" || classType === "dawah") && (
        <>
          <div className="md:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                name="is_additional"
                checked={additional}
                onChange={(e) => {
                  setAdditional(e.target.checked);
                  setBatchId("");
                }}
                className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Taken additional class (a batch not in my {monthLabel} allocation)
            </label>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="batch_id">Batch</Label>
            <Select
              id="batch_id"
              name="batch_id"
              required
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
            >
              <option value="">
                {quranDawahBatches.length
                  ? "— Select a batch —"
                  : additional
                    ? "No batches available"
                    : `No ${TASK_CLASS_TYPE[classType].label} allocation for ${monthLabel}`}
              </option>
              {quranDawahBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="submission_date">Class Date</Label>
            <Input
              id="submission_date"
              name="submission_date"
              type="date"
              required
              defaultValue={today}
            />
          </div>
          <div>
            <Label htmlFor="topic">Class Topic</Label>
            <Input id="topic" name="topic" required />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea id="comments" name="comments" className="min-h-16" />
          </div>
        </>
      )}

      {/* ============================== B. Staff class ==================== */}
      {classType === "staff" && (
        <>
          <div>
            <Label htmlFor="submission_date">Class Date</Label>
            <Input
              id="submission_date"
              name="submission_date"
              type="date"
              required
              defaultValue={today}
            />
          </div>
          <div>
            <Label htmlFor="topic">Class Topic</Label>
            <Input id="topic" name="topic" required />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea id="comments" name="comments" className="min-h-16" />
          </div>
        </>
      )}

      {/* ============================== C. Other task ==================== */}
      {classType === "other" && (
        <>
          <div className="md:col-span-2 space-y-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={otherSubmode === "makeup"}
                onChange={(e) => {
                  setOtherSubmode(e.target.checked ? "makeup" : "plain");
                  setMakeupBatchId("");
                }}
                className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Makeup Class (covered a batch you weren&apos;t assigned to)
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={otherSubmode === "staff_makeup"}
                onChange={(e) =>
                  setOtherSubmode(e.target.checked ? "staff_makeup" : "plain")
                }
                className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Staff Makeup Class (took an extra staff class)
            </label>
          </div>

          {otherSubmode === "makeup" && (
            <>
              <div className="md:col-span-2">
                <Label>Class Category</Label>
                <div className="flex flex-wrap gap-2">
                  {(["quran", "dawah"] as const).map((t) => {
                    const active = makeupType === t;
                    return (
                      <label
                        key={t}
                        className={`cursor-pointer rounded-xl border px-3.5 py-2.5 text-sm font-medium transition ${
                          active
                            ? "border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-100"
                            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          checked={active}
                          onChange={() => {
                            setMakeupType(t);
                            setMakeupBatchId("");
                          }}
                          className="sr-only"
                        />
                        {TASK_CLASS_TYPE[t].label}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="batch_id">Batch (your campus)</Label>
                <Select
                  id="batch_id"
                  name="batch_id"
                  required
                  value={makeupBatchId}
                  onChange={(e) => setMakeupBatchId(e.target.value)}
                >
                  <option value="">
                    {myCampusBatches.length
                      ? "— Select a batch —"
                      : "No batches found for your campus"}
                  </option>
                  {myCampusBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </Select>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="submission_date">
              {otherSubmode === "plain" ? "Completion Date" : "Class Date"}
            </Label>
            <Input
              id="submission_date"
              name="submission_date"
              type="date"
              required
              defaultValue={today}
            />
          </div>
          {otherSubmode !== "plain" && (
            <div>
              <Label htmlFor="topic">Class Topic</Label>
              <Input id="topic" name="topic" />
            </div>
          )}
          <div className="md:col-span-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea id="comments" name="comments" className="min-h-16" />
          </div>
          <div className="md:col-span-2">
            <MultiFileUpload
              name="files"
              bucket="task-files"
              maxSizeMB={100}
              label="Attachments (optional, up to 100 MB each)"
            />
          </div>
        </>
      )}

      {/* ============================== D. Form Verification ============= */}
      {classType === "form_verification" && (
        <>
          <div className="md:col-span-2">
            <Label htmlFor="course_id">Course</Label>
            <Select
              id="course_id"
              name="course_id"
              required
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setBatchId("");
              }}
            >
              <option value="">— Select a course —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="batch_id">Batch</Label>
            <Select
              id="batch_id"
              name="batch_id"
              required
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              disabled={!courseId}
            >
              <option value="">
                {!courseId
                  ? "Select a course first"
                  : courseBatches.length
                    ? "— Select a batch —"
                    : "No batches for this course"}
              </option>
              {courseBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="submission_date">Date</Label>
            <Input
              id="submission_date"
              name="submission_date"
              type="date"
              required
              defaultValue={today}
            />
          </div>
          <div>
            <Label htmlFor="verified_count">Number of Verified Forms</Label>
            <Input
              id="verified_count"
              name="verified_count"
              type="number"
              min={0}
              required
              defaultValue={0}
            />
          </div>
          <div className="md:col-span-2">
            <FileUpload
              name="file_url"
              nameField="file_name"
              bucket="task-files"
              kind="file"
              maxSizeMB={100}
              label="Attachment (optional, up to 100 MB)"
            />
          </div>
        </>
      )}

      <div className="md:col-span-2">
        <Button type="submit">Submit</Button>
      </div>
    </form>
  );
}
