"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({
      full_name: String(formData.get("full_name") ?? "").trim(),
      designation: String(formData.get("designation") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      location: String(formData.get("location") ?? "").trim() || null,
      background: String(formData.get("background") ?? "").trim() || null,
      bio: String(formData.get("bio") ?? "").trim() || null,
      photo_url: String(formData.get("photo_url") ?? "").trim() || null,
    })
    .eq("id", profile.id);
  revalidatePath("/my/profile");
  revalidatePath("/dashboard");
}
