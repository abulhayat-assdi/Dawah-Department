import { createClient } from "@/lib/supabase/server";
import { getContent } from "@/lib/content";
import { PublicHero } from "@/components/public-hero";
import { RichText } from "@/components/rich-text";
import type { SyllabusDocument } from "@/lib/types";

export default async function AcademicPage() {
  const [ac, supabase] = await Promise.all([getContent("academic"), createClient()]);
  const { data: syllabusData } = await supabase
    .from("syllabus_documents")
    .select("*")
    .not("url", "is", null)
    .order("sort_order");
  const syllabusDocs = (syllabusData ?? []) as SyllabusDocument[];

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

      {/* Student syllabus library */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-gold-400 text-sm font-bold text-brand-900">
              ০২
            </span>
            <h2 className="text-2xl font-bold text-slate-900">{ac.programsHeading}</h2>
          </div>
          <div className="mb-6 flex justify-center">
            <span className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
              শিক্ষার্থী সিলেবাস
            </span>
          </div>
          {syllabusDocs.length === 0 ? (
            <p className="text-center text-slate-400">এখনো কোনো সিলেবাস যুক্ত হয়নি।</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {syllabusDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex aspect-square flex-col items-center rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex flex-1 flex-col items-center justify-center gap-3">
                    <span className="grid size-14 place-items-center rounded-xl bg-brand-50 text-2xl">
                      📄
                    </span>
                    <p className="line-clamp-3 text-sm font-semibold text-slate-800">
                      {doc.title}
                    </p>
                  </div>
                  <div className="grid w-full grid-cols-2 gap-2">
                    <a
                      href={doc.url!}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-800"
                    >
                      View
                    </a>
                    <a
                      href={doc.url!}
                      download
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
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
