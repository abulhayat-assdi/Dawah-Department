"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clsx } from "@/lib/utils";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { ALL_PAGES } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { allRoles } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useNavNotificationCounts } from "@/components/nav-notifications";
import { HeaderDateTime } from "@/components/datetime";
import { Avatar } from "@/components/avatar";
import { RoleBadges } from "@/components/role-badges";

export function AppShell({
  profile,
  navHrefs,
  children,
}: {
  profile: Profile;
  navHrefs: string[];
  children: React.ReactNode;
}) {
  const nav = navHrefs
    .map((href) => ALL_PAGES.find((item) => item.href === href))
    .filter((item): item is (typeof ALL_PAGES)[number] => item != null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  // Unread counts per sidebar entry; the page you are on clears its own badge.
  const counts = useNavNotificationCounts(profile.id, navHrefs, pathname);

  // The phone tab bar shows the first four entries; "More" opens this drawer
  // for the rest and carries their combined badge.
  const tabItems = nav.slice(0, 4);
  const moreBadge = nav
    .slice(4)
    .reduce((total, item) => total + (counts[item.href] ?? 0), 0);

  // A drawer over a still-scrollable page is the classic mobile-web tell, and
  // on iOS the body scrolls *behind* the overlay under your finger.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Close the drawer on Escape (hardware keyboards, and desktop parity).
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh-safe lg:grid lg:grid-cols-[264px_1fr]">
      {/* Sidebar — clean white with colored icons */}
      <aside
        data-app-chrome
        aria-label="Sidebar"
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-slate-200 bg-white pb-safe pt-safe transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand logo box */}
        <div className="p-3">
          <div className="brand-showcase flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-sm">
            <span className="grid size-10 place-items-center rounded-xl bg-gold-400 text-xl text-brand-900">
              ☪
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight text-white">
                Dawah Department
              </p>
              <p className="text-[10px] text-gold-200">ASSDI · ADIMS</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-3">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            const count = counts[item.href] ?? 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  // The selected entry is a solid emerald pill with a gold
                  // edge (`before:`), so it reads as selected at a glance.
                  "relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-sm font-medium transition",
                  "before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:transition",
                  active
                    ? "bg-brand-600 font-semibold text-white shadow-[0_8px_18px_-8px_var(--color-brand-700)] before:bg-gold-400"
                    : "text-slate-600 before:bg-transparent hover:bg-slate-50",
                )}
              >
                <span
                  className={clsx(
                    "grid size-8 shrink-0 place-items-center rounded-lg transition",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  <Icon size={18} strokeWidth={2} />
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {count > 0 && (
                  <span
                    aria-label={`${count} new`}
                    className="grid min-w-[20px] shrink-0 place-items-center rounded-full bg-gold-400 px-1.5 py-0.5 text-[11px] font-bold text-brand-900 shadow-sm"
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer — user + logout */}
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-2">
            <Avatar name={profile.full_name} photoUrl={profile.photo_url} size={36} />
            <button
              onClick={signOut}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              ⏻ Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop on mobile — above the tab bar (z-30) so that dims too, but
          below the drawer itself (z-40). */}
      {open && (
        <div
          className="fixed inset-0 z-[35] bg-brand-900/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex min-h-dvh-safe flex-col">
        {/*
          `pt-safe` on the bar and a fixed-height row inside keeps the header
          exactly 64px tall while still clearing the notch when the app runs
          full-bleed (viewport-fit=cover).
        */}
        <header
          data-app-chrome
          className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-safe pt-safe backdrop-blur"
        >
          <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                className="grid size-9 place-items-center rounded-xl border border-slate-200 lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Menu"
                aria-expanded={open}
              >
                ☰
              </button>
              <h1 className="truncate text-lg font-bold text-slate-900">
                Internal Portal
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:block">
                <HeaderDateTime />
              </div>
              <div className="flex items-center gap-2.5">
                <div className="hidden text-right leading-tight sm:block">
                  <p className="text-sm font-semibold text-slate-900">
                    {profile.full_name || "User"}
                  </p>
                  <RoleBadges roles={allRoles(profile)} className="justify-end" />
                </div>
                <Avatar
                  name={profile.full_name}
                  photoUrl={profile.photo_url}
                  size={36}
                />
              </div>
            </div>
          </div>
        </header>

        {/*
          The bottom padding clears the fixed phone tab bar (plus the home
          indicator underneath it); the side padding clears a landscape notch.
          `lg:p-6` resets all of it once the tab bar is gone.
        */}
        <main className="min-w-0 flex-1 p-4 pb-[calc(1rem+var(--tab-bar-h)+var(--safe-bottom))] pl-[calc(1rem+var(--safe-left))] pr-[calc(1rem+var(--safe-right))] lg:p-6">
          {children}
        </main>
      </div>

      <MobileTabBar
        items={tabItems}
        counts={counts}
        pathname={pathname}
        moreBadge={moreBadge}
        onMore={() => setOpen(true)}
      />
    </div>
  );
}
