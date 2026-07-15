"use server";

import { revalidatePath } from "next/cache";
import { requireCoordinatorOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function markFeedbackRead(formData: FormData) {
  await requireCoordinatorOrAdmin();
  const supabase = await createClient();
  await supabase
    .from("feedback")
    .update({ is_read: String(formData.get("is_read")) === "true" })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/feedback");
}

export async function deleteFeedback(formData: FormData) {
  await requireCoordinatorOrAdmin();
  const supabase = await createClient();
  await supabase.from("feedback").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/feedback");
}
