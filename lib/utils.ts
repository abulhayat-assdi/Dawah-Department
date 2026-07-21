/** Tiny classnames helper (avoids a dependency). */
export function clsx(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Legacy numeral formatter — the UI is English now, so this just returns the
 * value as a string. Kept so existing call sites stay valid.
 */
export function toBn(value: number | string): string {
  return String(value);
}

/** Formats a "YYYY-MM" month key as e.g. "August 2026". */
export function formatMonth(key?: string | null): string {
  if (!key) return "—";
  const [y, m] = key.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return "—";
  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${MONTHS[m - 1]} ${y}`;
}

/** Formats a Postgres time ("HH:MM" or "HH:MM:SS") as e.g. "9:00 AM". */
export function formatTime(t?: string | null): string {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? 0);
  if (Number.isNaN(h)) return "";
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(Number.isNaN(m) ? 0 : m).padStart(2, "0")} ${ampm}`;
}

/** Trims a Postgres time value down to "HH:MM" for <input type="time">. */
export function toTimeInput(t?: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":");
  if (h === undefined || m === undefined) return "";
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

/** Formats an ISO date as a dd/mm/yyyy string. */
export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}
