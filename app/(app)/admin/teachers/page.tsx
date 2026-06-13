import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  PageHeader,
  EmptyState,
  Button,
} from "@/components/ui";
import { ROLE_LABEL } from "@/lib/constants";
import { Avatar } from "@/components/avatar";
import Link from "next/link";
import { TeacherForm } from "./teacher-form";
import { toggleTeacherActive } from "./actions";
import type { Campus, Profile } from "@/lib/types";

export default async function TeachersPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: profiles }, { data: campusData }] = await Promise.all([
    supabase.from("profiles").select("*").order("full_name"),
    supabase.from("campuses").select("*").order("name"),
  ]);

  const members = (profiles ?? []) as Profile[];
  const campuses = (campusData ?? []) as Campus[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher & Member Management"
        subtitle="Create accounts and assign each member to campuses."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Member List" subtitle={`${members.length} total`} />
          {members.length === 0 ? (
            <EmptyState icon="👥" title="No members yet" />
          ) : (
            <ul className="divide-y divide-slate-50">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 px-5 py-4"
                >
                  <Link
                    href={`/admin/teachers/${m.id}`}
                    className="flex items-center gap-3 hover:opacity-80"
                  >
                    <Avatar name={m.full_name} photoUrl={m.photo_url} size={40} />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {m.full_name || "Unnamed"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {m.designation || ROLE_LABEL[m.role]}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/teachers/${m.id}`}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                    >
                      Manage
                    </Link>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        m.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {m.is_active ? "Active" : "Inactive"}
                    </span>
                    <form action={toggleTeacherActive}>
                      <input type="hidden" name="id" value={m.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={String(m.is_active)}
                      />
                      <Button variant="ghost" className="text-xs">
                        {m.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="h-fit">
          <CardHeader title="Add New Member" />
          <TeacherForm campuses={campuses} />
        </Card>
      </div>
    </div>
  );
}
