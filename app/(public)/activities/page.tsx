import { createClient } from "@/lib/supabase/server";
import { getContent } from "@/lib/content";
import { PublicHero } from "@/components/public-hero";
import { CampusActivityTabs, type RunningCourseRow } from "@/components/campus-activity-tabs";
import type { Campus, Course } from "@/lib/types";

export default async function ActivitiesPage() {
  const [act, supabase] = await Promise.all([getContent("activities"), createClient()]);
  const [{ data: campusData }, { data: batchData }] = await Promise.all([
    supabase.from("campuses").select("*").order("name"),
    supabase
      .from("batches")
      .select("campus_id, course_id, active_student_count")
      .eq("status", "ongoing")
      .not("campus_id", "is", null)
      .is("deleted_at", null),
  ]);
  const campuses = (campusData ?? []) as Campus[];
  const batches = (batchData ?? []) as {
    campus_id: string;
    course_id: string;
    active_student_count: number;
  }[];

  const courseIds = [...new Set(batches.map((b) => b.course_id))];
  const { data: courseData } = courseIds.length
    ? await supabase.from("courses").select("*").in("id", courseIds)
    : { data: [] as Course[] };
  const coursesById = new Map((courseData ?? []).map((c) => [c.id, c as Course]));

  const byKey = new Map<string, RunningCourseRow>();
  for (const b of batches) {
    const course = coursesById.get(b.course_id);
    if (!course) continue;
    const key = `${b.campus_id}:${b.course_id}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.batch_count += 1;
      existing.active_student_count += b.active_student_count;
    } else {
      byKey.set(key, {
        course_id: course.id,
        course_name: course.name,
        abbreviation: course.abbreviation,
        duration_label: course.duration_label,
        campus_id: b.campus_id,
        batch_count: 1,
        active_student_count: b.active_student_count,
      });
    }
  }
  const rows = [...byKey.values()];

  return (
    <div>
      <PublicHero title={act.heroTitle} body={act.heroBody} />

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <CampusActivityTabs campuses={campuses} rows={rows} />
      </section>
    </div>
  );
}
