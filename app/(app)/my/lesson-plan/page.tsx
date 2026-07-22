import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, PageHeader, Label, Input, Button, EmptyState } from "@/components/ui";
import { formatMonth } from "@/lib/utils";
import type { LessonPlan } from "@/lib/types";
import { LessonPlanClient, type AssignedBatch } from "./lesson-plan-client";

export default async function MyLessonPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const sp = await searchParams;
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const month = /^\d{4}-\d{2}$/.test(String(sp.month ?? "")) ? String(sp.month) : currentMonth;
  const monthLabel = formatMonth(month);

  const [{ data: assignData }, { data: planData }] = await Promise.all([
    supabase
      .from("lesson_plan_assignments")
      .select("batch_id")
      .eq("teacher_id", profile.id)
      .eq("target_month", month),
    supabase
      .from("lesson_plans")
      .select("*")
      .eq("teacher_id", profile.id)
      .eq("target_month", month)
      .order("week_number"),
  ]);

  const batchIds = [...new Set((assignData ?? []).map((r) => r.batch_id as string))];
  const { data: batchRows } = batchIds.length
    ? await supabase
        .from("course_tracker")
        .select("batch_id, campus_id, course_info, batch_no")
        .in("batch_id", batchIds)
    : { data: [] as { batch_id: string; campus_id: string | null; course_info: string; batch_no: string }[] };

  const assignedBatches: AssignedBatch[] = (batchRows ?? []).map((b) => ({
    id: b.batch_id,
    campus_id: b.campus_id ?? null,
    label: `${b.course_info} — Batch ${b.batch_no}`,
  }));

  const plans = (planData ?? []) as LessonPlan[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Lesson Plan"
        subtitle="Submit and manage your weekly teaching agenda for each assigned batch."
      />

      <Card>
        <CardHeader title="Select Month" />
        <form method="get" className="flex flex-wrap items-end gap-3 p-5">
          <div>
            <Label htmlFor="month">Month</Label>
            <Input id="month" name="month" type="month" defaultValue={month} />
          </div>
          <Button type="submit">Show</Button>
        </form>
      </Card>

      {assignedBatches.length === 0 ? (
        <Card>
          <EmptyState
            icon="📅"
            title={`No batches assigned to you for ${monthLabel}`}
            hint="Ask your coordinator or admin to assign your batches for this month."
          />
        </Card>
      ) : (
        <LessonPlanClient
          assignedBatches={assignedBatches}
          plans={plans}
          month={month}
          monthLabel={monthLabel}
        />
      )}
    </div>
  );
}
