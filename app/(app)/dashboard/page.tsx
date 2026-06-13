import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminDashboard } from "./admin-dashboard";
import { TeacherDashboard } from "./teacher-dashboard";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  // Notices are shown to every role on the dashboard.
  const noticesQuery = supabase
    .from("notices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(12);

  if (profile.role === "super_admin") {
    const [campuses, courses, teachers, tracker, feedback, notices] =
      await Promise.all([
        supabase.from("campuses").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "teacher"),
        supabase.from("course_tracker").select("*").order("status"),
        supabase
          .from("feedback")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
        noticesQuery,
      ]);

    return (
      <AdminDashboard
        name={profile.full_name}
        photoUrl={profile.photo_url}
        counts={{
          campuses: campuses.count ?? 0,
          courses: courses.count ?? 0,
          teachers: teachers.count ?? 0,
          batches: tracker.data?.length ?? 0,
        }}
        tracker={tracker.data ?? []}
        feedback={feedback.data ?? []}
        notices={notices.data ?? []}
      />
    );
  }

  // Teacher view
  const { data: assignments } = await supabase
    .from("batch_teachers")
    .select("batch_id, role_label")
    .eq("teacher_id", profile.id);

  const batchIds = (assignments ?? []).map((a) => a.batch_id);
  const today = new Date().toISOString().slice(0, 10);

  const [tracker, tasks, report, notices] = await Promise.all([
    batchIds.length
      ? supabase.from("course_tracker").select("*").in("batch_id", batchIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from("tasks")
      .select("*")
      .eq("assigned_to", profile.id)
      .neq("status", "done")
      .order("due_date", { nullsFirst: false }),
    supabase
      .from("daily_reports")
      .select("id")
      .eq("teacher_id", profile.id)
      .eq("report_date", today)
      .maybeSingle(),
    noticesQuery,
  ]);

  return (
    <TeacherDashboard
      name={profile.full_name}
      photoUrl={profile.photo_url}
      tracker={tracker.data ?? []}
      tasks={tasks.data ?? []}
      reportedToday={!!report.data}
      notices={notices.data ?? []}
    />
  );
}
