"use client";

import { useMemo, useState } from "react";
import { DAYS_OF_WEEK, ROUTINE_CLASS_TYPE } from "@/lib/constants";
import { formatTime } from "@/lib/utils";
import type { CampusRoutine, RoutineClassType } from "@/lib/types";

export interface CampusOpt {
  id: string;
  name: string;
}
export interface CourseOpt {
  id: string;
  campus_id: string | null;
  abbreviation: string;
  name: string;
}
export interface RoutineBatch {
  id: string;
  campus_id: string | null;
  course_id: string | null;
  abbr: string;
  name: string;
  batch_no: string;
}

interface Session {
  key: string;
  type: RoutineClassType;
  day: number;
  start: string | null;
  end: string | null;
  campusId: string | null;
  courseId: string | null;
  abbr: string;
  batchNo: string;
}

/** Minutes-since-midnight for sorting; nulls sort last. */
function startMinutes(t: string | null): number {
  if (!t) return 24 * 60 + 1;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function RoutineViewer({
  campuses,
  courses,
  batches,
  routines,
  canEdit,
}: {
  campuses: CampusOpt[];
  courses: CourseOpt[];
  batches: RoutineBatch[];
  routines: CampusRoutine[];
  canEdit: boolean;
}) {
  const [campusId, setCampusId] = useState("");
  const [courseId, setCourseId] = useState("");

  const batchById = useMemo(
    () => new Map(batches.map((b) => [b.id, b])),
    [batches],
  );

  // Flatten every routine into per-day/per-class-type sessions.
  const sessions = useMemo<Session[]>(() => {
    const out: Session[] = [];
    for (const r of routines) {
      const batch = batchById.get(r.batch_id);
      if (!batch) continue;
      const blocks: {
        type: RoutineClassType;
        days: number[];
        start: string | null;
        end: string | null;
      }[] = [
        { type: "quran", days: r.quran_days ?? [], start: r.quran_start, end: r.quran_end },
        { type: "dawah", days: r.dawah_days ?? [], start: r.dawah_start, end: r.dawah_end },
      ];
      for (const block of blocks) {
        for (const day of block.days) {
          out.push({
            key: `${r.id}-${block.type}-${day}`,
            type: block.type,
            day,
            start: block.start,
            end: block.end,
            campusId: r.campus_id ?? batch.campus_id,
            courseId: batch.course_id,
            abbr: batch.abbr,
            batchNo: batch.batch_no,
          });
        }
      }
    }
    return out;
  }, [routines, batchById]);

  const availableCourses = useMemo(
    () => (campusId ? courses.filter((c) => c.campus_id === campusId) : courses),
    [campusId, courses],
  );

  const filtered = useMemo(
    () =>
      sessions.filter(
        (s) =>
          (!campusId || s.campusId === campusId) &&
          (!courseId || s.courseId === courseId),
      ),
    [sessions, campusId, courseId],
  );

  const byDay = useMemo(() => {
    const map = new Map<number, Session[]>();
    for (const d of DAYS_OF_WEEK) map.set(d.index, []);
    for (const s of filtered) map.get(s.day)?.push(s);
    for (const list of map.values())
      list.sort((a, b) => startMinutes(a.start) - startMinutes(b.start));
    return map;
  }, [filtered]);

  function handleCampusChange(id: string) {
    setCampusId(id);
    if (id && !courses.some((c) => c.id === courseId && c.campus_id === id)) {
      setCourseId("");
    }
  }

  const hasAny = filtered.length > 0;

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------ Filters */}
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Filter by Campus
          </label>
          <select
            value={campusId}
            onChange={(e) => handleCampusChange(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">All campuses</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Filter by Course
          </label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">All courses</option>
            {availableCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.abbreviation} — {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-3">
          {(campusId || courseId) && (
            <button
              onClick={() => {
                setCampusId("");
                setCourseId("");
              }}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear filters
            </button>
          )}
          <div className="flex flex-wrap items-center gap-3 self-end pb-0.5 text-xs text-slate-500">
            {(["quran", "dawah"] as RoutineClassType[]).map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <span className={`size-2.5 rounded-full ${ROUTINE_CLASS_TYPE[t].dot}`} />
                {ROUTINE_CLASS_TYPE[t].label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------ Glass weekly grid */}
      <div className="routine-stage islamic-pattern overflow-hidden rounded-3xl p-4 sm:p-6">
        {!hasAny ? (
          <div className="grid place-items-center px-6 py-16 text-center">
            <div className="text-4xl">🗓️</div>
            <p className="mt-3 font-semibold text-white">No classes scheduled</p>
            <p className="mt-1 text-sm text-white/70">
              {campusId || courseId
                ? "Try clearing the filters."
                : canEdit
                  ? "Use the Schedule Builder above to add a routine."
                  : "The routine has not been published yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {DAYS_OF_WEEK.map((d) => {
              const items = byDay.get(d.index) ?? [];
              return (
                <div key={d.index} className="glass-card rounded-2xl p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white drop-shadow">
                      {d.label}
                    </h3>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {items.length === 0 && (
                      <p className="py-4 text-center text-xs text-white/60">—</p>
                    )}
                    {items.map((s) => {
                      const meta = ROUTINE_CLASS_TYPE[s.type];
                      return (
                        <div key={s.key} className="glass-tile rounded-xl p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.bg} ${meta.text}`}
                            >
                              <span className={`size-1.5 rounded-full ${meta.dot}`} />
                              {meta.label}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm font-bold text-slate-900">
                            {s.abbr}{" "}
                            <span className="font-medium text-slate-500">
                              · Batch {s.batchNo}
                            </span>
                          </p>
                          {(s.start || s.end) && (
                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-600">
                              <span aria-hidden>🕒</span>
                              {formatTime(s.start)}
                              {s.end ? ` – ${formatTime(s.end)}` : ""}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
