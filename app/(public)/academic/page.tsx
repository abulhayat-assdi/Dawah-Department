import { createClient } from "@/lib/supabase/server";
import { getContent } from "@/lib/content";
import { PublicHero } from "@/components/public-hero";
import { RichText } from "@/components/rich-text";
import { ProgramsToggle } from "@/components/programs-toggle";
import type { Course } from "@/lib/types";

export default async function AcademicPage() {
  const [ac, supabase] = await Promise.all([getContent("academic"), createClient()]);
  const [{ data }, { data: syllabusData }] = await Promise.all([
    supabase.from("courses").select("*").order("abbreviation"),
    supabase
      .from("resources")
      .select("course_id, syllabus_kind, url")
      .not("syllabus_kind", "is", null),
  ]);
  const courses = (data ?? []) as Course[];
  const syllabusDocs = (syllabusData ?? []) as {
    course_id: string;
    syllabus_kind: string;
    url: string;
  }[];

  return (
    <div>
      <PublicHero eyebrow={ac.heroEyebrow} title={ac.heroTitle} body={ac.heroBody} />

      {/* Quran levels */}
      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-gold-400 text-sm font-bold text-brand-900">
            ০১
          </span>
          <h2 className="text-2xl font-bold text-slate-900">{ac.quranHeading}</h2>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {ac.quranLevels.map((l, i) => (
            <article
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-lg"
              style={{ borderTop: "4px solid #0b5d3a" }}
            >
              <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-2xl">
                {l.icon}
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{l.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{l.text}</p>
              {l.note && (
                <p className="mt-4 rounded-xl border-l-4 border-gold-400 bg-gold-50 px-3 py-2 text-xs text-slate-600">
                  {l.note}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Programs from courses */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-gold-400 text-sm font-bold text-brand-900">
              ০২
            </span>
            <h2 className="text-2xl font-bold text-slate-900">{ac.programsHeading}</h2>
          </div>
          <ProgramsToggle courses={courses} syllabusDocs={syllabusDocs} />
        </div>
      </section>

      {/* Dawah class section */}
      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-gold-400 text-sm font-bold text-brand-900">
            ০৩
          </span>
          <h2 className="text-2xl font-bold text-slate-900">{ac.dawahHeading}</h2>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <RichText html={ac.dawahIntro} className="text-slate-600" />
        </div>
      </section>
    </div>
  );
}
