import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Campus, Course } from "@/lib/types";

export default async function CampusPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: campus }, { data: courseData }] = await Promise.all([
    supabase.from("campuses").select("*").eq("id", id).maybeSingle(),
    supabase.from("courses").select("*").eq("campus_id", id).order("abbreviation"),
  ]);
  if (!campus) notFound();
  const c = campus as Campus;
  const courses = (courseData ?? []) as Course[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 lg:px-6">
      <Link href="/activities" className="text-sm font-medium text-brand-600 hover:underline">
        ← সকল ক্যাম্পাস
      </Link>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {c.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.image_url} alt={c.name} className="aspect-[3/1] w-full object-cover" />
        ) : (
          <div className="grid aspect-[3/1] place-items-center bg-brand-50 text-6xl text-brand-200">
            🏫
          </div>
        )}
        <div className="p-7">
          <h1 className="text-3xl font-bold text-slate-900">{c.name}</h1>
          {c.address && <p className="mt-1 text-slate-500">📍 {c.address}</p>}
          {c.description && <p className="mt-4 text-slate-600">{c.description}</p>}
        </div>
      </div>

      <h2 className="mt-10 text-xl font-bold text-slate-900">চলমান কোর্সসমূহ</h2>
      {courses.length === 0 ? (
        <p className="mt-3 text-slate-400">এই ক্যাম্পাসে এখনো কোর্স যুক্ত হয়নি।</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {courses.map((co) => (
            <div
              key={co.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="font-bold text-slate-900">{co.name}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {co.abbreviation}
                {co.duration_label ? ` · ${co.duration_label}` : ""}
              </p>
              {co.description && (
                <p className="mt-2 text-sm text-slate-600">{co.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
