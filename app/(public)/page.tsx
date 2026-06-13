import Link from "next/link";
import { getContent } from "@/lib/content";
import { RichText } from "@/components/rich-text";
import { Reveal } from "@/components/reveal";
import { CountUp } from "@/components/count-up";

export default async function PublicHome() {
  const home = await getContent("home");

  return (
    <div>
      {/* Hero */}
      <section className="brand-showcase relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-20 lg:grid-cols-2 lg:px-6">
          <div>
            <p className="animate-fade-up mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-gold-300">
              {home.heroEyebrow}
            </p>
            <h1
              className="animate-fade-up text-4xl font-bold leading-tight text-white sm:text-5xl"
              style={{ animationDelay: "0.1s" }}
            >
              {home.heroTitlePre}{" "}
              <span className="text-gold-400">{home.heroTitleHighlight}</span>{" "}
              {home.heroTitlePost}
            </h1>
            <p
              className="animate-fade-up mt-6 text-lg italic text-brand-50/90"
              style={{ animationDelay: "0.2s" }}
            >
              {home.heroQuote}
            </p>
            <Link
              href={home.heroCtaHref}
              className="animate-fade-up mt-8 inline-flex items-center gap-2 rounded-xl bg-gold-400 px-6 py-3.5 text-sm font-bold text-brand-900 shadow-sm ring-1 ring-gold-600/20 transition hover:-translate-y-0.5 hover:bg-gold-500"
              style={{ animationDelay: "0.3s" }}
            >
              {home.heroCtaLabel} <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="relative grid place-items-center">
            <span
              className="animate-fade-up font-arabic text-[10rem] leading-none text-gold-400/80 drop-shadow-lg sm:text-[13rem]"
              dir="rtl"
              style={{ animationDelay: "0.2s" }}
            >
              {home.heroCalligraphy}
            </span>
            <div
              className="animate-fade-up absolute bottom-2 left-2 rounded-2xl border border-white/15 bg-brand-900/50 px-5 py-4 backdrop-blur"
              style={{ animationDelay: "0.45s" }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-gold-300">
                {home.sideTitle}
              </p>
              <p className="mt-1 font-arabic text-lg text-white">{home.sideText}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip (overlapping) */}
      <section className="mx-auto -mt-12 max-w-6xl px-4 lg:px-6">
        <Reveal className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:grid-cols-3">
          {home.stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center py-4 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-brand-50 text-2xl">
                {s.icon}
              </span>
              <p className="mt-3 text-sm font-medium text-slate-500">{s.label}</p>
              <p className="mt-1 text-3xl font-bold text-brand-700">
                <CountUp value={s.value} />
              </p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {home.features.map((f, i) => (
            <Reveal key={i} delay={i * 120}>
              <article
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-lg"
                style={{
                  borderTop: `4px solid ${f.accent === "gold" ? "#d4af37" : "#0b5d3a"}`,
                }}
              >
                <span
                  className={`grid size-14 place-items-center rounded-2xl text-2xl ${
                    f.accent === "gold"
                      ? "bg-gold-100 text-gold-700"
                      : "bg-brand-50 text-brand-700"
                  }`}
                >
                  {f.icon}
                </span>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                  {f.text}
                </p>
                <Link
                  href={f.href}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold-700 hover:text-gold-800"
                >
                  {f.linkLabel} <span aria-hidden>→</span>
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Mission split */}
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2 lg:px-6">
          <Reveal className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
            {home.missionImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={home.missionImage}
                alt=""
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="grid aspect-[4/3] place-items-center text-slate-300">
                <span className="text-6xl">🏛️</span>
              </div>
            )}
          </Reveal>
          <Reveal delay={150}>
            <p className="mb-3 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              {home.missionEyebrow}
            </p>
            <h2 className="text-3xl font-bold leading-snug text-slate-900">
              {home.missionTitle}
            </h2>
            <RichText html={home.missionBody} className="mt-4 text-slate-600" />
            <ul className="mt-6 space-y-3">
              {home.missionChecklist.map((c, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-100 text-sm text-brand-700">
                    ✓
                  </span>
                  {c}
                </li>
              ))}
            </ul>
            <Link
              href={home.missionCtaHref}
              className="mt-7 inline-flex items-center gap-1 font-semibold text-gold-700 hover:text-gold-800"
            >
              {home.missionCtaLabel} <span aria-hidden>→</span>
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
