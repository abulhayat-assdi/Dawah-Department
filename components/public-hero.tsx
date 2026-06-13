/** Dark-green hero band used at the top of inner public pages. */
export function PublicHero({
  eyebrow,
  title,
  highlight,
  body,
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  body?: string;
}) {
  return (
    <section className="brand-showcase">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center lg:px-6">
        {eyebrow && (
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-gold-300">
            {eyebrow}
          </p>
        )}
        <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
          {title} {highlight && <span className="text-gold-400">{highlight}</span>}
        </h1>
        {body && (
          <p className="mx-auto mt-5 max-w-2xl text-lg text-brand-50/90">{body}</p>
        )}
      </div>
    </section>
  );
}

/** Centered eyebrow + heading used to open light sections. */
export function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow?: string;
  title: string;
}) {
  return (
    <div className="text-center">
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h2>
      <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gold-400" />
    </div>
  );
}
