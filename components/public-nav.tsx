"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clsx } from "@/lib/utils";
import type { SiteContentMap } from "@/lib/content";

type Site = SiteContentMap["site"];

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/faculty", label: "Faculty" },
  { href: "/academic", label: "Academic" },
  { href: "/activities", label: "Dawah Activities" },
  { href: "/notices", label: "Notice Board" },
  { href: "/contact", label: "Contact" },
];

export function PublicNav({ site }: { site: Site }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Top contact bar */}
      <div className="bg-brand-800 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-1.5 text-[11px] lg:px-6">
          <span className="truncate">{site.instituteName}</span>
          <span className="hidden shrink-0 gap-3 text-gold-200 sm:flex">
            <span>ইমেইল: {site.email}</span>
            <span className="text-white/30">|</span>
            <span>ফোন: {site.phone}</span>
          </span>
        </div>
      </div>

      {/* Main nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 lg:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-brand-700 text-xl font-bold text-gold-300 ring-2 ring-gold-400/40">
              S
            </span>
            <span className="leading-tight">
              <span className="block font-arabic text-xl font-bold text-brand-800">
                {site.brandTitle}
              </span>
              <span className="block text-[10px] font-semibold tracking-widest text-slate-500">
                {site.brandSubtitle}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive(l.href)
                    ? "text-brand-700 underline decoration-gold-400 decoration-2 underline-offset-8"
                    : "text-slate-600 hover:text-brand-700",
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={site.ctaHref}
              className="ml-2 rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-bold text-brand-900 shadow-sm ring-1 ring-gold-600/20 hover:bg-gold-500"
            >
              {site.ctaLabel}
            </Link>
          </nav>

          <button
            className="grid size-10 place-items-center rounded-xl border border-slate-200 text-xl lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={site.ctaHref}
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-xl bg-gold-400 px-4 py-2.5 text-center text-sm font-bold text-brand-900"
            >
              {site.ctaLabel}
            </Link>
          </div>
        )}
      </header>
    </>
  );
}

export function PublicFooter({ site }: { site: Site }) {
  return (
    <footer className="border-t border-slate-200 bg-brand-900 text-brand-50">
      <div className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="font-arabic text-2xl font-bold text-gold-300">
            {site.brandTitle}
          </span>
          <p className="text-sm text-brand-100/80">{site.brandSubtitle}</p>
          <nav className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-brand-100/90 hover:text-gold-300">
                {l.label}
              </Link>
            ))}
          </nav>
          <p className="mt-4 text-xs text-brand-100/60">{site.footer}</p>
        </div>
      </div>
    </footer>
  );
}
