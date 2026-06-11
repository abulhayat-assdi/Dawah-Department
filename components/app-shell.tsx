"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clsx } from "@/lib/utils";
import { ADMIN_NAV, TEACHER_NAV, ROLE_LABEL } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/notification-bell";

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const nav = profile.role === "super_admin" ? ADMIN_NAV : TEACHER_NAV;

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      {/* Sidebar — forest green with a subtle Islamic geometric backdrop */}
      <aside
        className={clsx(
          "islamic-pattern fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col bg-brand-800 text-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <span className="grid size-10 place-items-center rounded-xl bg-gold-400 text-xl text-brand-900 shadow-sm">
            ☪
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-white">
              Dawah Department
            </p>
            <p className="text-[11px] text-gold-200">
              ASSDI · As-Sunnah Skill Development Institute
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-gold-400 text-brand-900 shadow-sm"
                    : "text-brand-50/90 hover:bg-white/10",
                )}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Calligraphy footer */}
        <div className="border-t border-white/10 px-5 py-4 text-center">
          <p
            className="font-arabic text-2xl leading-none text-gold-300"
            dir="rtl"
            aria-label="Bismillah"
          >
            ﷽
          </p>
          <p className="mt-1.5 text-[11px] text-brand-100/70">
            In the name of Allah, the Most Gracious
          </p>
        </div>
      </aside>

      {/* Backdrop on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-brand-900/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:px-6">
          <button
            className="grid size-9 place-items-center rounded-xl border border-slate-200 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Menu"
          >
            ☰
          </button>

          <div className="ml-auto flex items-center gap-3">
            <NotificationBell userId={profile.id} />
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-slate-900">
                {profile.full_name || "User"}
              </p>
              <p className="text-[11px] text-slate-500">
                {ROLE_LABEL[profile.role]}
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {(profile.full_name || "U").slice(0, 1)}
            </span>
            <button
              onClick={signOut}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
