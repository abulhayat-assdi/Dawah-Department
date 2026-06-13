"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/avatar";
import { RichText } from "@/components/rich-text";
import { Reveal } from "@/components/reveal";
import { clsx } from "@/lib/utils";
import type { Faculty } from "@/lib/types";

export function FacultyList({ members }: { members: Faculty[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = members.find((m) => m.id === openId) ?? null;
  const featured = members.find((m) => m.featured);
  const rest = members.filter((m) => m.id !== featured?.id);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenId(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (members.length === 0) {
    return <p className="text-center text-slate-400">শীঘ্রই শিক্ষকদের তথ্য যুক্ত হবে।</p>;
  }

  return (
    <>
      {featured && (
        <div className="mx-auto mb-10 max-w-sm">
          <Card member={featured} featured onOpen={() => setOpenId(featured.id)} />
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((m, i) => (
          <Reveal key={m.id} delay={i * 90}>
            <Card member={m} onOpen={() => setOpenId(m.id)} />
          </Reveal>
        ))}
      </div>

      {open && <PortfolioModal member={open} onClose={() => setOpenId(null)} />}
    </>
  );
}

function Card({
  member,
  featured,
  onOpen,
}: {
  member: Faculty;
  featured?: boolean;
  onOpen: () => void;
}) {
  return (
    <article className="h-full overflow-hidden rounded-2xl border-t-4 border-gold-400 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-lg">
      <div className="grid place-items-center bg-brand-50/60 py-8">
        <Avatar name={member.name} photoUrl={member.photo_url} size={featured ? 130 : 112} />
      </div>
      <div className="bg-brand-900 p-5 text-center">
        <h3 className="text-lg font-bold text-white">{member.name}</h3>
        {member.designation && (
          <span className="mt-2 inline-block rounded-md bg-gold-400 px-3 py-1 text-xs font-bold text-brand-900">
            {member.designation}
          </span>
        )}
        <button
          onClick={onOpen}
          className="mt-4 block w-full rounded-xl border border-gold-400/70 px-4 py-2.5 text-sm font-semibold text-gold-300 transition hover:bg-gold-400 hover:text-brand-900"
        >
          পার্সোনাল পোর্টফোলিও
        </button>
      </div>
    </article>
  );
}

function PortfolioModal({ member, onClose }: { member: Faculty; onClose: () => void }) {
  const rows = [
    member.background && { icon: "🕘", title: "ঐতিহাসিক পটভূমি", text: member.background },
    member.location && { icon: "📍", title: "জন্মস্থান", text: member.location },
  ].filter(Boolean) as { icon: string; title: string; text: string }[];

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-brand-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-fade-up relative grid max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-gold-400 text-lg font-bold text-brand-900 shadow hover:bg-gold-500"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Left: photo + name overlay */}
        <div className="relative min-h-72 bg-brand-50">
          {member.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center">
              <Avatar name={member.name} photoUrl={null} size={140} />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-950 via-brand-900/80 to-transparent p-6 pt-16 text-center">
            <h2 className="text-2xl font-bold text-white">{member.name}</h2>
            {member.designation && (
              <p className="mt-1 font-semibold text-gold-300">{member.designation}</p>
            )}
          </div>
        </div>

        {/* Right: details */}
        <div className="space-y-6 overflow-y-auto p-7">
          {rows.map((r, i) => (
            <div key={i} className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-50 text-lg">
                {r.icon}
              </span>
              <div>
                <h3 className="font-bold text-brand-800">{r.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{r.text}</p>
              </div>
            </div>
          ))}

          {member.bio && (
            <div className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-50 text-lg">
                📄
              </span>
              <div className={clsx(rows.length === 0 && "pt-1")}>
                <h3 className="font-bold text-brand-800">সম্পূর্ণ বায়োডাটা</h3>
                <RichText html={member.bio} className="mt-1 text-sm text-slate-600" />
              </div>
            </div>
          )}

          {rows.length === 0 && !member.bio && (
            <p className="text-sm text-slate-400">বিস্তারিত তথ্য শীঘ্রই যুক্ত হবে।</p>
          )}
        </div>
      </div>
    </div>
  );
}
