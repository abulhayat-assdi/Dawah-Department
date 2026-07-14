"use client";

import { useState } from "react";
import { clsx } from "@/lib/utils";
import type { Course } from "@/lib/types";

const CAT_LABEL: Record<string, string> = {
  alem: "আলেম",
  general: "সাধারণ",
  common: "সবার জন্য",
};

const SYLLABUS_LABEL: Record<string, string> = {
  quran: "কুরআন ক্লাস সিলেবাস",
  general: "জেনারেল ক্লাস সিলেবাস",
  dawah: "দাওয়াহ ক্লাস সিলেবাস",
};

export function ProgramsToggle({
  courses,
  syllabusDocs = [],
}: {
  courses: Course[];
  syllabusDocs?: { course_id: string; syllabus_kind: string; url: string }[];
}) {
  const [tab, setTab] = useState<"general" | "student">("general");
  const shown = courses.filter((c) =>
    tab === "general" ? c.category !== "alem" : c.category !== "general",
  );

  return (
    <div>
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {(
            [
              ["general", "সাধারণ সিলেবাস"],
              ["student", "শিক্ষার্থী সিলেবাস"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={clsx(
                "rounded-lg px-4 py-2 text-sm font-semibold transition",
                tab === key ? "bg-brand-700 text-white" : "text-slate-600 hover:bg-slate-50",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-center text-slate-400">এই সিলেবাসে কোনো কোর্স যুক্ত হয়নি।</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {shown.map((c) => {
            const docs = syllabusDocs.filter((d) => d.course_id === c.id);
            return (
              <article
                key={c.id}
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-gold-100 px-2.5 py-1 text-xs font-semibold text-gold-800">
                    {CAT_LABEL[c.category] ?? c.category}
                  </span>
                  {c.duration_label && (
                    <span className="text-xs text-slate-400">🕐 {c.duration_label}</span>
                  )}
                </div>
                <h3 className="mt-3 text-xl font-bold text-slate-900">{c.name}</h3>
                {c.description && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {c.description}
                  </p>
                )}
                {docs.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {docs.map((d) => (
                      <a
                        key={d.syllabus_kind}
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                      >
                        📄 {SYLLABUS_LABEL[d.syllabus_kind] ?? d.syllabus_kind}
                      </a>
                    ))}
                  </div>
                )}
                <span className="pointer-events-none absolute bottom-3 right-3 text-[10px] font-bold uppercase tracking-widest text-slate-200">
                  {c.abbreviation}
                </span>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
