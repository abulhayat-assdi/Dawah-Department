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
