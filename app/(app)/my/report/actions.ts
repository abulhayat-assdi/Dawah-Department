"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function submitReport(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase.from("daily_reports").upsert(
    {
      teacher_id: profile.id,
      report_date:
        String(formData.get("report_date") ?? "") ||
        new Date().toISOString().slice(0, 10),
      work_hours: Number(formData.get("work_hours") ?? 0),
      counseling_count: Number(formData.get("counseling_count") ?? 0),
      topics_covered: String(formData.get("topics_covered") ?? "").trim() || null,
      summary: String(formData.get("summary") ?? "").trim() || null,
    },
    { onConflict: "teacher_id,report_date" },
  );
  revalidatePath("/my/report");
  revalidatePath("/dashboard");
}
