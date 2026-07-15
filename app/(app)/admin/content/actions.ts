"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Upsert one content section. All non-meta form fields are stored as the JSON
 * `value` for the given `__key`. Revalidates the public pages so edits show
 * immediately.
 */
export async function upsertContent(formData: FormData) {
  await requireAdmin();
  const key = String(formData.get("__key"));
  if (!key) return;

  const value: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (k === "__key") continue;
    value[k] = String(v);
  }

  const supabase = await createClient();
  await supabase.from("site_content").upsert({ key, value }, { onConflict: "key" });
  revalidatePublic();
}

/** Save a whole section as JSON (from the schema-driven CMS editor). */
export async function upsertContentJson(formData: FormData) {
  await requireAdmin();
  const key = String(formData.get("__key"));
  if (!key) return;
  let value: unknown = {};
  try {
    value = JSON.parse(String(formData.get("__json") ?? "{}"));
  } catch {
    return;
  }
  const supabase = await createClient();
  await supabase.from("site_content").upsert({ key, value }, { onConflict: "key" });
  revalidatePublic();
}

function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/faculty");
  revalidatePath("/academic");
  revalidatePath("/activities");
  revalidatePath("/contact");
  revalidatePath("/admin/content");
}
