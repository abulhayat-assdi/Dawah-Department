import { requireProfile, allRoles } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import type { CampusRoutine, Course, CourseTrackerRow } from "@/lib/types";
import { RoutinePageClient } from "./routine-page-client";
import type { CampusOpt, CourseOpt, RoutineBatch } from "./routine-viewer";

export default async function RoutinePage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const roles = allRoles(profile);
  const isAdmin = roles.includes("super_admin");
  const isCoordinator = roles.includes("coordinator");
  const canEdit = isAdmin || isCoordinator;

  // A coordinator (who is not also super_admin) may only build routines for
  // their assigned campus(es); the viewer, however, stays global for everyone.
  let scopedCampusIds: string[] | null = null;
  if (canEdit && isCoordinator && !isAdmin) {
    const { data: links } = await supabase
      .from("teacher_campuses")
      .select("campus_id")
      .eq("teacher_id", profile.id);
    scopedCampusIds = [
      ...new Set((links ?? []).map((r) => r.campus_id as string)),
    ];
  }

  const [
    { data: campusData },
    { data: courseData },
    { data: batchData },
    { data: routineData },
  ] = await Promise.all([
    supabase.from("campuses").select("id, name").order("name"),
    supabase
      .from("courses")
      .select("id, campus_id, abbreviation, name")
      .order("abbreviation"),
    supabase
      .from("course_tracker")
      .select("batch_id, course_id, campus_id, course_info, course_name, batch_no")
      .order("batch_no"),
    supabase.from("campus_routines").select("*"),
  ]);

  const campuses = (campusData ?? []) as CampusOpt[];
  const courses = (courseData ?? []) as (Pick<
    Course,
    "id" | "campus_id" | "abbreviation" | "name"
  >)[] as CourseOpt[];

  const batches: RoutineBatch[] = (
    (batchData ?? []) as Pick<
      CourseTrackerRow,
      "batch_id" | "course_id" | "campus_id" | "course_info" | "course_name" | "batch_no"
    >[]
  ).map((b) => ({
    id: b.batch_id,
    campus_id: b.campus_id ?? null,
    course_id: b.course_id ?? null,
    abbr: b.course_info,
    name: b.course_name,
    batch_no: b.batch_no,
  }));

  const routines = (routineData ?? []) as CampusRoutine[];

  // Builder gets a campus/batch set scoped to the coordinator's campuses.
  const builderCampuses = scopedCampusIds
    ? campuses.filter((c) => scopedCampusIds!.includes(c.id))
    : campuses;
  const builderBatches = scopedCampusIds
    ? batches.filter((b) => b.campus_id && scopedCampusIds!.includes(b.campus_id))
    : batches;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Routine"
        subtitle="Weekly Quran & Dawah class schedule across every campus and batch."
      />

      <RoutinePageClient
        campuses={campuses}
        courses={courses}
        batches={batches}
        routines={routines}
        canEdit={canEdit}
        builderCampuses={builderCampuses}
        builderBatches={builderBatches}
      />
    </div>
  );
}
