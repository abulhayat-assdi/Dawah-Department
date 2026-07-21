import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminDashboard } from "./admin-dashboard";
import { TeacherDashboard } from "./teacher-dashboard";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  // Notices are shown to every role on the dashboard (RLS scopes rows by campus).
  const noticesQuery = supabase
    .from("notices")
    .select("*, campus:campuses(name)")
    .order("created_at", { ascending: false })
    .limit(12);

  if (profile.role === "super_admin") {
    const [campuses, courses, teachers, tracker, feedback, notices, allCampuses] =
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
        supabase.from("campuses").select("id, name").order("name"),
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
        canManageNotices
        noticeCampuses={allCampuses.data ?? []}
      />
    );
  }

  if (profile.role === "coordinator") {
    const { data: campusLinks } = await supabase
      .from("teacher_campuses")
      .select("campus_id")
      .eq("teacher_id", profile.id);
    const campusIds = (campusLinks ?? []).map((r) => r.campus_id as string);
    const campusCount = new Set(campusIds).size;

    const { data: batchRows } = campusIds.length
      ? await supabase
          .from("batches")
          .select("id, course_id")
          .in("campus_id", campusIds)
          .is("deleted_at", null)
      : { data: [] as { id: string; course_id: string }[] };
    const batchIds = (batchRows ?? []).map((b) => b.id as string);
    const courseCount = new Set((batchRows ?? []).map((b) => b.course_id)).size;

    const [tracker, teacherRows, feedback, notices, myCampuses] = await Promise.all([
      batchIds.length
        ? supabase.from("course_tracker").select("*").in("batch_id", batchIds).order("status")
        : Promise.resolve({ data: [] }),
      batchIds.length
        ? supabase.from("batch_teachers").select("teacher_id").in("batch_id", batchIds)
        : Promise.resolve({ data: [] as { teacher_id: string }[] }),
      supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5),
      noticesQuery,
      campusIds.length
        ? supabase.from("campuses").select("id, name").in("id", campusIds).order("name")
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    ]);
    const teacherCount = new Set(
      (teacherRows.data ?? []).map((r) => r.teacher_id as string),
    ).size;

    return (
      <AdminDashboard
        name={profile.full_name}
        photoUrl={profile.photo_url}
        counts={{
          campuses: campusCount,
          courses: courseCount,
          teachers: teacherCount,
          batches: tracker.data?.length ?? 0,
        }}
        tracker={tracker.data ?? []}
        feedback={feedback.data ?? []}
        notices={notices.data ?? []}
        canManageNotices
        noticeCampuses={myCampuses.data ?? []}
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

  const [tracker, tasks, report, notices, amaliItems, amaliLogs] = await Promise.all([
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
    supabase
      .from("amali_items")
      .select("*")
      .eq("is_active", true)
      .order("sequence")
      .order("created_at"),
    supabase
      .from("amali_logs")
      .select("item_id, done")
      .eq("teacher_id", profile.id)
      .eq("log_date", today),
  ]);

  return (
    <TeacherDashboard
      name={profile.full_name}
      photoUrl={profile.photo_url}
      tracker={tracker.data ?? []}
      tasks={tasks.data ?? []}
      reportedToday={!!report.data}
      notices={notices.data ?? []}
      amaliItems={amaliItems.data ?? []}
      amaliDoneIds={(amaliLogs.data ?? [])
        .filter((l) => l.done)
        .map((l) => l.item_id as string)}
    />
  );
}
