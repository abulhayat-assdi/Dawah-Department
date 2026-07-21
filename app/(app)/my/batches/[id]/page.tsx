import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadBatchDetail } from "@/lib/batch-data";
import { BatchDetail } from "@/components/batch-detail";

export default async function MyBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;

  const supabase = await createClient();
  const { data: assignment } = await supabase
    .from("batch_teachers")
    .select("batch_id")
    .eq("batch_id", id)
    .eq("teacher_id", profile.id)
    .maybeSingle();

  const data = await loadBatchDetail(id);
  if (!data) notFound();

  // canEdit only when this batch is assigned to the teacher (RLS also enforces).
  const canEdit = !!assignment;

  return (
    <div className="space-y-6">
      <Link href="/my/batches" className="text-sm text-slate-500 hover:text-brand-600">
        ← Back to my batches
      </Link>
      <BatchDetail
        batch={data.batch}
        courseId={data.course.id}
        courseName={data.course.name}
        abbreviation={data.course.abbreviation}
        topics={data.topics}
        topicProgress={data.topicProgress}
        assessments={data.assessments}
        recentLogs={data.recentLogs}
        schedule={data.schedule}
        canEdit={canEdit}
      />
    </div>
  );
}
