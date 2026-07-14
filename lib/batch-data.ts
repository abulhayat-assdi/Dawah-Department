import { createClient } from "./supabase/server";
import type { Batch, ClassScheduleEntry, Course } from "./types";

export interface BatchDetailData {
  batch: Batch;
  course: Course;
  topics: { id: string; sequence: number; title: string }[];
  topicProgress: { topic_id: string; status: "pending" | "done" }[];
  assessments: { type: "entry" | "peer" | "exit"; is_done: boolean }[];
  recentLogs: {
    id: string;
    class_date: string;
    counseling_count: number | null;
    note: string | null;
  }[];
  schedule: ClassScheduleEntry[];
}

/** Loads everything the BatchDetail component needs. Returns null if missing. */
export async function loadBatchDetail(
  batchId: string,
): Promise<BatchDetailData | null> {
  const supabase = await createClient();

  const { data: batch } = await supabase
    .from("batches")
    .select("*")
    .eq("id", batchId)
    .single();
  if (!batch) return null;

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", batch.course_id)
    .single();

  const [topics, topicProgress, assessments, recentLogs, schedule] = await Promise.all([
    supabase
      .from("syllabus_topics")
      .select("id, sequence, title")
      .eq("course_id", batch.course_id)
      .order("sequence"),
    supabase
      .from("batch_topic_progress")
      .select("topic_id, status")
      .eq("batch_id", batchId),
    supabase.from("assessments").select("type, is_done").eq("batch_id", batchId),
    supabase
      .from("class_logs")
      .select("id, class_date, counseling_count, note")
      .eq("batch_id", batchId)
      .order("class_date", { ascending: false })
      .limit(8),
    supabase
      .from("class_schedule")
      .select("*")
      .eq("batch_id", batchId)
      .order("class_date", { ascending: true }),
  ]);

  return {
    batch: batch as Batch,
    course: course as Course,
    topics: topics.data ?? [],
    topicProgress: topicProgress.data ?? [],
    assessments: assessments.data ?? [],
    recentLogs: recentLogs.data ?? [],
    schedule: (schedule.data ?? []) as ClassScheduleEntry[],
  };
}
