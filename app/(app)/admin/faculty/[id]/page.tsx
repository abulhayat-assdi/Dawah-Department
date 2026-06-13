import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { FacultyForm } from "../faculty-form";
import { updateFaculty } from "../actions";
import type { Faculty } from "@/lib/types";

export default async function EditFacultyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("faculty").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Faculty"
        action={
          <Link
            href="/admin/faculty"
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ← Back
          </Link>
        }
      />
      <Card className="p-6">
        <CardHeader title={(data as Faculty).name} />
        <div className="pt-4">
          <FacultyForm
            action={updateFaculty}
            member={data as Faculty}
            submitLabel="Save changes"
          />
        </div>
      </Card>
    </div>
  );
}
