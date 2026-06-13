import { getContent } from "@/lib/content";
import { PublicHero } from "@/components/public-hero";
import { ContactForm } from "./contact-form";

export default async function ContactPage() {
  const c = await getContent("contact");

  return (
    <div>
      <PublicHero title={c.heroTitle} body={c.heroBody} />

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
          {/* Left: branches + hours */}
          <div className="space-y-6">
            <div className="rounded-2xl border-t-4 border-brand-700 bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-lg font-bold text-brand-800">
                📍 {c.branchesHeading}
              </h3>
              <div className="mt-4 space-y-4">
                {c.branches.map((b, i) => (
                  <div key={i}>
                    <p className="text-sm font-semibold text-gold-700">{b.name}</p>
                    <p className="text-sm text-slate-600">{b.address}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
                {c.phone && <p className="text-slate-700">📞 {c.phone}</p>}
                {c.email && <p className="text-brand-700">✉️ {c.email}</p>}
              </div>
            </div>

            <div className="rounded-2xl border-t-4 border-gold-400 bg-brand-800 p-6 text-white shadow-sm">
              <h3 className="text-lg font-bold text-gold-300">{c.hoursTitle}</h3>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-brand-50/80">{c.hoursDays}</span>
                <span className="font-semibold">{c.hoursTime}</span>
              </div>
              {c.emergencyPhone && (
                <div className="mt-4 border-t border-white/10 pt-4 text-sm">
                  <p className="text-brand-50/70">{c.emergencyLabel}</p>
                  <p className="mt-1 font-semibold">💬 {c.emergencyPhone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: form */}
          <div className="rounded-2xl border-t-4 border-gold-400 bg-white p-7 shadow-sm">
            <h3 className="text-2xl font-bold text-brand-800">{c.formTitle}</h3>
            {c.formNote && <p className="mt-1 text-sm text-slate-500">{c.formNote}</p>}
            <div className="mt-5">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
