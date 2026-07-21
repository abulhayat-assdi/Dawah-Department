"use server";

import { revalidatePath } from "next/cache";
import { requireCoordinatorOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface AmaliFormState {
  error: string | null;
}

export async function createAmaliItem(
  _prevState: AmaliFormState | null,
  formData: FormData,
): Promise<AmaliFormState> {
  await requireCoordinatorOrAdmin();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "শিরোনাম আবশ্যক।" };

  const startDate = String(formData.get("start_date") ?? "") || null;
  const endDate = String(formData.get("end_date") ?? "") || null;
  if (startDate && endDate && endDate < startDate) {
    return { error: "শেষের তারিখ শুরুর তারিখের আগে হতে পারবে না।" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("amali_items").insert({
    title,
    campus_id: String(formData.get("campus_id") ?? "") || null,
    start_date: startDate,
    end_date: endDate,
  });
  if (error) return { error: "সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।" };

  revalidatePath("/admin/amali");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function toggleAmaliItem(formData: FormData) {
  await requireCoordinatorOrAdmin();
  const supabase = await createClient();
  await supabase
    .from("amali_items")
    .update({ is_active: String(formData.get("is_active")) === "true" })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/amali");
  revalidatePath("/dashboard");
}

export async function deleteAmaliItem(formData: FormData) {
  await requireCoordinatorOrAdmin();
  const supabase = await createClient();
  await supabase.from("amali_items").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/amali");
  revalidatePath("/dashboard");
}
