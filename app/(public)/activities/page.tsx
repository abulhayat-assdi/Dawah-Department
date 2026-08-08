import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getContent } from "@/lib/content";
import { PublicHero } from "@/components/public-hero";
import { CampusActivityTabs, type RunningCourseRow } from "@/components/campus-activity-tabs";
import type { Campus, Course } from "@/lib/types";

type BatchStat = { course_id: string; active_student_count: number };

async function getCampusActivity(): Promise<{
  campuses: Campus[];
  courses: Course[];
  batches: BatchStat[];
}> {
  if (!isSupabaseConfigured) return { campuses: [], courses: [], batches: [] };

  const supabase = await createClient();
  const [{ data: campusData }, { data: courseData }] = await Promise.all([
    supabase.from("campuses").select("*").order("name"),
    // Courses assigned to a campus (via the checkbox grid on Campuses & Courses)
    // are the source of truth for what runs there, independent of whether a
    // batch currently exists — a campus can advertise a course before its
    // first batch starts.
    supabase.from("courses").select("*").not("campus_id", "is", null),
  ]);
  const campuses = (campusData ?? []) as Campus[];
  const courses = (courseData ?? []) as Course[];

  const courseIds = courses.map((c) => c.id);
  const { data: batchData } = courseIds.length
    ? await supabase
        .from("batches")
        .select("course_id, active_student_count")
        .eq("status", "ongoing")
        .is("deleted_at", null)
        .in("course_id", courseIds)
    : { data: [] as BatchStat[] };

  return { campuses, courses, batches: (batchData ?? []) as BatchStat[] };
}

export default async function ActivitiesPage() {
  const [act, { campuses, courses, batches }] = await Promise.all([
    getContent("activities"),
    getCampusActivity(),
  ]);

  const statsByCourse = new Map<
    string,
    { batch_count: number; active_student_count: number }
  >();
  for (const b of batches) {
    const existing = statsByCourse.get(b.course_id);
    if (existing) {
      existing.batch_count += 1;
      existing.active_student_count += b.active_student_count;
    } else {
      statsByCourse.set(b.course_id, { batch_count: 1, active_student_count: b.active_student_count });
    }
  }

  const rows: RunningCourseRow[] = courses.map((course) => {
    const stats = statsByCourse.get(course.id);
    return {
      course_id: course.id,
      course_name: course.name,
      abbreviation: course.abbreviation,
      duration_label: course.duration_label,
      campus_id: course.campus_id as string,
      batch_count: stats?.batch_count ?? 0,
      active_student_count: stats?.active_student_count ?? 0,
    };
  });

  return (
    <div>
      <PublicHero title={act.heroTitle} body={act.heroBody} />

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <CampusActivityTabs campuses={campuses} rows={rows} />
      </section>
    </div>
  );
}
