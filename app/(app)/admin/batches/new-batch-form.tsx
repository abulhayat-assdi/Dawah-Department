"use client";

import { useState } from "react";
import { Label, Input, Select, Button } from "@/components/ui";
import type { Campus, Course } from "@/lib/types";
import { createBatch } from "./actions";

export function NewBatchForm({ courses, campuses }: { courses: Course[]; campuses: Campus[] }) {
  const [campusId, setCampusId] = useState("");

  // A course belongs to a single campus, so picking it should pick the campus
  // for the coordinator instead of making them do it twice.
  function handleCourseChange(courseId: string) {
    const course = courses.find((c) => c.id === courseId);
    if (course?.campus_id && campuses.some((c) => c.id === course.campus_id)) {
      setCampusId(course.campus_id);
    }
  }

  return (
    <form action={createBatch} className="grid gap-3 p-5 md:grid-cols-3 lg:grid-cols-6">
      <div className="md:col-span-2">
        <Label htmlFor="course_id">Course</Label>
        <Select
          id="course_id"
          name="course_id"
          required
          defaultValue=""
          onChange={(e) => handleCourseChange(e.target.value)}
        >
          <option value="">— Select —</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.abbreviation} — {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="campus_id">Campus</Label>
        <Select
          id="campus_id"
          name="campus_id"
          required
          value={campusId}
          onChange={(e) => setCampusId(e.target.value)}
        >
          <option value="">— Select —</option>
          {campuses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="batch_no">Batch No.</Label>
        <Input id="batch_no" name="batch_no" required placeholder="01" />
      </div>
      <div>
        <Label htmlFor="total_classes">Total Classes</Label>
        <Input id="total_classes" name="total_classes" type="number" defaultValue={0} />
      </div>
      <div>
        <Label htmlFor="active_student_count">Active Students</Label>
        <Input
          id="active_student_count"
          name="active_student_count"
          type="number"
          defaultValue={0}
        />
      </div>
      <div>
        <Label htmlFor="start_date">Start Date</Label>
        <Input id="start_date" name="start_date" type="date" />
      </div>
      <div>
        <Label htmlFor="expected_end_date">Expected End Date</Label>
        <Input id="expected_end_date" name="expected_end_date" type="date" />
      </div>
      <div>
        <Label htmlFor="farewell_date">Farewell Date</Label>
        <Input id="farewell_date" name="farewell_date" type="date" />
      </div>
      <input type="hidden" name="status" value="ongoing" />
      <div className="md:col-span-3 lg:col-span-6">
        <Button type="submit">Add Batch</Button>
      </div>
    </form>
  );
}
