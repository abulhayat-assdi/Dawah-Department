"use client";

import { useEffect, useState } from "react";

// Hijri (Umm al-Qura) — e.g. "Dhuʻl-Hijjah 26, 1447 AH"
function hijri(d: Date): string {
  return new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

// Gregorian — e.g. "Thursday, June 11, 2026"
function gregorian(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

// Live time — e.g. "07:42:15 PM"
function clock(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(d);
}

function useNow(tick = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // Client-only: deferring the first time to mount avoids a hydration
    // mismatch (server time ≠ client time). Not a cascading render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), tick);
    return () => clearInterval(t);
  }, [tick]);
  return now;
}

/** Compact date/time pill for the top header. */
export function HeaderDateTime() {
  const now = useNow();
  if (!now) {
    return <div className="h-9 w-72 animate-pulse rounded-xl bg-slate-100" />;
  }
  return (
    <div className="flex items-center divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 shadow-sm">
      <span className="px-3 py-2 text-brand-700">{hijri(now)}</span>
      <span className="px-3 py-2">{gregorian(now)}</span>
      <span className="px-3 py-2 tabular-nums text-slate-500">
        {clock(now)}
      </span>
    </div>
  );
}

/** Large date + live clock for the green dashboard hero. */
export function HeroClock() {
  const now = useNow();
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-white">
      <span className="flex items-center gap-2 text-base font-semibold sm:text-lg">
        <span>📅</span>
        {now ? gregorian(now) : "—"}
      </span>
      <span className="flex items-center gap-2 text-base font-semibold tabular-nums sm:text-lg">
        <span>🕐</span>
        {now ? clock(now) : "—"}
      </span>
    </div>
  );
}
