"use server";

import { revalidatePath } from "next/cache";
import { requireCoordinatorOrAdmin, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Shared actions for the Staff Quran Class & Dawah Counseling tracker.
 * Scheduling is coordinator/admin only; status updates are open to any
 * authenticated profile because RLS restricts writes to the session's own
 * staff_id (self-report) or a coordinator/admin of that campus.
 */

function revalidate() {
  revalidatePath("/admin/staff-tracker");
  revalidatePath("/my/staff-tracker");
}

export async function scheduleQuranSession(formData: FormData) {
  const profile = await requireCoordinatorOrAdmin();
  const supabase = await createClient();
  await supabase.from("staff_quran_sessions").insert({
    staff_id: String(formData.get("staff_id")),
    campus_id: String(formData.get("campus_id")),
    scheduled_date: String(formData.get("scheduled_date") ?? "") || undefined,
    note: String(formData.get("note") ?? "").trim() || null,
    created_by: profile.id,
  });
  revalidate();
}

export async function scheduleDawahSession(formData: FormData) {
  const profile = await requireCoordinatorOrAdmin();
  const supabase = await createClient();
  await supabase.from("dawah_counseling_sessions").insert({
    staff_id: String(formData.get("staff_id")),
    campus_id: String(formData.get("campus_id")),
    session_date: String(formData.get("session_date") ?? "") || undefined,
    counselee_note: String(formData.get("counselee_note") ?? "").trim() || null,
    logged_by: profile.id,
  });
  revalidate();
}

export async function setQuranStatus(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  await supabase
    .from("staff_quran_sessions")
    .update({ status, attendance: status === "done" })
    .eq("id", id);
  revalidate();
}

export async function setDawahStatus(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  await supabase.from("dawah_counseling_sessions").update({ status }).eq("id", id);
  revalidate();
}

export async function deleteQuranSession(formData: FormData) {
  await requireCoordinatorOrAdmin();
  const supabase = await createClient();
  await supabase.from("staff_quran_sessions").delete().eq("id", String(formData.get("id")));
  revalidate();
}

export async function deleteDawahSession(formData: FormData) {
  await requireCoordinatorOrAdmin();
  const supabase = await createClient();
  await supabase.from("dawah_counseling_sessions").delete().eq("id", String(formData.get("id")));
  revalidate();
}
