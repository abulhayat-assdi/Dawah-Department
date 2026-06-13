import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, PageHeader, EmptyState, Button } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { FacultyForm } from "./faculty-form";
import { createFaculty, deleteFaculty } from "./actions";
import type { Faculty } from "@/lib/types";

export default async function AdminFacultyPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("faculty")
    .select("*")
    .order("featured", { ascending: false })
    .order("sort");
  const members = (data ?? []) as Faculty[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty (Public)"
        subtitle="The teachers shown on the public Faculty page."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Faculty List" subtitle={`${members.length} total`} />
          {members.length === 0 ? (
            <EmptyState icon="👤" title="No faculty added yet" />
          ) : (
            <ul className="divide-y divide-slate-50">
              {members.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <Link
                    href={`/admin/faculty/${m.id}`}
                    className="flex items-center gap-3 hover:opacity-80"
                  >
                    <Avatar name={m.name} photoUrl={m.photo_url} size={40} />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {m.name}
                        {m.featured && (
                          <span className="ml-2 rounded bg-gold-100 px-1.5 py-0.5 text-[10px] font-bold text-gold-800">
                            FEATURED
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-500">{m.designation || "—"}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/faculty/${m.id}`}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                    >
                      Edit
                    </Link>
                    <form action={deleteFaculty}>
                      <input type="hidden" name="id" value={m.id} />
                      <Button variant="ghost" className="text-xs text-red-600">
                        Delete
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="h-fit p-5">
          <CardHeader title="Add Faculty" />
          <div className="pt-4">
            <FacultyForm action={createFaculty} submitLabel="Add faculty" />
          </div>
        </Card>
      </div>
    </div>
  );
}
