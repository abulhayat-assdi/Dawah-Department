"use server";

import { createClient } from "@/lib/supabase/server";

/** Public contact form → inserts into feedback (anon insert policy allows it). */
export async function submitContact(formData: FormData) {
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return;
  const supabase = await createClient();
  await supabase.from("feedback").insert({
    name: String(formData.get("name") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    message,
  });
}
