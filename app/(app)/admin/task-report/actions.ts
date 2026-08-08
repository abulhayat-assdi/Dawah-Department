"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sanitizeText } from "@/lib/utils";
import type { SubmissionFile } from "@/lib/types";

const BUCKET = "task-files";

/** Extracts the in-bucket object path from a task-files public URL. */
function storagePath(url: string): string | null {
  const m = url.split("?")[0].match(new RegExp(`/${BUCKET}/(.+)$`));
  return m ? decodeURIComponent(m[1]) : null;
}

/** Best-effort removal of storage objects behind a set of public URLs. */
async function removeObjects(
  supabase: Awaited<ReturnType<typeof createClient>>,
  urls: (string | null | undefined)[],
) {
  const paths = urls
    .filter((u): u is string => Boolean(u))
    .map(storagePath)
    .filter((p): p is string => Boolean(p));
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
}

/**
 * Super-admin edit of a submission's text/numeric fields. The attachments and
 * ownership are left untouched — those are managed via their own actions.
 */
export async function updateSubmission(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  if (!id) return;

  const patch: Record<string, unknown> = {
    topic: sanitizeText(String(formData.get("topic") ?? "")) || null,
    comments: sanitizeText(String(formData.get("comments") ?? "")) || null,
  };

  const submissionDate = String(formData.get("submission_date") ?? "").trim();
  if (submissionDate) {
    patch.submission_date = submissionDate;
    patch.target_month = submissionDate.slice(0, 7);
  }
  if (formData.has("verified_count")) {
    patch.verified_count = Math.max(0, Number(formData.get("verified_count") ?? 0));
  }

  const { error } = await supabase
    .from("task_submissions")
    .update(patch)
    .eq("id", id);
  if (error) throw new Error(`সাবমিশন আপডেট করা যায়নি: ${error.message}`);
  revalidatePath("/admin/task-report");
  revalidatePath("/my/submissions");
}

/** Super-admin: remove a single attachment from a submission. */
export async function removeSubmissionFile(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const url = String(formData.get("url"));
  if (!id || !url) return;

  // `select("*")` rather than naming `files`, so this still works against a
  // database that predates supabase/15_submission_multi_files.sql.
  const { data } = await supabase
    .from("task_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return;

  const patch: Record<string, unknown> = {};
  if (Array.isArray(data.files)) {
    patch.files = (data.files as SubmissionFile[]).filter((f) => f?.url !== url);
  }
  if (data.file_url === url) {
    patch.file_url = null;
    patch.file_name = null;
  }

  if (Object.keys(patch).length) {
    const { error } = await supabase
      .from("task_submissions")
      .update(patch)
      .eq("id", id);
    if (error) throw new Error(`অ্যাটাচমেন্ট সরানো যায়নি: ${error.message}`);
  }
  await removeObjects(supabase, [url]);
  revalidatePath("/admin/task-report");
  revalidatePath("/my/submissions");
}

/** Super-admin: delete a submission entirely (and its stored attachments). */
export async function deleteSubmissionAdmin(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  if (!id) return;

  const { data } = await supabase
    .from("task_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const urls = [
    ...(Array.isArray(data?.files)
      ? (data!.files as SubmissionFile[]).map((f) => f?.url)
      : []),
    data?.file_url,
  ];

  const { error } = await supabase
    .from("task_submissions")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`সাবমিশন ডিলিট করা যায়নি: ${error.message}`);
  await removeObjects(supabase, urls);
  revalidatePath("/admin/task-report");
  revalidatePath("/my/submissions");
}
