import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui";
import { TeacherManager } from "./teacher-manager";
import type { Campus, Profile } from "@/lib/types";
import type { MemberWithMeta } from "./types";

export default async function TeachersPage() {
  await requireAdmin();
  const supabase = await createClient();
  const admin = createAdminClient();

  const [{ data: profiles }, { data: campusData }, { data: linkRows }, usersRes] =
    await Promise.all([
      supabase.from("profiles").select("*").order("full_name"),
      supabase.from("campuses").select("*").order("name"),
      supabase.from("teacher_campuses").select("teacher_id, campus_id"),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

  const emailById = new Map<string, string>();
  for (const u of usersRes.data?.users ?? []) {
    if (u.email) emailById.set(u.id, u.email);
  }

  const campusIdsByMember = new Map<string, string[]>();
  for (const link of linkRows ?? []) {
    const list = campusIdsByMember.get(link.teacher_id as string) ?? [];
    list.push(link.campus_id as string);
    campusIdsByMember.set(link.teacher_id as string, list);
  }

  const members: MemberWithMeta[] = ((profiles ?? []) as Profile[]).map((p) => ({
    ...p,
    email: emailById.get(p.id) ?? "",
    campusIds: campusIdsByMember.get(p.id) ?? [],
  }));

  const campuses = (campusData ?? []) as Campus[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher & Member Management"
        subtitle="Create accounts and assign each member to campuses."
      />
      <TeacherManager members={members} campuses={campuses} />
    </div>
  );
}
