"use server";

import { createClient } from "@/lib/supabase/server";
import { sanitizeText } from "@/lib/utils";

/** Public contact form → inserts into feedback (anon insert policy allows it). */
export async function submitContact(formData: FormData) {
  const message = sanitizeText(String(formData.get("message") ?? ""));
  if (!message) return;
  const supabase = await createClient();
  await supabase.from("feedback").insert({
    name: sanitizeText(String(formData.get("name") ?? "")) || null,
    phone: sanitizeText(String(formData.get("phone") ?? "")) || null,
    message,
  });
}
