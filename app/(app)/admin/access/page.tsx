import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader, EmptyState } from "@/components/ui";
import { ADMIN_NAV, COORDINATOR_NAV, TEACHER_NAV } from "@/lib/constants";
import type { NavItem } from "@/lib/constants";
import type { Profile, UserRole } from "@/lib/types";
import { AccessRow } from "./access-row";

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  super_admin: ADMIN_NAV,
  coordinator: COORDINATOR_NAV,
  teacher: TEACHER_NAV,
};

export default async function AccessManagementPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: profiles }, { data: extraRoleRows }, { data: pageRows }] =
    await Promise.all([
      supabase.from("profiles").select("*").order("full_name"),
      supabase.from("profile_roles").select("profile_id, role"),
      supabase.from("user_page_access").select("profile_id, href"),
    ]);

  const members = (profiles ?? []) as Profile[];

  const extraRolesByProfile = new Map<string, UserRole[]>();
  for (const row of extraRoleRows ?? []) {
    const list = extraRolesByProfile.get(row.profile_id as string) ?? [];
    list.push(row.role as UserRole);
    extraRolesByProfile.set(row.profile_id as string, list);
  }

  const pagesByProfile = new Map<string, string[]>();
  for (const row of pageRows ?? []) {
    const list = pagesByProfile.get(row.profile_id as string) ?? [];
    list.push(row.href as string);
    pagesByProfile.set(row.profile_id as string, list);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Access Management"
        subtitle="Grant roles and choose exactly which pages each member can see."
      />

      <Card className="divide-y divide-slate-50">
        {members.length === 0 ? (
          <EmptyState icon="🔐" title="No members yet" />
        ) : (
          members.map((m) => {
            const roles = Array.from(
              new Set<UserRole>([m.role, ...(extraRolesByProfile.get(m.id) ?? [])]),
            );
            const explicitPages = pagesByProfile.get(m.id);
            const defaultPages =
              explicitPages ??
              Array.from(
                new Map(
                  roles.flatMap((r) => NAV_BY_ROLE[r].map((p) => [p.href, p.href])),
                ).keys(),
              );
            return (
              <AccessRow
                key={m.id}
                profile={m}
                initialRoles={roles}
                initialPages={defaultPages}
              />
            );
          })
        )}
      </Card>
    </div>
  );
}
