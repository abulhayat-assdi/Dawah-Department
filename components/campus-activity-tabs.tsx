"use client";

import { useMemo, useState } from "react";
import { clsx, toBn } from "@/lib/utils";
import type { Campus } from "@/lib/types";

export interface RunningCourseRow {
  course_id: string;
  course_name: string;
  abbreviation: string;
  duration_label: string | null;
  campus_id: string;
  batch_count: number;
  active_student_count: number;
}

// Canonical campus display order; any campus not in this list is appended
// after these three (alphabetically), so the page never breaks if a new
// campus is added in the admin panel.
const CAMPUS_ORDER = ["50-Katha Technical Campus", "Kazibari Campus", "Satarkul Campus"];

export function CampusActivityTabs({
  campuses,
  rows,
}: {
  campuses: Campus[];
  rows: RunningCourseRow[];
}) {
  const sortedCampuses = useMemo(() => {
    return [...campuses].sort((a, b) => {
      const ia = CAMPUS_ORDER.indexOf(a.name);
      const ib = CAMPUS_ORDER.indexOf(b.name);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      return a.name.localeCompare(b.name);
    });
  }, [campuses]);

  const [activeId, setActiveId] = useState(sortedCampuses[0]?.id ?? "");
  const active = sortedCampuses.find((c) => c.id === activeId) ?? sortedCampuses[0];
  const courses = rows.filter((r) => r.campus_id === active?.id);

  if (!active) {
    return <p className="text-center text-slate-400">শীঘ্রই ক্যাম্পাসের তথ্য যুক্ত হবে।</p>;
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {sortedCampuses.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className={clsx(
              "rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
              c.id === active.id
                ? "border-brand-700 bg-brand-700 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {active.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={active.image_url} alt={active.name} className="aspect-[3/1] w-full object-cover" />
        ) : (
          <div className="grid aspect-[3/1] place-items-center bg-brand-50 text-6xl text-brand-200">
            🏫
          </div>
        )}
        <div className="p-7">
          <h2 className="text-2xl font-bold text-slate-900">{active.name}</h2>
          {active.address && <p className="mt-1 text-slate-500">📍 {active.address}</p>}
          {active.description && <p className="mt-4 text-slate-600">{active.description}</p>}
        </div>
      </div>

      <h3 className="mt-10 text-xl font-bold text-slate-900">কোর্সসমূহ</h3>
      {courses.length === 0 ? (
        <p className="mt-3 text-slate-400">এই ক্যাম্পাসে এখন কোনো কোর্স চালু নেই।</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {courses.map((co) => (
            <div
              key={co.course_id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900">{co.course_name}</h4>
                </div>
                {co.batch_count > 0 && (
                  <span className="shrink-0 rounded-lg bg-brand-50 px-3 py-1.5 text-center text-xs font-semibold text-brand-700">
                    🧑‍🎓 {toBn(co.active_student_count)} জন শিক্ষার্থী
                  </span>
                )}
              </div>
              {co.batch_count > 0 && (
                <p className="mt-3 text-xs text-slate-400">
                  {toBn(co.batch_count)}টি চলমান ব্যাচ
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
