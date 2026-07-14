"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clsx } from "@/lib/utils";
import { ADMIN_NAV, COORDINATOR_NAV, TEACHER_NAV, ROLE_LABEL } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/notification-bell";
import { HeaderDateTime } from "@/components/datetime";
import { Avatar } from "@/components/avatar";

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
  const nav =
    profile.role === "super_admin"
      ? ADMIN_NAV
      : profile.role === "coordinator"
        ? COORDINATOR_NAV
        : TEACHER_NAV;

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      {/* Sidebar — clean white with colored icons */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-slate-200 bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
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

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-3">
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
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <span
                  className={clsx(
                    "grid size-8 place-items-center rounded-lg text-base transition",
                    active ? "bg-brand-100" : "bg-slate-100",
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
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

      {/* Backdrop on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-brand-900/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-6">
          <div className="flex items-center gap-3">
            <button
              className="grid size-9 place-items-center rounded-xl border border-slate-200 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Menu"
            >
              ☰
            </button>
            <h1 className="text-lg font-bold text-slate-900">Internal Portal</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <HeaderDateTime />
            </div>
            <NotificationBell userId={profile.id} />
            <div className="flex items-center gap-2.5">
              <div className="hidden text-right leading-tight sm:block">
                <p className="text-sm font-semibold text-slate-900">
                  {profile.full_name || "User"}
                </p>
                <p className="text-[11px] text-slate-500">
                  {ROLE_LABEL[profile.role]}
                </p>
              </div>
              <Avatar name={profile.full_name} photoUrl={profile.photo_url} size={36} />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
