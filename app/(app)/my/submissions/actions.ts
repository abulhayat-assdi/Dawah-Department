"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notifyPageAudience } from "@/lib/notify";
import { TASK_CLASS_TYPE } from "@/lib/constants";
import type { TaskClassType } from "@/lib/types";

/**
 * Record a teacher's class update / completed task. Where the submission maps
 * onto one of the teacher's monthly allocations, we link it (`task_id`) so the
 * Task Report can compare target vs. actually-taken. An "additional" class
 * (submitted for a batch outside the allocation) is left unlinked.
 */
export async function createSubmission(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const classType = String(formData.get("class_type") ?? "");
  if (!classType) return;

  const isAdditional = String(formData.get("is_additional") ?? "") === "on";
  const today = new Date().toISOString().slice(0, 10);
  const submissionDate =
    String(formData.get("submission_date") ?? "").trim() || today;
  const targetMonth = submissionDate.slice(0, 7); // "YYYY-MM"

  const batchId = String(formData.get("batch_id") ?? "") || null;
  const courseId = String(formData.get("course_id") ?? "") || null;
  const campusId = String(formData.get("campus_id") ?? "") || null;

  // Multiple attachments (Other Task) arrive as a JSON array of { url, name }.
  let files: { url: string; name: string }[] = [];
  try {
    const raw = String(formData.get("files") ?? "");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        files = parsed
          .filter((f) => f && typeof f.url === "string")
          .map((f) => ({ url: String(f.url), name: String(f.name ?? "File") }));
      }
    }
  } catch {
    files = [];
  }

  // Attribute to a monthly allocation unless this is an additional class.
  let taskId: string | null = null;
  let resolvedCampus = campusId;
  if (!isAdditional) {
    let query = supabase
      .from("tasks")
      .select("id, campus_id")
      .eq("assigned_to", profile.id)
      .eq("class_type", classType);
    if (batchId) query = query.eq("batch_id", batchId);
    if (classType === "form_verification" && courseId) {
      query = query.eq("course_id", courseId);
    }
    const { data: match } = await query
      .order("created_at", { ascending: false })
      .limit(1);
    if (match && match.length) {
      taskId = match[0].id as string;
      resolvedCampus = resolvedCampus ?? (match[0].campus_id as string | null);
    }
  }

  const { error } = await supabase.from("task_submissions").insert({
    task_id: taskId,
    teacher_id: profile.id,
    class_type: classType,
    campus_id: resolvedCampus,
    course_id: courseId,
    batch_id: batchId,
    submission_date: submissionDate,
    target_month: targetMonth,
    topic: String(formData.get("topic") ?? "").trim() || null,
    comments: String(formData.get("comments") ?? "").trim() || null,
    is_additional: isAdditional,
    verified_count:
      classType === "form_verification"
        ? Number(formData.get("verified_count") ?? 0)
        : 0,
    file_url: String(formData.get("file_url") ?? "") || null,
    file_name: String(formData.get("file_name") ?? "") || null,
    files,
  });
  // Never swallow this: a failed insert used to look like a successful
  // submission (the row never reached the Task Report) because the error was
  // discarded. Surface it so the teacher knows the submission did not save.
  if (error) throw new Error(`সাবমিশন সেভ করা যায়নি: ${error.message}`);

  // Raise the "Task Report" sidebar badge for everyone who reviews
  // submissions. The submitter is excluded so they don't ping themselves.
  await notifyPageAudience(
    "/admin/task-report",
    {
      title: "নতুন টাস্ক সাবমিশন",
      body: `${profile.full_name || "একজন সদস্য"} — ${
        TASK_CLASS_TYPE[classType as TaskClassType]?.label ?? classType
      }`,
    },
    { exclude: [profile.id] },
  );

  revalidatePath("/my/submissions");
  revalidatePath("/admin/task-report");
}

export async function deleteSubmission(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("task_submissions")
    .delete()
    .eq("id", String(formData.get("id")))
    .eq("teacher_id", profile.id);
  if (error) throw new Error(`সাবমিশন ডিলিট করা যায়নি: ${error.message}`);
  revalidatePath("/my/submissions");
  revalidatePath("/admin/task-report");
}
