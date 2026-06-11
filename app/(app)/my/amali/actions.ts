"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Toggle a single amali item for today (upsert on teacher+item+date). */
export async function toggleAmaliLog(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  await supabase.from("amali_logs").upsert(
    {
      teacher_id: profile.id,
      item_id: String(formData.get("item_id")),
      log_date: today,
      done: String(formData.get("done")) === "true",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "teacher_id,item_id,log_date" },
  );
  revalidatePath("/my/amali");
  revalidatePath("/dashboard");
}
