"use client";

import { useMemo, useState } from "react";
import { Button, Select } from "@/components/ui";
import type { Campus, Course } from "@/lib/types";

export function TrackerFilters({
  campuses,
  courses,
  campusId,
  courseId,
}: {
  campuses: Campus[];
  courses: Course[];
  campusId: string;
  courseId: string;
}) {
  const [campus, setCampus] = useState(campusId);
  const [course, setCourse] = useState(courseId);

  // Only show courses assigned to the selected campus; all courses when none selected.
  const availableCourses = useMemo(
    () => (campus ? courses.filter((c) => c.campus_id === campus) : courses),
    [campus, courses],
  );

  function handleCampusChange(newCampusId: string) {
    setCampus(newCampusId);
    const stillValid =
      !newCampusId || courses.some((c) => c.id === course && c.campus_id === newCampusId);
    if (!stillValid) setCourse("");
  }

  return (
    <form method="get" className="grid gap-3 p-5 sm:grid-cols-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-500">
          Campus
        </label>
        <Select
          name="campus_id"
          value={campus}
          onChange={(e) => handleCampusChange(e.target.value)}
        >
          <option value="">All campuses</option>
          {campuses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-500">
          Course
        </label>
        <Select
          name="course_id"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
        >
          <option value="">All courses</option>
          {availableCourses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.abbreviation} — {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" className="flex-1">
          Filter
        </Button>
        {(campusId || courseId) && (
          <a
            href="/admin/tracker"
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Clear
          </a>
        )}
      </div>
    </form>
  );
}
