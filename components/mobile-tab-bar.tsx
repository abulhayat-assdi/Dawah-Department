"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { clsx } from "@/lib/utils";
import type { ALL_PAGES } from "@/lib/constants";

type NavItem = (typeof ALL_PAGES)[number];

/**
 * Bottom tab bar — the single biggest reason the installed app reads as native
 * rather than as a website in a frame. Phones only; the sidebar takes over
 * from `lg` up.
 *
 * It surfaces the first four entries of the user's own nav (which is already
 * role-filtered upstream) and hands the full list to the drawer behind "More".
 */
export function MobileTabBar({
  items,
  counts,
  pathname,
  onMore,
  moreBadge,
}: {
  items: NavItem[];
  counts: Record<string, number>;
  pathname: string;
  onMore: () => void;
  /** Unread total for everything not shown as its own tab. */
  moreBadge: number;
}) {
  return (
    <nav
      data-app-chrome
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-safe backdrop-blur lg:hidden"
    >
      <div className="flex h-16 items-stretch">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          const count = counts[item.href] ?? 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                // `min-w-0` is what lets flex-1 actually shrink — without it a
                // long label sets the item's floor width and bleeds sideways.
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 transition active:scale-95",
                active ? "text-brand-700" : "text-slate-500",
              )}
            >
              <span className="relative">
                <span
                  className={clsx(
                    "grid size-8 place-items-center rounded-lg transition",
                    active && "bg-brand-50",
                  )}
                >
                  <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                </span>
                {count > 0 && (
                  <span
                    aria-label={`${count} new`}
                    className="absolute -right-1.5 -top-1 grid min-w-[17px] place-items-center rounded-full bg-gold-400 px-1 text-[10px] font-bold text-brand-900"
                  >
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </span>
              <span
                className={clsx(
                  "w-full truncate text-center text-[10px] leading-none",
                  active ? "font-bold" : "font-medium",
                )}
              >
                {item.short ?? item.label}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onMore}
          aria-label="More pages"
          className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-slate-500 transition active:scale-95"
        >
          <span className="relative">
            <span className="grid size-8 place-items-center rounded-lg">
              <Menu size={20} strokeWidth={2} />
            </span>
            {moreBadge > 0 && (
              <span
                aria-label={`${moreBadge} new`}
                className="absolute -right-1.5 -top-1 grid min-w-[17px] place-items-center rounded-full bg-gold-400 px-1 text-[10px] font-bold text-brand-900"
              >
                {moreBadge > 9 ? "9+" : moreBadge}
              </span>
            )}
          </span>
          <span className="text-[10px] font-medium leading-none">More</span>
        </button>
      </div>
    </nav>
  );
}
