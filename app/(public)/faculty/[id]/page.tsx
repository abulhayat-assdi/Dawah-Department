import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { RichText } from "@/components/rich-text";
import type { Faculty } from "@/lib/types";

export default async function FacultyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("faculty").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const m = data as Faculty;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 lg:px-6">
      <Link href="/faculty" className="text-sm font-medium text-brand-600 hover:underline">
        ← সকল শিক্ষক
      </Link>

      <div className="mt-6 grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="grid place-items-center">
          <Avatar name={m.name} photoUrl={m.photo_url} size={160} className="ring-4 ring-brand-100" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{m.name}</h1>
          {m.designation && (
            <span className="mt-2 inline-block rounded-md bg-gold-100 px-3 py-1 text-sm font-semibold text-gold-800">
              {m.designation}
            </span>
          )}
        </div>
      </div>

      {m.bio && (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <RichText html={m.bio} />
        </div>
      )}
    </div>
  );
}
