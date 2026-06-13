"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function sendText(formData: FormData) {
  const profile = await requireProfile();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  const supabase = await createClient();
  await supabase.from("messages").insert({ sender_id: profile.id, body });
  revalidatePath("/messages");
}

export async function deleteMessage(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  // RLS (messages_delete) enforces sender-or-admin.
  await supabase.from("messages").delete().eq("id", String(formData.get("id")));
  revalidatePath("/messages");
}
