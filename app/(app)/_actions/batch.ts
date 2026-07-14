"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notify";

/**
 * Shared batch-progress actions used by BOTH the admin batch page and the
 * teacher "my batches" page. Row-level permission is enforced by Supabase RLS:
 * super_admin may edit any batch; a teacher may edit only batches assigned to
 * them. The action itself just requires an authenticated profile.
 */

function revalidate(batchId: string) {
  revalidatePath(`/admin/batches/${batchId}`);
  revalidatePath(`/my/batches/${batchId}`);
  revalidatePath("/dashboard");
}

export async function updateBatchFields(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase
    .from("batches")
    .update({
      batch_no: String(formData.get("batch_no") ?? "").trim(),
      total_classes: Number(formData.get("total_classes") ?? 0),
      midterm_status: String(formData.get("midterm_status") ?? "none"),
      final_status: String(formData.get("final_status") ?? "none"),
      status: String(formData.get("status") ?? "will_start"),
      start_date: String(formData.get("start_date") ?? "") || null,
      expected_end_date: String(formData.get("expected_end_date") ?? "") || null,
      dawah_end_date: String(formData.get("dawah_end_date") ?? "") || null,
      farewell_date: String(formData.get("farewell_date") ?? "") || null,
      note: String(formData.get("note") ?? "").trim() || null,
    })
    .eq("id", id);
  revalidate(id);
}

/** Log a class — the DB trigger auto-increments completed_classes. */
export async function logClass(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const batch_id = String(formData.get("batch_id"));
  await supabase.from("class_logs").insert({
    batch_id,
    teacher_id: profile.id,
    topic_id: String(formData.get("topic_id") ?? "") || null,
    class_date: String(formData.get("class_date") ?? "") || undefined,
    counseling_count: Number(formData.get("counseling_count") ?? 0),
    note: String(formData.get("note") ?? "").trim() || null,
  });
  revalidate(batch_id);
}

export async function toggleTopic(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const batch_id = String(formData.get("batch_id"));
  const topic_id = String(formData.get("topic_id"));
  const done = String(formData.get("done")) === "true";
  const next = done ? "pending" : "done";
  await supabase.from("batch_topic_progress").upsert(
    {
      batch_id,
      topic_id,
      status: next,
      completed_date: next === "done" ? new Date().toISOString().slice(0, 10) : null,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "batch_id,topic_id" },
  );

  // Confirmation workflow: when a teacher marks a topic complete, notify the
  // coordinator(s) so they can confirm the progress.
  if (next === "done" && profile.role !== "super_admin") {
    const [{ data: topic }, { data: admins }] = await Promise.all([
      supabase.from("syllabus_topics").select("title").eq("id", topic_id).maybeSingle(),
      supabase.from("profiles").select("id").eq("role", "super_admin"),
    ]);
    const title = (topic?.title as string) || "a topic";
    await Promise.all(
      (admins ?? []).map((a) =>
        createNotification(a.id as string, {
          title: "Topic completed",
          body: `${profile.full_name || "A member"} marked "${title}" complete.`,
          link: `/admin/batches/${batch_id}`,
        }),
      ),
    );
  }

  revalidate(batch_id);
}

/** Accepts "YYYY-MM-DD, Topic" (or DD/MM/YYYY) lines, one class per line. */
function parseScheduleText(
  text: string,
): { date: string; topic: string | null }[] {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/;
  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
  const normalizeDate = (s: string): string | null => {
    if (iso.test(s)) return s;
    const m = dmy.exec(s);
    if (!m) return null;
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  };

  const rows: { date: string; topic: string | null }[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const [rawDate, ...rest] = line.split(/\t|,/).map((p) => p.trim());
    const date = normalizeDate(rawDate);
    if (!date) continue; // skips header rows / blank noise
    rows.push({ date, topic: rest.join(" ").trim() || null });
  }
  return rows;
}

/**
 * Imports a batch's daily schedule from an uploaded CSV file or a pasted
 * block of "date, topic" lines. Every row starts as 'pending'; the teacher
 * then verifies each one via setScheduleStatus.
 */
export async function importSchedule(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const batch_id = String(formData.get("batch_id"));

  const file = formData.get("csv_file");
  const isFile = file instanceof File && file.size > 0;
  const text = isFile ? await (file as File).text() : String(formData.get("csv_text") ?? "");
  const rows = parseScheduleText(text);
  if (!rows.length) return;

  const { data: batch } = await supabase
    .from("batches")
    .select("course_id")
    .eq("id", batch_id)
    .single();
  const { data: topics } = batch
    ? await supabase
        .from("syllabus_topics")
        .select("id, title")
        .eq("course_id", batch.course_id)
    : { data: [] as { id: string; title: string }[] };

  const findTopicId = (label: string | null) => {
    if (!label) return null;
    const match = (topics ?? []).find(
      (t) => t.title.trim().toLowerCase() === label.trim().toLowerCase(),
    );
    return match?.id ?? null;
  };

  await supabase.from("class_schedule").upsert(
    rows.map((r) => ({
      batch_id,
      teacher_id: profile.id,
      class_date: r.date,
      topic_id: findTopicId(r.topic),
      topic_label: r.topic,
      source: isFile ? "csv" : "manual",
      status: "pending",
    })),
    { onConflict: "batch_id,teacher_id,class_date" },
  );

  revalidate(batch_id);
}

/**
 * Teacher verification action: 'done' confirms the class (creates the
 * matching class_logs row so the existing progress trigger picks it up);
 * 'schedule_changed' or reverting to 'pending' never counts toward progress.
 */
export async function setScheduleStatus(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const batch_id = String(formData.get("batch_id"));
  const status = String(formData.get("status"));

  const { data: entry } = await supabase
    .from("class_schedule")
    .select("*")
    .eq("id", id)
    .single();
  if (!entry) return;

  if (status === "done") {
    const { data: log } = await supabase
      .from("class_logs")
      .insert({
        batch_id: entry.batch_id,
        teacher_id: entry.teacher_id,
        topic_id: entry.topic_id,
        class_date: entry.class_date,
        confirmed: true,
      })
      .select("id")
      .single();
    await supabase
      .from("class_schedule")
      .update({ status: "done", class_log_id: log?.id ?? null })
      .eq("id", id);
  } else {
    // Leaving 'done' — drop the log it created so completed_classes stays correct.
    if (entry.class_log_id) {
      await supabase.from("class_logs").delete().eq("id", entry.class_log_id);
    }
    await supabase
      .from("class_schedule")
      .update({ status, class_log_id: null })
      .eq("id", id);
  }

  revalidate(batch_id);
}

export async function setAssessment(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const batch_id = String(formData.get("batch_id"));
  const type = String(formData.get("type"));
  const is_done = String(formData.get("is_done")) !== "true"; // toggle
  await supabase.from("assessments").upsert(
    {
      batch_id,
      type,
      is_done,
      done_date: is_done ? new Date().toISOString().slice(0, 10) : null,
    },
    { onConflict: "batch_id,type" },
  );
  revalidate(batch_id);
}
