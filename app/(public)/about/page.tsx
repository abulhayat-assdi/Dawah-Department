import Link from "next/link";
import { getContent } from "@/lib/content";
import { PublicHero, SectionHeading } from "@/components/public-hero";
import { RichText } from "@/components/rich-text";

export default async function AboutPage() {
  const a = await getContent("about");

  return (
    <div>
      <PublicHero
        eyebrow={a.heroEyebrow}
        title={a.heroTitle}
        highlight={a.heroHighlight}
        body={a.heroBody}
      />

      {/* Vision + Mission + image */}
      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-2xl border-l-4 border-brand-700 bg-white p-6 shadow-sm">
              <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-2xl">🎯</span>
              <h3 className="mt-4 text-lg font-bold text-brand-800">{a.visionTitle}</h3>
              <p className="mt-2 italic text-slate-600">{a.visionText}</p>
            </div>
            <div className="rounded-2xl border-l-4 border-gold-400 bg-white p-6 shadow-sm">
              <span className="grid size-12 place-items-center rounded-xl bg-gold-100 text-2xl">👁️</span>
              <h3 className="mt-4 text-lg font-bold text-brand-800">{a.missionTitle}</h3>
              <p className="mt-2 text-slate-600">{a.missionText}</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-gold-300 bg-slate-100 shadow-sm">
            {a.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.image} alt="" className="h-full min-h-72 w-full object-cover" />
            ) : (
              <div className="grid h-full min-h-72 place-items-center text-slate-300">
                <span className="text-6xl">🕌</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Plan — two categories */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <SectionHeading eyebrow={a.planEyebrow} title={a.planTitle} />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {[a.cat1, a.cat2].map((c, i) => (
              <article
                key={i}
                className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-lg"
                style={{ borderTop: `4px solid ${i === 0 ? "#0b5d3a" : "#d4af37"}` }}
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">
                  {c.tag}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">{c.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{c.text}</p>
                <ul className="mt-5 space-y-2.5">
                  {c.items.map((it, j) => (
                    <li key={j} className="flex items-center gap-2.5 font-medium text-slate-700">
                      <span className="text-gold-600">🎓</span>
                      {it}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Values — dark */}
      <section className="brand-showcase py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[1fr_2fr] lg:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-300">
              {a.valuesEyebrow}
            </p>
            <h2 className="mt-2 text-4xl font-bold leading-tight text-white">
              {a.valuesTitle} <span className="text-gold-400">{a.valuesHighlight}</span>
            </h2>
            <div className="mt-4 text-brand-50/90">
              <RichText html={a.valuesBody} className="prose-invert text-brand-50/90" />
            </div>
            <Link
              href={a.valuesCtaHref}
              className="mt-6 inline-flex rounded-xl bg-gold-400 px-5 py-3 text-sm font-bold text-brand-900 hover:bg-gold-500"
            >
              {a.valuesCtaLabel}
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {a.values.map((v, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/10"
              >
                <span className="text-2xl text-gold-300">{v.icon}</span>
                <h3 className="mt-3 font-bold text-white">{v.title}</h3>
                <p className="mt-1.5 text-sm text-brand-50/75">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
