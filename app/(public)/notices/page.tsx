import { createClient } from "@/lib/supabase/server";
import { getContent } from "@/lib/content";
import { PublicHero } from "@/components/public-hero";
import { Reveal } from "@/components/reveal";
import { formatDate } from "@/lib/utils";
import type { Notice } from "@/lib/types";

export default async function PublicNoticesPage() {
  const [n, supabase] = await Promise.all([getContent("notices"), createClient()]);
  const { data } = await supabase
    .from("notices")
    .select("*")
    .order("created_at", { ascending: false });
  const notices = (data ?? []) as Notice[];

  return (
    <div>
      <PublicHero title={n.heroTitle} body={n.heroBody} />

      <section className="mx-auto max-w-4xl px-4 py-16 lg:px-6">
        {notices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
            <p className="text-3xl">📭</p>
            <p className="mt-2 text-sm font-medium text-slate-500">এখনো কোনো নোটিশ প্রকাশিত হয়নি</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((nt, i) => (
              <Reveal
                key={nt.id}
                delay={i * 60}
                as="article"
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold text-slate-900">{nt.title}</h3>
                {nt.body && <p className="mt-2 text-slate-600">{nt.body}</p>}
                <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-400">
                  <span>📅</span>
                  {formatDate(nt.created_at)}
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
