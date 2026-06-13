import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getContent } from "@/lib/content";
import { PublicHero } from "@/components/public-hero";
import { Reveal } from "@/components/reveal";
import type { Campus } from "@/lib/types";

export default async function ActivitiesPage() {
  const [act, supabase] = await Promise.all([getContent("activities"), createClient()]);
  const { data } = await supabase.from("campuses").select("*").order("name");
  const campuses = (data ?? []) as Campus[];

  return (
    <div>
      <PublicHero title={act.heroTitle} body={act.heroBody} />

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        {campuses.length === 0 ? (
          <p className="text-center text-slate-400">শীঘ্রই ক্যাম্পাসের তথ্য যুক্ত হবে।</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {campuses.map((c, i) => (
              <Reveal
                key={c.id}
                delay={i * 90}
                as="article"
                className="overflow-hidden rounded-2xl border border-t-4 border-slate-200 border-t-brand-700 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-lg"
              >
                <div className="bg-brand-50/60">
                  {c.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image_url} alt={c.name} className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="grid aspect-video place-items-center text-5xl text-brand-200">
                      🏫
                    </div>
                  )}
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-lg font-bold text-slate-900">{c.name}</h3>
                  {c.address && <p className="mt-1 text-sm text-slate-500">{c.address}</p>}
                  <Link
                    href={`/activities/${c.id}`}
                    className="mt-4 block rounded-xl border border-gold-400 px-4 py-2.5 text-sm font-semibold text-gold-700 hover:bg-gold-50"
                  >
                    বিস্তারিত কার্যক্রম →
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
