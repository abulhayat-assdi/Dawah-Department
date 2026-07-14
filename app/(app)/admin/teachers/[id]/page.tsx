import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { MemberManager } from "./member-manager";
import type { Campus, Profile } from "@/lib/types";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: member }, { data: campusData }, { data: links }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("campuses").select("*").order("name"),
    supabase.from("teacher_campuses").select("campus_id").eq("teacher_id", id),
  ]);

  if (!member) notFound();

  const assignedIds = (links ?? []).map((l) => l.campus_id as string);

  return (
    <div className="space-y-6">
      <PageHeader
        title={(member as Profile).full_name || "Member"}
        subtitle="Manage this member's profile, role, campuses and account."
        action={
          <Link
            href="/admin/teachers"
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ← Back
          </Link>
        }
      />
      <MemberManager
        member={member as Profile}
        campuses={(campusData ?? []) as Campus[]}
        assignedIds={assignedIds}
      />
    </div>
  );
}
